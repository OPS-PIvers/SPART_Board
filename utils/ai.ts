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

export interface GeneratedQuestion {
  text: string;
  type?: string;
  correctAnswer?: string;
  incorrectAnswers?: string[];
  timeLimit?: number;
}

interface AIResponseData {
  questions?: GeneratedQuestion[];
  html?: string;
  title?: string;
  question?: string;
  options?: string[];
  widgets?: GeneratedWidget[];
  text?: string;
}

/**
 * Extracts text from an image using Gemini AI via a Firebase Function proxy.
 *
 * @param base64Image - The base64 encoded image data.
 * @returns A promise resolving to the extracted text.
 */
export async function extractTextWithGemini(
  base64Image: string
): Promise<string> {
  try {
    const generateWithAI = httpsCallable<
      {
        type:
          | 'mini-app'
          | 'poll'
          | 'dashboard-layout'
          | 'instructional-routine'
          | 'ocr';
        prompt?: string;
        image?: string;
      },
      AIResponseData
    >(functions, 'generateWithAI');

    const result = await generateWithAI({ type: 'ocr', image: base64Image });
    const data = result.data;

    if (typeof data.text !== 'string') {
      throw new Error('Invalid response format from AI');
    }

    return data.text;
  } catch (error) {
    console.error('Gemini OCR Error:', error);
    throw new Error('Failed to extract text using Gemini.');
  }
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
 * @param description - The lesson description or activity plan (e.g., "Math lesson about fractions with a 10 minute timer and a poll").
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

export interface GeneratedQuiz {
  title: string;
  questions: GeneratedQuestion[];
}

/**
 * Generates a quiz based on a topic using a Firebase Function proxy.
 *
 * @param prompt - The topic or content for the quiz.
 * @returns A promise resolving to the generated quiz title and questions.
 * @throws Error if generation fails.
 */
export async function generateQuiz(prompt: string): Promise<GeneratedQuiz> {
  try {
    const generateWithAI = httpsCallable<
      {
        type: 'mini-app' | 'poll' | 'dashboard-layout' | 'quiz';
        prompt: string;
      },
      AIResponseData
    >(functions, 'generateWithAI');

    const result = await generateWithAI({ type: 'quiz', prompt });
    const data = result.data;

    if (!data.title || !Array.isArray(data.questions)) {
      throw new Error('Invalid response format from AI');
    }

    return {
      title: data.title,
      questions: data.questions,
    };
  } catch (error) {
    console.error('AI Generation Error:', error);

    let errorMessage =
      'Failed to generate quiz. Please try again with a different prompt.';

    if (error instanceof Error) {
      errorMessage += ` Underlying error: ${error.message}`;
    }

    throw new Error(errorMessage);
  }
}
