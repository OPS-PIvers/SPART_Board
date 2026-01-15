import {
  onCall,
  HttpsError,
  CallableRequest,
} from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import axios, { AxiosError } from 'axios';
import OAuth from 'oauth-1.0a';
import * as CryptoJS from 'crypto-js';

// Set global options for all v2 functions
setGlobalOptions({
  region: 'us-central1',
  invoker: 'public', // Make the function publicly accessible (required for CORS preflight)
});

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
  url: string,
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
    url: url,
    method: method,
  };

  return oauth.toHeader(oauth.authorize(request_data));
}

export const getClassLinkRoster = onCall(
  {
    secrets: [
      'CLASSLINK_CLIENT_ID',
      'CLASSLINK_CLIENT_SECRET',
      'CLASSLINK_TENANT_URL',
    ],
    cors: true, // Explicitly enable CORS
    region: 'us-central1',
  },
  async (request: CallableRequest) => {
    // 1. Ensure user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const userEmail = request.auth.token.email;
    if (!userEmail) {
      throw new HttpsError(
        'invalid-argument',
        'User must have an email associated with their account.'
      );
    }

    const clientId = process.env.CLASSLINK_CLIENT_ID;
    const clientSecret = process.env.CLASSLINK_CLIENT_SECRET;
    const tenantUrl = process.env.CLASSLINK_TENANT_URL;

    if (!clientId || !clientSecret || !tenantUrl) {
      throw new HttpsError(
        'internal',
        'ClassLink configuration is missing on the server.'
      );
    }

    const cleanTenantUrl = tenantUrl.replace(/\/$/, '');

    try {
      // Step 1: Find the user by email to get their sourcedId
      const usersUrl = `${cleanTenantUrl}/ims/oneroster/v1p1/users?filter=email='${userEmail}'`;
      const userHeaders = getOAuthHeaders(
        usersUrl,
        'GET',
        clientId,
        clientSecret
      );

      const userResponse = await axios.get<{ users: ClassLinkUser[] }>(
        usersUrl,
        { headers: { ...userHeaders } }
      );
      const users = userResponse.data.users;

      if (!users || users.length === 0) {
        console.warn(`No ClassLink user found for email: ${userEmail}`);
        return { classes: [], studentsByClass: {} };
      }

      const teacherSourcedId = users[0].sourcedId;

      // Step 2: Get classes for this teacher
      const classesUrl = `${cleanTenantUrl}/ims/oneroster/v1p1/users/${teacherSourcedId}/classes`;
      const classesHeaders = getOAuthHeaders(
        classesUrl,
        'GET',
        clientId,
        clientSecret
      );

      const classesResponse = await axios.get<{ classes: ClassLinkClass[] }>(
        classesUrl,
        { headers: { ...classesHeaders } }
      );
      const classes = classesResponse.data.classes;

      // Step 3: Get students for each class
      const studentsByClass: Record<string, ClassLinkStudent[]> = {};

      await Promise.all(
        classes.map(async (cls: ClassLinkClass) => {
          const studentsUrl = `${cleanTenantUrl}/ims/oneroster/v1p1/classes/${cls.sourcedId}/students`;
          const studentsHeaders = getOAuthHeaders(
            studentsUrl,
            'GET',
            clientId,
            clientSecret
          );
          try {
            const studentsResponse = await axios.get<{
              users: ClassLinkStudent[];
            }>(studentsUrl, { headers: { ...studentsHeaders } });
            studentsByClass[cls.sourcedId] = studentsResponse.data.users ?? [];
          } catch (err) {
            console.error(
              `Error fetching students for class ${cls.sourcedId}:`,
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
        console.error(
          'ClassLink API Error:',
          axiosError.response?.data ?? axiosError.message
        );
        throw new HttpsError(
          'internal',
          `Failed to fetch data from ClassLink: ${axiosError.message}`
        );
      }
      const genericError = error as Error;
      console.error('ClassLink API Error:', genericError.message);
      throw new HttpsError(
        'internal',
        `Failed to fetch data from ClassLink: ${genericError.message}`
      );
    }
  }
);
