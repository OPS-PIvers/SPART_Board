import * as functionsV1 from 'firebase-functions/v1';
import * as functionsV2 from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import axios, { AxiosError } from 'axios';
import OAuth from 'oauth-1.0a';
import * as CryptoJS from 'crypto-js';
import { GoogleGenAI } from '@google/genai';

admin.initializeApp();

export const JULES_API_SESSIONS_ENDPOINT =
  'https://jules.googleapis.com/v1alpha/sessions';

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
  type: 'mini-app' | 'poll' | 'dashboard-layout' | 'instructional-routine';
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
      const ai = new GoogleGenAI({ apiKey });

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
      } else if (data.type === 'dashboard-layout') {
        systemPrompt = `
          You are an expert instructional designer. Based on the user's lesson description, suggest a set of interactive widgets to place on their digital whiteboard.
          
          Available Widgets (use EXACT type strings):
          - clock: Digital/analog clock
          - time-tool: Timer/Stopwatch
          - traffic: Traffic light for behavior/status
          - text: Simple sticky note/text area
          - checklist: To-do list
          - random: Student/item picker
          - dice: Random dice roller
          - sound: Noise level meter
          - drawing: Sketchpad
          - qr: QR code generator
          - embed: Website embedder
          - poll: Multiple choice poll
          - webcam: Live camera feed
          - scoreboard: Point tracker
          - expectations: Classroom expectations icons
          - weather: Local weather display
          - schedule: Daily class schedule
          - calendar: Monthly events
          - lunchCount: Student meal tracker
          - classes: Class/Period selector
          - instructionalRoutines: Library of teaching strategies (e.g. Think-Pair-Share)
          - materials: Visual list of required student supplies
          - stickers: Reward/decorative stickers
          - seating-chart: Classroom layout manager
          - catalyst: Instructional warm-ups/activities
          
          Requirements:
          1. Select 3-6 most relevant widgets for the activity.
          2. Return JSON: { "widgets": [{ "type": "...", "config": {} }] }
          3. 'config' should be an empty object {} unless you are setting a specific property known to that widget (like 'question' for 'poll').
        `;
        userPrompt = `Lesson/Activity Description: ${data.prompt}`;
      } else if (data.type === 'instructional-routine') {
        systemPrompt = `
          You are an expert instructional designer. Create a classroom instructional routine based on the user's description.

          Return JSON:
          {
            "name": "Routine Name",
            "grades": "Grade Range (e.g. K-5, 6-12)",
            "icon": "Lucide Icon Name (e.g. Brain, Users, Zap)",
            "color": "Color Name (blue, indigo, violet, purple, fuchsia, pink, rose, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, slate, zinc, stone, neutral)",
            "steps": [
              {
                "text": "Step instruction...",
                "icon": "Lucide Icon Name",
                "color": "Color Name",
                "label": "Short Label (e.g. Pair, Share)"
              }
            ]
          }
        `;
        userPrompt = `Description: ${data.prompt}`;
      } else {
        throw new functionsV1.https.HttpsError(
          'invalid-argument',
          'Invalid generation type'
        );
      }

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + '\n\n' + userPrompt }],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = result.text;

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

interface JulesData {
  widgetName: string;
  description: string;
}

export const triggerJulesWidgetGeneration = functionsV2.https.onCall<JulesData>(
  {
    secrets: ['JULES_API_KEY'],
    timeoutSeconds: 300,
    memory: '256MiB',
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new functionsV2.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const email = request.auth.token.email;
    if (!email) {
      throw new functionsV2.https.HttpsError(
        'invalid-argument',
        'User must have an email associated with their account.'
      );
    }

    const db = admin.firestore();
    const adminDoc = await db
      .collection('admins')
      .doc(email.toLowerCase())
      .get();
    if (!adminDoc.exists) {
      throw new functionsV2.https.HttpsError(
        'permission-denied',
        'This function is restricted to administrators.'
      );
    }

    const julesApiKey = process.env.JULES_API_KEY;
    if (!julesApiKey) {
      throw new functionsV2.https.HttpsError(
        'internal',
        'Jules API Key is missing on the server.'
      );
    }

    const repoName = 'OPS-PIvers/SPART_Board';
    const { widgetName, description } = request.data;

    console.log(
      `Triggering Jules for widget: ${widgetName} in repo: ${repoName}`
    );

    const prompt = `
      As a Jules Agent, your task is to implement a new widget for the SPART Board application.
      
      Widget Name: ${widgetName}
      Features Requested: ${description}
      
      Implementation Requirements:
      1. Create a new component in 'components/widgets/' named '${widgetName.replace(/\s+/g, '')}Widget.tsx'.
      2. Follow the existing patterns:
         - Accept 'widget: WidgetData' as a prop.
         - Use 'useDashboard()' for state updates.
         - Use Tailwind CSS for styling, adhering to the brand theme (brand-blue, brand-red, etc.).
         - Use Lucide icons.
      3. Register the new type in 'types.ts' (WidgetType).
      4. Add metadata to 'TOOLS' in 'config/tools.ts'.
      5. Map the component in 'WidgetRenderer.tsx'.
      6. Define default configuration in 'context/DashboardContext.tsx' (inside the 'addWidget' function).
      7. Add a unit test in 'components/widgets/' named '${widgetName.replace(/\s+/g, '')}Widget.test.tsx'.
      
      Please ensure all code is strictly typed and follows the project's 'Zero-tolerance' linting policy.
    `;

    try {
      console.log('Sending request to Jules API...');
      // Use the named constant for the endpoint
      const { data: session } = await axios.post(
        JULES_API_SESSIONS_ENDPOINT,
        {
          prompt: prompt,
          sourceContext: {
            source: `sources/github/${repoName}`,
            githubRepoContext: {
              startingBranch: 'main',
            },
          },
          automationMode: 'AUTO_CREATE_PR',
          title: `Generate Widget: ${widgetName}`,
        },
        {
          headers: {
            'X-Goog-Api-Key': julesApiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      // Use optional chaining carefully to avoid TS2532 "Object is possibly 'undefined'"
      const nameParts = session.name ? session.name.split('/') : [];
      const sessionId = nameParts.pop() || session.id;
      console.log(`Jules session created: ${sessionId}`);

      return {
        success: true,
        message: `Jules session started successfully. Session ID: ${sessionId}`,
        consoleUrl: `https://jules.google.com/session/${sessionId}`,
      };
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (axios.isAxiosError(error)) {
        console.error('Jules API Error Response Data:', error.response?.data);
        console.error('Jules API Error Status:', error.response?.status);
        errorMessage = error.response?.data?.error?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('Jules API Error:', errorMessage);
      throw new functionsV2.https.HttpsError(
        'internal',
        `Failed to trigger Jules: ${errorMessage}`
      );
    }
  }
);
