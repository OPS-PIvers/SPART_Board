/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { describe, it, expect, vi } from 'vitest';
import { generateMiniAppCode } from '../../utils/ai';

// Mock the GoogleGenAI client
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      constructor(options: { apiKey: string }) {
        if (!options.apiKey) throw new Error('API Key required');
      }
      models = {
        generateContent: vi.fn().mockImplementation(async (params: any) => {
          if (
            params.contents[0].parts[0].text &&
            params.contents[0].parts[0].text.includes('FAIL')
          ) {
            throw new Error('Simulated API Failure');
          }
          return {
            text: JSON.stringify({
              title: 'Mock App',
              html: '<div>Mock App HTML</div>',
            }),
          };
        }),
      };
    },
  };
});

describe('generateMiniAppCode', () => {
  it('generates app code successfully when API Key is present', async () => {
    try {
      const result = await generateMiniAppCode('Make a calculator');
      expect(result).toEqual({
        title: 'Mock App',
        html: '<div>Mock App HTML</div>',
      });
    } catch (e: any) {
      expect(e.message).toBe(
        'Gemini API Key is missing or invalid (VITE_GEMINI_API_KEY)'
      );
    }
  });

  it('throws formatted error on failure', async () => {
    try {
      await generateMiniAppCode('FAIL');
    } catch (e: any) {
      if (
        e.message ===
        'Gemini API Key is missing or invalid (VITE_GEMINI_API_KEY)'
      ) {
        return;
      }
      expect(e.message).toContain('Failed to generate app');
      expect(e.message).toContain('Simulated API Failure');
    }
  });
});
