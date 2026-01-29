/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { describe, it, expect, vi } from 'vitest';
import {
  generateMiniAppCode,
  generatePoll,
  generateDashboardLayout,
} from '../../utils/ai';

// Mock Firebase Functions
vi.mock('firebase/functions', () => {
  return {
    getFunctions: vi.fn(),
    httpsCallable: vi.fn().mockImplementation((_functions, _name) => {
      return async (data: any) => {
        if (data.prompt && data.prompt.includes('FAIL')) {
          throw new Error('Simulated API Failure');
        }

        if (data.type === 'poll') {
          return {
            data: {
              question: 'Mock Poll Question?',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
            },
          };
        }

        if (data.type === 'layout') {
          return {
            data: {
              widgets: [
                { type: 'timer', x: 0, y: 0, w: 4, h: 4 },
                { type: 'checklist', x: 4, y: 0, w: 4, h: 6 },
              ],
            },
          };
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

describe('generateMiniAppCode', () => {
  it('generates app code successfully', async () => {
    const result = await generateMiniAppCode('Make a calculator');
    expect(result).toEqual({
      title: 'Mock App',
      html: '<div>Mock App HTML</div>',
    });
  });

  it('throws formatted error on failure', async () => {
    try {
      await generateMiniAppCode('FAIL');
    } catch (e: any) {
      expect(e.message).toContain('Failed to generate app');
      expect(e.message).toContain('Simulated API Failure');
    }
  });
});

describe('generateDashboardLayout', () => {
  it('generates layout successfully', async () => {
    const result = await generateDashboardLayout('Math rotation');
    expect(result).toEqual({
      widgets: [
        { type: 'timer', x: 0, y: 0, w: 4, h: 4 },
        { type: 'checklist', x: 4, y: 0, w: 4, h: 6 },
      ],
    });
  });

  it('throws formatted error on failure', async () => {
    try {
      await generateDashboardLayout('FAIL');
    } catch (e: any) {
      expect(e.message).toContain('Failed to generate layout');
      expect(e.message).toContain('Simulated API Failure');
    }
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
    try {
      await generatePoll('FAIL');
    } catch (e: any) {
      expect(e.message).toContain('Failed to generate poll');
      expect(e.message).toContain('Simulated API Failure');
    }
  });
});
