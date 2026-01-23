import * as functionsV1 from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import axios, { AxiosError } from 'axios';
import OAuth from 'oauth-1.0a';
import * as CryptoJS from 'crypto-js';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();

interface GeminiAI {
  getGenerativeModel: (args: unknown) => GeminiModel;
}

interface GeminiModel {
  generateContent: (args: unknown) => Promise<GeminiResult>;
}

interface GeminiResult {
  response: {
    text: () => string;
  };
}

interface ClassLinkUser {
  sourcedId: string;
  email: string;
  givenName: string;
  familyName: string;
}

interface ClassLinkClass {
  sourcedId: string;
  title: string;
  classCode?: string;
}

interface ClassLinkStudent {
  sourcedId: string;
  givenName: string;
  familyName: string;
  email: string;
}

interface AIData {
  type: 'mini-app' | 'poll';
  prompt: string;
}

interface GlobalPermConfig {
  dailyLimit?: number;
}

interface GlobalPermission {
  enabled: boolean;
  accessLevel: 'admin' | 'beta' | 'all';
  betaUsers?: string[];
  config?: GlobalPermConfig;
}

/**
 * Generates OAuth 1.0 Headers for ClassLink
 */
function getOAuthHeaders(
  baseUrl: string,
  params: Record<string, string>,
  method: string,
  clientId: string,
  clientSecret: string
) {
  const oauth = new OAuth({
    consumer: {
      key: clientId,
      secret: clientSecret,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string: string, key: string) {
      return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64);
    },
  });

  const request_data = {
    url: baseUrl,
    method: method,
    data: params,
  };

  return oauth.toHeader(oauth.authorize(request_data));
}

// Keep ClassLink on v1 for now as it's working
export const getClassLinkRosterV1 = functionsV1
  .runWith({
    secrets: [
      'CLASSLINK_CLIENT_ID',
      'CLASSLINK_CLIENT_SECRET',
      'CLASSLINK_TENANT_URL',
    ],
    memory: '256MB',
  })
  .https.onCall(
    async (data: unknown, context: functionsV1.https.CallableContext) => {
      if (!context.auth) {
        throw new functionsV1.https.HttpsError(
          'unauthenticated',
          'The function must be called while authenticated.'
        );
      }

      const userEmail = context.auth.token.email;
      if (!userEmail) {
        throw new functionsV1.https.HttpsError(
          'invalid-argument',
          'User must have an email associated with their account.'
        );
      }

      const clientId = process.env.CLASSLINK_CLIENT_ID;
      const clientSecret = process.env.CLASSLINK_CLIENT_SECRET;
      const tenantUrl = process.env.CLASSLINK_TENANT_URL;

      if (!clientId || !clientSecret || !tenantUrl) {
        throw new functionsV1.https.HttpsError(
          'internal',
          'ClassLink configuration is missing on the server.'
        );
      }

      const cleanTenantUrl = tenantUrl.replace(/\/$/, '');

      try {
        const usersBaseUrl = `${cleanTenantUrl}/ims/oneroster/v1p1/users`;
        const userParams = { filter: `email='${userEmail}'` };

        const userHeaders = getOAuthHeaders(
          usersBaseUrl,
          userParams,
          'GET',
          clientId,
          clientSecret
        );

        const userResponse = await axios.get<{ users: ClassLinkUser[] }>(
          usersBaseUrl,
          {
            params: userParams,
            headers: { ...userHeaders },
          }
        );

        const users = userResponse.data.users;

        if (!users || users.length === 0) {
          return { classes: [], studentsByClass: {} };
        }

        const teacherSourcedId = users[0].sourcedId;

        const classesUrl = `${cleanTenantUrl}/ims/oneroster/v1p1/users/${teacherSourcedId}/classes`;
        const classesHeaders = getOAuthHeaders(
          classesUrl,
          {},
          'GET',
          clientId,
          clientSecret
        );

        const classesResponse = await axios.get<{ classes: ClassLinkClass[] }>(
          classesUrl,
          { headers: { ...classesHeaders } }
        );
        const classes = classesResponse.data.classes;

        const studentsByClass: Record<string, ClassLinkStudent[]> = {};

        await Promise.all(
          classes.map(async (cls: ClassLinkClass) => {
            const studentsUrl = `${cleanTenantUrl}/ims/oneroster/v1p1/classes/${cls.sourcedId}/students`;
            const studentsHeaders = getOAuthHeaders(
              studentsUrl,
              {},
              'GET',
              clientId,
              clientSecret
            );
            try {
              const studentsResponse = await axios.get<{
                users: ClassLinkStudent[];
              }>(studentsUrl, { headers: { ...studentsHeaders } });
              studentsByClass[cls.sourcedId] =
                studentsResponse.data.users ?? [];
            } catch {
              studentsByClass[cls.sourcedId] = [];
            }
          })
        );

        return {
          classes,
          studentsByClass,
        };
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          throw new functionsV1.https.HttpsError(
            'internal',
            `Failed to fetch data from ClassLink: ${axiosError.message}`
          );
        }
        throw new functionsV1.https.HttpsError(
          'internal',
          'Failed to fetch data from ClassLink'
        );
      }
    }
  );

// Use v1 for generateWithAI to match the client SDK's expected URL format and ensure reliable CORS
export const generateWithAI = functionsV1
  .runWith({
    secrets: ['GEMINI_API_KEY'],
    memory: '512MB',
  })
  .https.onCall(async (data: AIData, context) => {
    if (!context.auth) {
      throw new functionsV1.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const uid = context.auth.uid;
    const email = context.auth.token.email;

    if (!email) {
      throw new functionsV1.https.HttpsError(
        'invalid-argument',
        'User must have an email associated with their account.'
      );
    }

    const db = admin.firestore();

    // 1. Check global feature permission for gemini-functions
    const globalPermDoc = await db
      .collection('global_permissions')
      .doc('gemini-functions')
      .get();
    const globalPerm = globalPermDoc.exists
      ? (globalPermDoc.data() as GlobalPermission)
      : null;

    // 2. Check if user is an admin
    const adminDoc = await db
      .collection('admins')
      .doc(email.toLowerCase())
      .get();
    const isAdmin = adminDoc.exists;

    // 3. Validate access
    if (globalPerm && !globalPerm.enabled) {
      throw new functionsV1.https.HttpsError(
        'permission-denied',
        'Gemini functions are currently disabled by an administrator.'
      );
    }

    if (!isAdmin) {
      if (globalPerm) {
        const { accessLevel, betaUsers = [] } = globalPerm;
        if (accessLevel === 'admin') {
          throw new functionsV1.https.HttpsError(
            'permission-denied',
            'Gemini functions are currently restricted to administrators.'
          );
        }
        if (
          accessLevel === 'beta' &&
          !betaUsers.includes(email.toLowerCase())
        ) {
          throw new functionsV1.https.HttpsError(
            'permission-denied',
            'You do not have access to Gemini beta functions.'
          );
        }
      }

      // 4. Check and increment daily usage
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const usageRef = db.collection('ai_usage').doc(`${uid}_${today}`);
      const DAILY_LIMIT = globalPerm?.config?.dailyLimit || 20;

      try {
        await db.runTransaction(async (transaction) => {
          const usageDoc = await transaction.get(usageRef);
          const currentUsage = usageDoc.exists
            ? (usageDoc.data()?.count as number) || 0
            : 0;

          if (currentUsage >= DAILY_LIMIT) {
            throw new functionsV1.https.HttpsError(
              'resource-exhausted',
              `Daily AI usage limit reached (${DAILY_LIMIT} generations). Please try again tomorrow.`
            );
          }

          transaction.set(
            usageRef,
            {
              count: currentUsage + 1,
              email: email,
              lastUsed: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        });
      } catch (error) {
        if (error instanceof functionsV1.https.HttpsError) {
          throw error;
        }
        console.error('Usage tracking error:', error);
        throw new functionsV1.https.HttpsError(
          'internal',
          'Failed to verify AI usage limits.'
        );
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('CRITICAL: GEMINI_API_KEY is missing');
      throw new functionsV1.https.HttpsError(
        'internal',
        'Gemini API Key is missing on the server.'
      );
    }

    try {
      console.log(`AI Gen starting for type: ${data.type}`);
      const genAI = new GoogleGenAI({ apiKey }) as unknown as GeminiAI;

      let systemPrompt = '';
      let userPrompt = '';

      if (data.type === 'mini-app') {
        systemPrompt = `
          You are an expert frontend developer. Create a single-file HTML/JS mini-app based on the user's request.
          Requirements:
          1. Single File (embedded CSS/JS).
          2. Use Tailwind CDN.
          3. Return JSON: { "title": "...", "html": "..." }
        `;
        userPrompt = `User Request: ${data.prompt}`;
      } else if (data.type === 'poll') {
        systemPrompt = `
          You are an expert teacher. Create a 4-option multiple choice poll JSON:
          { "question": "...", "options": ["...", "...", "...", "..."] }
        `;
        userPrompt = `Topic: ${data.prompt}`;
      } else {
        throw new functionsV1.https.HttpsError(
          'invalid-argument',
          'Invalid generation type'
        );
      }

      const model = genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
      });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + '\n\n' + userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const text = result.response.text();

      if (!text) {
        throw new Error('Empty response from AI');
      }

      console.log('AI Generation successful');
      return JSON.parse(text) as Record<string, unknown>;
    } catch (error: unknown) {
      console.error('AI Generation Error Details:', error);
      const msg =
        error instanceof Error ? error.message : 'AI Generation failed';
      throw new functionsV1.https.HttpsError('internal', msg);
    }
  });
