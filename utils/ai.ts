import { GoogleGenAI } from '@google/genai';

// Initialize the GoogleGenAI client
// We use a singleton pattern or just export a function that initializes it on demand
// to avoid issues if the key is missing at startup.

const getClient = (): GoogleGenAI | null => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
  if (!apiKey) {
    console.warn(
      'VITE_GEMINI_API_KEY is missing. AI features will be disabled.'
    );
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic function to generate content using Gemini.
 * @param prompt The prompt to send to the AI.
 * @param schema The schema to enforce (JSON schema).
 * @returns Parsed JSON response.
 */
export async function generateContent<T>(
  prompt: string,
  schema: Record<string, unknown>
): Promise<AIResponse<T>> {
  const client = getClient();
  if (!client) {
    return {
      success: false,
      error: 'API Key missing',
    };
  }

  try {
    const fullPrompt = `
      ${prompt}

      Output ONLY valid JSON matching this schema:
      ${JSON.stringify(schema, null, 2)}

      Do not include markdown formatting (like \`\`\`json). Just the raw JSON.
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          parts: [{ text: fullPrompt }],
        },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const text = response?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== 'string') {
      return { success: false, error: 'No response from AI' };
    }

    // Clean up markdown if present
    const cleanText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const data = JSON.parse(cleanText) as T;
    return { success: true, data };
  } catch (error) {
    console.error('AI Generation Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
