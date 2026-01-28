import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import { WidgetType, WidgetConfig } from '@/types';
import { TOOLS } from '@/config/tools';

export interface GeneratedMiniApp {
  /** The generated HTML code for the mini-app, including embedded CSS and JS */
  html: string;
  /** A short, descriptive title for the mini-app */
  title: string;
}

export interface GeneratedWidget {
  type: WidgetType;
  config: WidgetConfig;
}

interface AIResponseData {
  html?: string;
  title?: string;
  question?: string;
  options?: string[];
  widgets?: GeneratedWidget[];
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
      { type: 'mini-app' | 'poll' | 'dashboard-layout'; prompt: string },
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
      { type: 'mini-app' | 'poll' | 'dashboard-layout'; prompt: string },
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

/**
 * Generates a dashboard layout based on a natural language description using a Firebase Function proxy.
 *
 * @param description - The lesson description or activity plan.
 * @returns A promise resolving to an array of widget configurations.
 * @throws Error if generation fails.
 */
export async function generateDashboardLayout(
  description: string
): Promise<GeneratedWidget[]> {
  try {
    const generateWithAI = httpsCallable<
      { type: 'mini-app' | 'poll' | 'dashboard-layout'; prompt: string },
      AIResponseData
    >(functions, 'generateWithAI');

    const result = await generateWithAI({
      type: 'dashboard-layout',
      prompt: description,
    });
    const data = result.data;

    if (!data.widgets || !Array.isArray(data.widgets)) {
      throw new Error('Invalid response format from AI');
    }

    if (data.widgets.length === 0) {
      throw new Error(
        "AI couldn't generate any widgets for this description. Please try a more specific lesson plan."
      );
    }

    // Validate widget types
    const validTypes = TOOLS.map((t) => t.type);
    const validWidgets = data.widgets.filter((w) =>
      validTypes.includes(w.type)
    );

    if (validWidgets.length === 0) {
      throw new Error('AI generated invalid widget types.');
    }

    return validWidgets;
  } catch (error) {
    console.error('AI Generation Error:', error);

    let errorMessage =
      'Failed to generate layout. Please try again with a different description.';

    if (error instanceof Error) {
      errorMessage += ` Underlying error: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
}
