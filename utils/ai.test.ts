import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateList } from './ai';

// Mock the module @google/genai
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({
          candidates: [
            {
              content: {
                parts: [{ text: 'Item 1\nItem 2\nItem 3' }],
              },
            },
          ],
          text: () => 'Item 1\nItem 2\nItem 3',
        }),
      },
    })),
  };
});

describe('utils/ai', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generateList returns list (mock or AI)', async () => {
    const list = await generateList('test prompt');
    expect(list).toBeInstanceOf(Array);
    expect(list.length).toBeGreaterThan(0);
    expect(typeof list[0]).toBe('string');
  });
});
