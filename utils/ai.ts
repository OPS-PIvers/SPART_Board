import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';

export interface GeneratedMiniApp {
  /** The generated HTML code for the mini-app, including embedded CSS and JS */
  html: string;
  /** A short, descriptive title for the mini-app */
  title: string;
}

interface AIResponseData {
  html?: string;
  title?: string;
  question?: string;
  options?: string[];
}

/**
 * Generates a mini-app based on a natural language prompt using a Firebase Function proxy.
 *
 * @param prompt - The natural language description of the app to generate.
 * @returns A promise resolving to the generated app title and HTML code.
 * @throws Error if the generation fails.
 */
export async function generateMiniAppCode(
  prompt: string
): Promise<GeneratedMiniApp> {
  try {
    const generateWithAI = httpsCallable<
      { type: 'mini-app' | 'poll'; prompt: string },
      AIResponseData
    >(functions, 'generateWithAI');

    const result = await generateWithAI({ type: 'mini-app', prompt });
    const data = result.data;

    if (!data.html || !data.title) {
      throw new Error('Invalid response format from AI');
    }

    return {
      title: data.title,
      html: data.html,
    };
  } catch (error) {
    console.error('AI Generation Error:', error);

    let errorMessage =
      'Failed to generate app. Please try again with a different prompt.';

    if (error instanceof Error) {
      errorMessage += ` Underlying error: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
}

export interface GeneratedPoll {
  question: string;
  options: string[];
}

/**
 * Generates a poll question and options based on a topic using a Firebase Function proxy.
 *
 * @param topic - The topic or subject for the poll.
 * @returns A promise resolving to the generated question and options.
 * @throws Error if generation fails.
 */
export async function generatePoll(topic: string): Promise<GeneratedPoll> {
  try {
    const generateWithAI = httpsCallable<
      { type: 'mini-app' | 'poll'; prompt: string },
      AIResponseData
    >(functions, 'generateWithAI');

    const result = await generateWithAI({ type: 'poll', prompt: topic });
    const data = result.data;

    if (!data.question || !Array.isArray(data.options)) {
      throw new Error('Invalid response format from AI');
    }

    return {
      question: data.question,
      options: data.options.map((o) => String(o)),
    };
  } catch (error) {
    console.error('AI Generation Error:', error);

    let errorMessage =
      'Failed to generate poll. Please try again with a different topic.';

    if (error instanceof Error) {
      errorMessage += ` Underlying error: ${error.message}`;
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
