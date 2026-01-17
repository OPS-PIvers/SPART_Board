/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Note: The package is @google/genai, but we are looking for the main entry point class.
// Based on the grep output, it's `GoogleGenAI`.

import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let client: GoogleGenAI | null = null;

if (API_KEY) {
  try {
    client = new GoogleGenAI({ apiKey: API_KEY });
  } catch (e) {
    console.warn('Failed to initialize Gemini AI', e);
  }
}

export interface GeneratedMiniApp {
  html: string;
  title: string;
}

interface ParsedResponse {
  html?: string;
  title?: string;
}

/**
 * Generates a mini-app based on a natural language prompt using Gemini.
 */
export async function generateMiniAppCode(
  prompt: string
): Promise<GeneratedMiniApp> {
  if (!client) {
    throw new Error('Gemini API Key is missing (VITE_GEMINI_API_KEY)');
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
    // The new SDK uses models.generateContent
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
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

    return {
      title: parsed.title,
      html: parsed.html,
    };
  } catch (error) {
    console.error('AI Generation Error:', error);
    throw new Error(
      'Failed to generate app. Please try again with a different prompt.'
    );
  }
}
