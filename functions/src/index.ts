import * as functions from 'firebase-functions/v1';
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
 * Robust version that separates base URL and query parameters
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
    data: params, // Pass params here so the library encodes them for the signature
  };

  return oauth.toHeader(oauth.authorize(request_data));
}

// Version: 1.1.1 - Improved OAuth signature and logging
export const getClassLinkRosterV1 = functions
  .runWith({
    secrets: [
      'CLASSLINK_CLIENT_ID',
      'CLASSLINK_CLIENT_SECRET',
      'CLASSLINK_TENANT_URL',
    ],
    memory: '256MB',
  })
  .https.onCall(
    async (data: unknown, context: functions.https.CallableContext) => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'The function must be called while authenticated.'
        );
      }

      const userEmail = context.auth.token.email;
      if (!userEmail) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'User must have an email associated with their account.'
        );
      }

      const clientId = process.env.CLASSLINK_CLIENT_ID;
      const clientSecret = process.env.CLASSLINK_CLIENT_SECRET;
      const tenantUrl = process.env.CLASSLINK_TENANT_URL;

      if (!clientId || !clientSecret || !tenantUrl) {
        throw new functions.https.HttpsError(
          'internal',
          'ClassLink configuration is missing on the server.'
        );
      }

      const cleanTenantUrl = tenantUrl.replace(/\/$/, '');
      console.log(
        `[ClassLink] Fetching for: ${userEmail} at ${cleanTenantUrl}`
      );

      try {
        // Step 1: Find the user by email
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
          console.warn(`[ClassLink] No user found for email: ${userEmail}`);
          return { classes: [], studentsByClass: {} };
        }

        const teacherSourcedId = users[0].sourcedId;
        console.log(`[ClassLink] Found teacher: ${teacherSourcedId}`);

        // Step 2: Get classes for this teacher
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
        console.log(`[ClassLink] Found ${classes.length} classes`);

        // Step 3: Get students for each class
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
              console.error(
                `[ClassLink] Error fetching students for class ${cls.sourcedId}:`,
                err
              );
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
          const status = axiosError.response?.status;
          console.error(
            `[ClassLink] API Error (${status}):`,
            axiosError.response?.data ?? axiosError.message
          );
          throw new functions.https.HttpsError(
            'internal',
            `Failed to fetch data from ClassLink (${status}): ${axiosError.message}`
          );
        }
        const genericError = error as Error;
        console.error('[ClassLink] Generic Error:', genericError.message);
        throw new functions.https.HttpsError(
          'internal',
          `Failed to fetch data from ClassLink: ${genericError.message}`
        );
      }
    }
  );

export const generateWithAI = functions
  .runWith({
    secrets: ['GEMINI_API_KEY'],
    memory: '256MB',
  })
  .https.onCall(
    async (data: { type: 'mini-app' | 'poll'; prompt: string }, context) => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'The function must be called while authenticated.'
        );
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new functions.https.HttpsError(
          'internal',
          'Gemini API Key is missing on the server.'
        );
      }

      const client = new GoogleGenAI({ apiKey });

      if (data.type === 'mini-app') {
        const systemPrompt = `
        You are an expert frontend developer. Create a single-file HTML/JS mini-app based on the user's request.

        Requirements:
        1.  **Single File:** All CSS and JS must be embedded in <style> and <script> tags.
        2.  **Design:** Use a modern, clean design. You SHOULD use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>.
        3.  **Functionality:** It must be fully functional and interactive.
        4.  **Format:** Return a JSON object with two fields: "title" (a short name for the app) and "html" (the complete HTML code).
        5.  **Responsiveness:** It should fit in a small widget container (responsive, often small).
        6.  **No External Assets:** Do not link to external images unless using placeholders.
        7.  **Safety:** Do not include malicious code.

        Response Format:
        Return ONLY raw JSON. No markdown formatting.
        Example:
        {
          "title": "My App",
          "html": "<!DOCTYPE html>..."
        }
      `;

        try {
          const response = await client.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemPrompt + '\n\nUser Request: ' + data.prompt },
                ],
              },
            ],
            config: { responseMimeType: 'application/json' },
          });
          return JSON.parse(response.text || '{}');
        } catch (error: unknown) {
          const msg =
            error instanceof Error ? error.message : 'AI Generation failed';
          throw new functions.https.HttpsError('internal', msg);
        }
      } else if (data.type === 'poll') {
        const systemPrompt = `
        You are an expert teacher. Create a multiple-choice poll question based on the user's topic.

        Requirements:
        1.  **Educational:** The question should be appropriate for a classroom setting.
        2.  **Clear:** The question should be concise and easy to read.
        3.  **Options:** Provide exactly 4 distinct options. One correct answer (if applicable) and 3 distractors, or 4 valid opinions.
        4.  **Format:** Return a JSON object with two fields: "question" (string) and "options" (array of 4 strings).

        Response Format:
        Return ONLY raw JSON. No markdown formatting.
        Example:
        {
          "question": "What is the capital of France?",
          "options": ["London", "Berlin", "Paris", "Madrid"]
        }
      `;

        try {
          const response = await client.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt + '\n\nTopic: ' + data.prompt }],
              },
            ],
            config: { responseMimeType: 'application/json' },
          });
          return JSON.parse(response.text || '{}');
        } catch (error: unknown) {
          const msg =
            error instanceof Error ? error.message : 'AI Generation failed';
          throw new functions.https.HttpsError('internal', msg);
        }
      }

      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid generation type'
      );
    }
  );
