/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { describe, it, expect, vi } from 'vitest';
import {
  generateMiniAppCode,
  generatePoll,
  extractTextWithGemini,
  generateDashboardLayout,
} from '../../utils/ai';

// Mock Firebase Functions
vi.mock('firebase/functions', () => {
  return {
    getFunctions: vi.fn(),
    httpsCallable: vi.fn().mockImplementation((_functions, _name) => {
      return async (data: any) => {
        if (data.prompt === 'FAIL_NON_ERROR') {
          // eslint-disable-next-line @typescript-eslint/only-throw-error
          throw 'Simulated String Error';
        }

        if (data.prompt && data.prompt.includes('FAIL')) {
          throw new Error('Simulated API Failure');
        }

        if (data.image === 'FAIL_IMAGE') {
          throw new Error('Simulated API Failure');
        }

        if (data.type === 'poll') {
          if (data.prompt === 'INVALID_RESPONSE') {
            return { data: {} };
          }
          return {
            data: {
              question: 'Mock Poll Question?',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            },
          };
        }

        if (data.type === 'ocr') {
          if (data.image === 'INVALID_RESPONSE') {
            return { data: {} }; // Missing text
          }
          return {
            data: {
              text: 'Extracted Text',
            },
          };
        }

        if (data.type === 'dashboard-layout') {
          if (data.prompt === 'INVALID_RESPONSE') {
            return { data: {} }; // Missing widgets
          }
          if (data.prompt === 'EMPTY_WIDGETS') {
            return { data: { widgets: [] } };
          }
          if (data.prompt === 'INVALID_WIDGET_TYPE') {
            return {
              data: { widgets: [{ type: 'invalid-type', config: {} }] },
            };
          }
          if (data.prompt === 'MIXED_VALID_INVALID_WIDGETS') {
            return {
              data: {
                widgets: [
                  { type: 'clock', config: {} },
                  { type: 'invalid-type', config: {} },
                  { type: 'time-tool', config: { duration: 600 } },
                ],
              },
            };
          }
          return {
            data: {
              widgets: [
                { type: 'clock', config: {} },
                { type: 'time-tool', config: { duration: 600 } },
              ],
            },
          };
        }

        // Default for mini-app
        if (data.prompt === 'INVALID_RESPONSE') {
          return { data: {} };
        }
        return {
          data: {
            title: 'Mock App',
            html: '<div>Mock App HTML</div>',
          },
        };
      };
    }),
  };
});

// Mock the firebase config
vi.mock('@/config/firebase', () => ({
  functions: {},
}));

// Mock TOOLS to avoid dependency issues and have predictable valid types
vi.mock('@/config/tools', () => ({
  TOOLS: [
    { type: 'clock', label: 'Clock', icon: 'clock', color: 'blue' },
    { type: 'time-tool', label: 'Timer', icon: 'timer', color: 'green' },
  ],
}));

describe('generateMiniAppCode', () => {
  it('generates app code successfully', async () => {
    const result = await generateMiniAppCode('Make a calculator');
    expect(result).toEqual({
      title: 'Mock App',
      html: '<div>Mock App HTML</div>',
    });
  });

  it('throws formatted error on failure', async () => {
    await expect(generateMiniAppCode('FAIL')).rejects.toThrow(
      'Failed to generate app. Please try again with a different prompt. Underlying error: Simulated API Failure'
    );
  });

  it('handles non-Error objects thrown', async () => {
    await expect(generateMiniAppCode('FAIL_NON_ERROR')).rejects.toThrow(
      'Failed to generate app. Please try again with a different prompt.'
    );
  });

  it('throws error on invalid response format', async () => {
    await expect(generateMiniAppCode('INVALID_RESPONSE')).rejects.toThrow(
      'Failed to generate app'
    );
  });
});

describe('generatePoll', () => {
  it('generates poll successfully', async () => {
    const result = await generatePoll('Photosynthesis');
    expect(result).toEqual({
      question: 'Mock Poll Question?',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    });
  });

  it('throws formatted error on failure', async () => {
    await expect(generatePoll('FAIL')).rejects.toThrow(
      'Failed to generate poll. Please try again with a different topic. Underlying error: Simulated API Failure'
    );
  });

  it('throws error on invalid response format', async () => {
    await expect(generatePoll('INVALID_RESPONSE')).rejects.toThrow(
      'Failed to generate poll'
    );
  });
});

describe('extractTextWithGemini', () => {
  it('extracts text successfully', async () => {
    const result = await extractTextWithGemini('base64-image-data');
    expect(result).toBe('Extracted Text');
  });

  it('throws formatted error on failure', async () => {
    await expect(extractTextWithGemini('FAIL_IMAGE')).rejects.toThrow(
      'Failed to extract text using Gemini'
    );
  });

  it('throws error on invalid response format', async () => {
    await expect(extractTextWithGemini('INVALID_RESPONSE')).rejects.toThrow(
      'Failed to extract text using Gemini'
    );
  });
});

describe('generateDashboardLayout', () => {
  it('generates layout successfully', async () => {
    const result = await generateDashboardLayout('Math lesson');
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('clock');
    expect(result[1].type).toBe('time-tool');
  });

  it('throws formatted error on failure', async () => {
    await expect(generateDashboardLayout('FAIL')).rejects.toThrow(
      'Failed to generate layout'
    );
  });

  it('throws error on invalid response format', async () => {
    await expect(generateDashboardLayout('INVALID_RESPONSE')).rejects.toThrow(
      'Failed to generate layout'
    );
  });

  it('throws error on empty widgets list', async () => {
    await expect(generateDashboardLayout('EMPTY_WIDGETS')).rejects.toThrow(
      'Failed to generate layout'
    );
  });

  it('throws error if all widgets are invalid types', async () => {
    await expect(
      generateDashboardLayout('INVALID_WIDGET_TYPE')
    ).rejects.toThrow('Failed to generate layout');
  });

  it('filters out invalid widget types and keeps valid ones', async () => {
    const result = await generateDashboardLayout('MIXED_VALID_INVALID_WIDGETS');
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('clock');
    expect(result[1].type).toBe('time-tool');
  });
});
