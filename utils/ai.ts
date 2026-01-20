import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

let genAI: GoogleGenAI | null = null;

if (API_KEY) {
  try {
    genAI = new GoogleGenAI({ apiKey: API_KEY });
  } catch (e) {
    console.error('Failed to initialize Gemini AI client:', e);
  }
}

/**
 * Generates a list of items based on a prompt using Gemini.
 * @param prompt The main topic or request (e.g. "Planets of the solar system")
 * @param context Optional additional context (e.g. "Include dwarf planets")
 * @returns A promise that resolves to an array of strings
 */
export const generateList = async (
  prompt: string,
  context?: string
): Promise<string[]> => {
  // Mock response if no key (for demo/dev without key)
  if (!API_KEY || !genAI) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return [
      `Magic Item 1 for ${prompt}`,
      `Magic Item 2 for ${prompt}`,
      `Magic Item 3 for ${prompt}`,
      'Review generated items',
      'Add more details',
    ];
  }

  try {
    const finalPrompt = `
      You are a helpful assistant for a classroom dashboard.
      Generate a list of 5-10 items based on this request: "${prompt}".
      ${context ? `Context: ${context}` : ''}
      Return ONLY the items, one per line. Do not number them. Do not add bullets. Do not add introductory text.
    `;

    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: finalPrompt }],
        },
      ],
    });

    let text = '';
    // Try to extract text safely
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
    if (typeof (response as any).text === 'function') {
      text = (response as any).text();
    } else if (
      response.candidates &&
      response.candidates[0]?.content?.parts?.[0]?.text
    ) {
      text = response.candidates[0].content.parts[0].text;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */

    return text
      .split('\n')
      .map((line: string) => line.replace(/^[\d\-.*•]+\s*/, '').trim()) // Remove existing bullets/numbers just in case
      .filter((line: string) => line !== '');
  } catch (error) {
    console.error('AI Generation Error:', error);
    return [];
  }
};
