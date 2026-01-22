import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

let client: GoogleGenAI | null = null;

if (API_KEY) {
  // Simple validation for API Key format (non-empty string)
  if (typeof API_KEY === 'string' && API_KEY.length > 0) {
    try {
      client = new GoogleGenAI({ apiKey: API_KEY });
    } catch (e) {
      console.warn('Failed to initialize Gemini AI', e);
    }
  } else {
    console.warn('Invalid Gemini API Key format');
  }
}

export interface GeneratedMiniApp {
  /** The generated HTML code for the mini-app, including embedded CSS and JS */
  html: string;
  /** A short, descriptive title for the mini-app */
  title: string;
}

interface ParsedResponse {
  html?: string;
  title?: string;
}

/**
 * Generates a mini-app based on a natural language prompt using Gemini.
 *
 * @param prompt - The natural language description of the app to generate.
 * @returns A promise resolving to the generated app title and HTML code.
 * @throws Error if the API key is missing, the generation fails, or the response is invalid.
 *
 * @example
 * ```ts
 * try {
 *   const app = await generateMiniAppCode('A simple calculator with blue buttons');
 *   console.log(app.title); // "Blue Calculator"
 *   console.log(app.html);  // "<!DOCTYPE html>..."
 * } catch (err) {
 *   console.error(err);
 * }
 * ```
 */
export async function generateMiniAppCode(
  prompt: string
): Promise<GeneratedMiniApp> {
  if (!client) {
    throw new Error(
      'Gemini API Key is missing or invalid (VITE_GEMINI_API_KEY)'
    );
  }

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
            {
              text: systemPrompt + '\n\nUser Request: ' + prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    // Since it's a string, we can parse it.
    let jsonString = responseText;
    if (typeof jsonString !== 'string') {
      jsonString = String(jsonString);
    }

    const parsed = JSON.parse(jsonString) as ParsedResponse;

    if (
      !parsed.html ||
      !parsed.title ||
      typeof parsed.html !== 'string' ||
      typeof parsed.title !== 'string'
    ) {
      throw new Error('Invalid response format from AI');
    }

    if (parsed.html.toLowerCase().includes('<script src="http')) {
      // Check if it's NOT tailwind
      if (!parsed.html.includes('cdn.tailwindcss.com')) {
        console.warn('Potential external script detected in generated code.');
        // We technically might throw here, but for now we'll just warn as the iframe sandbox blocks a lot.
      }
    }

    return {
      title: parsed.title,
      html: parsed.html,
    };
  } catch (error) {
    console.error('AI Generation Error:', error);

    let errorMessage =
      'Failed to generate app. Please try again with a different prompt.';

    if (error instanceof Error) {
      errorMessage += ` Underlying error: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage += ` Underlying error: ${error}`;
    }

    throw new Error(errorMessage);
  }
}

export interface GeneratedPoll {
  question: string;
  options: string[];
}

/**
 * Generates a poll question and options based on a topic using Gemini.
 *
 * @param topic - The topic or subject for the poll.
 * @returns A promise resolving to the generated question and options.
 * @throws Error if the API key is missing or generation fails.
 */
export async function generatePoll(topic: string): Promise<GeneratedPoll> {
  if (!client) {
    throw new Error(
      'Gemini API Key is missing or invalid (VITE_GEMINI_API_KEY)'
    );
  }

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
          parts: [
            {
              text: systemPrompt + '\n\nTopic: ' + topic,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error('Empty response from AI');
    }

    let jsonString = responseText;
    if (typeof jsonString !== 'string') {
      jsonString = String(jsonString);
    }

    const parsed = JSON.parse(jsonString) as GeneratedPoll;

    if (
      !parsed.question ||
      !Array.isArray(parsed.options) ||
      parsed.options.length === 0
    ) {
      throw new Error('Invalid response format from AI');
    }

    // Ensure options are strings
    parsed.options = parsed.options.map((o) => String(o));

    return parsed;
  } catch (error) {
    console.error('AI Generation Error:', error);

    let errorMessage =
      'Failed to generate poll. Please try again with a different topic.';

    if (error instanceof Error) {
      errorMessage += ` Underlying error: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage += ` Underlying error: ${error}`;
    }

    throw new Error(errorMessage);
  }
}

export interface GeneratedWidget {
  type: string;
  config?: Record<string, unknown>;
}

export interface GeneratedLayout {
  widgets: GeneratedWidget[];
}

/**
 * Generates a dashboard layout based on a lesson topic using Gemini.
 *
 * @param topic - The lesson topic or description.
 * @returns A promise resolving to the generated list of widgets.
 */
export async function generateDashboardLayout(
  topic: string
): Promise<GeneratedLayout> {
  if (!client) {
    throw new Error(
      'Gemini API Key is missing or invalid (VITE_GEMINI_API_KEY)'
    );
  }

  const systemPrompt = `
    You are an expert classroom designer. Create a dashboard layout of widgets for a lesson on the given topic.

    Available Widgets & Config Schemas:
    - 'text': { content: string, fontSize: number (12-64), bgColor: string (hex) }
    - 'time-tool': { mode: 'timer' | 'stopwatch', duration: number (seconds), isRunning: boolean }
    - 'poll': { question: string, options: Array<{ label: string, votes: 0 }> }
    - 'sound': { sensitivity: number (1-100), visual: 'thermometer' | 'speedometer' | 'balls' }
    - 'traffic': { active: 'red' | 'yellow' | 'green' }
    - 'checklist': { items: Array<{ id: string, text: string, completed: boolean }> }
    - 'embed': { url: string (must be YouTube embed URL) }
    - 'workSymbols': { voiceLevel: number (0-4), workMode: 'individual' | 'partner' | 'group' }

    Requirements:
    1.  Select 3-6 widgets that best fit the lesson topic.
    2.  Configure them with relevant content (e.g., specific poll question, timer duration).
    3.  Return a JSON object with a "widgets" array.
    4.  Do NOT include placement (x, y, w, h). The system will arrange them.

    Response Format:
    Return ONLY raw JSON. No markdown formatting.
    Example:
    {
      "widgets": [
        { "type": "text", "config": { "content": "Welcome! Please sit quietly.", "fontSize": 24, "bgColor": "#ffffff" } },
        { "type": "time-tool", "config": { "mode": "timer", "duration": 300, "isRunning": false } }
      ]
    }
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: systemPrompt + '\n\nTopic: ' + topic,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text;
    if (!responseText) throw new Error('Empty response from AI');

    let jsonString = responseText;
    if (typeof jsonString !== 'string') jsonString = String(jsonString);

    const parsed = JSON.parse(jsonString) as GeneratedLayout;

    if (!parsed.widgets || !Array.isArray(parsed.widgets)) {
      throw new Error('Invalid response format from AI');
    }

    return parsed;
  } catch (error) {
    console.error('AI Generation Error:', error);
    let errorMessage =
      'Failed to generate layout. Please try again with a different topic.';
    if (error instanceof Error) {
      errorMessage += ` Underlying error: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage += ` Underlying error: ${error}`;
    }
    throw new Error(errorMessage);
  }
}
