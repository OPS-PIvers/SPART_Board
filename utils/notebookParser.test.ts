import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseNotebookFile } from './notebookParser';

const mockLoadAsync = vi.fn();
const mockForEach = vi.fn();
const mockFileFn = vi.fn();

// Mock JSZip module
vi.mock('jszip', () => {
  return {
    default: class JSZipMock {
      loadAsync(...args: unknown[]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return mockLoadAsync(...args);
      }
      forEach(callback: (path: string, entry: unknown) => void) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return mockForEach(callback);
      }
      file(name: string) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return mockFileFn(name);
      }
    },
  };
});

describe('parseNotebookFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAsync.mockResolvedValue(undefined);
  });

  it('extracts pages and assets correctly', async () => {
    const files: Record<string, unknown> = {
      'page0.png': {
        dir: false,
        name: 'page0.png',
        async: vi.fn().mockResolvedValue(new Blob(['page-content'])),
      },
      'page1.svg': {
        dir: false,
        name: 'page1.svg',
        async: vi.fn().mockResolvedValue(new Blob(['page-content'])),
      },
      'images/cat.png': {
        dir: false,
        name: 'images/cat.png',
        async: vi.fn().mockResolvedValue(new Blob(['cat-content'])),
      },
      'metadata.xml': {
        dir: false,
        name: 'metadata.xml',
      },
      'preview.png': {
        dir: false,
        name: 'preview.png',
        async: vi.fn().mockResolvedValue(new Blob(['preview'])),
      },
    };

    mockForEach.mockImplementation(
      (callback: (path: string, entry: unknown) => void) => {
        Object.entries(files).forEach(([path, file]) => {
          callback(path, file);
        });
      }
    );

    const file = new File(['dummy'], 'test.notebook');
    const result = await parseNotebookFile(file);

    expect(result.title).toBe('test.notebook');
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].extension).toBe('png');

    expect(result.assets).toHaveLength(1);
    expect(result.assets[0].extension).toBe('png');
  });

  it('handles empty pages with fallback', async () => {
    const files: Record<string, unknown> = {
      'metadata.xml': { dir: false, name: 'metadata.xml' },
    };

    mockForEach.mockImplementation(
      (callback: (path: string, entry: unknown) => void) => {
        Object.entries(files).forEach(([path, file]) => {
          callback(path, file);
        });
      }
    );

    const previewFile = {
      async: vi.fn().mockResolvedValue(new Blob(['preview'])),
    };
    mockFileFn.mockReturnValue(previewFile);

    const file = new File(['dummy'], 'test.notebook');
    const result = await parseNotebookFile(file);

    expect(result.pages).toHaveLength(1);
    expect(result.assets).toEqual([]);
  });
});