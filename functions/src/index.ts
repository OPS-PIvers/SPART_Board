import * as functionsV1 from 'firebase-functions/v1';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import axios, { AxiosError } from 'axios';
import OAuth from 'oauth-1.0a';
import * as CryptoJS from 'crypto-js';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();

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
            } catch (err) {
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

// Move generateWithAI to v2 for better CORS and scaling
export const generateWithAI = onCall(
  {
    secrets: ['GEMINI_API_KEY'],
    memory: '256MiB',
    cors: true, // Explicitly enable CORS
  },
  async (request) => {
    // In v2, context.auth is in request.auth
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('CRITICAL: GEMINI_API_KEY is missing');
      throw new HttpsError(
        'internal',
        'Gemini API Key is missing on the server.'
      );
    }

    const data = request.data as { type: 'mini-app' | 'poll'; prompt: string };

    try {
      console.log(`AI Gen starting for type: ${data.type}`);
      const genAI = new GoogleGenAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3-flash-preview',
        generationConfig: { responseMimeType: 'application/json' },
      });

      if (data.type === 'mini-app') {
        const systemPrompt = `
          You are an expert frontend developer. Create a single-file HTML/JS mini-app based on the user's request.
          Requirements:
          1. Single File (embedded CSS/JS).
          2. Use Tailwind CDN.
          3. Return JSON: { "title": "...", "html": "..." }
        `;

        const result = await model.generateContent(
          systemPrompt + '\n\nUser Request: ' + data.prompt
        );
        const response = await result.response;
        const text = response.text();
        console.log('AI Generation successful (mini-app)');
        return JSON.parse(text);
      } else if (data.type === 'poll') {
        const systemPrompt = `
          You are an expert teacher. Create a 4-option multiple choice poll JSON:
          { "question": "...", "options": ["...", "...", "...", "..."] }
        `;

        const result = await model.generateContent(
          systemPrompt + '\n\nTopic: ' + data.prompt
        );
        const response = await result.response;
        const text = response.text();
        console.log('AI Generation successful (poll)');
        return JSON.parse(text);
      }

      throw new HttpsError('invalid-argument', 'Invalid generation type');
    } catch (error: unknown) {
      console.error('AI Generation Error Details:', error);
      const msg =
        error instanceof Error ? error.message : 'AI Generation failed';
      throw new HttpsError('internal', msg);
    }
  }
);
