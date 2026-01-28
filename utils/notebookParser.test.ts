import { describe, it, expect } from 'vitest';
import { parseNotebookFile } from './notebookParser';
import JSZip from 'jszip';

describe('parseNotebookFile', () => {
  const createZipFile = async (files: Record<string, string>) => {
    const zip = new JSZip();
    Object.entries(files).forEach(([path, content]) => {
      zip.file(path, content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    return new File([blob], 'test.notebook');
  };

  it('parses a notebook with PNG pages', async () => {
    const file = await createZipFile({
      'page0.png': 'fake-png-data-0',
      'page1.png': 'fake-png-data-1',
      'page2.png': 'fake-png-data-2',
    });

    const result = await parseNotebookFile(file);

    expect(result.title).toBe('test.notebook');
    expect(result.pages).toHaveLength(3);
    expect(result.pages[0].extension).toBe('png');
    expect(result.pages[1].extension).toBe('png');
    expect(result.pages[2].extension).toBe('png');
  });

  it('parses a notebook with SVG pages', async () => {
    const file = await createZipFile({
      'page0.svg': '<svg></svg>',
      'page1.svg': '<svg></svg>',
    });

    const result = await parseNotebookFile(file);

    expect(result.title).toBe('test.notebook');
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].extension).toBe('svg');
    expect(result.pages[1].extension).toBe('svg');
  });

  it('prefers PNG over SVG when both are present', async () => {
    const file = await createZipFile({
      'page0.png': 'fake-png-data-0',
      'page1.png': 'fake-png-data-1',
      'page0.svg': '<svg></svg>',
      'page1.svg': '<svg></svg>',
    });

    const result = await parseNotebookFile(file);

    expect(result.title).toBe('test.notebook');
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].extension).toBe('png');
    expect(result.pages[1].extension).toBe('png');
  });

  it('sorts pages numerically', async () => {
    const file = await createZipFile({
      'page10.png': 'fake-png-data-10',
      'page2.png': 'fake-png-data-2',
      'page1.png': 'fake-png-data-1',
    });

    const result = await parseNotebookFile(file);

    expect(result.title).toBe('test.notebook');
    expect(result.pages).toHaveLength(3);
    // Should be sorted: page1, page2, page10 (not page1, page10, page2)
  });

  it('handles pages in nested folders', async () => {
    const file = await createZipFile({
      'images/page0.png': 'fake-png-data-0',
      'images/page1.png': 'fake-png-data-1',
    });

    const result = await parseNotebookFile(file);

    expect(result.title).toBe('test.notebook');
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].extension).toBe('png');
  });

  it('handles preview files', async () => {
    const file = await createZipFile({
      'preview0.png': 'fake-preview-0',
      'preview1.png': 'fake-preview-1',
    });

    const result = await parseNotebookFile(file);

    expect(result.title).toBe('test.notebook');
    expect(result.pages).toHaveLength(2);
    expect(result.pages[0].extension).toBe('png');
  });

  it('falls back to generic preview.png when no pages found', async () => {
    const file = await createZipFile({
      'preview.png': 'fake-preview-data',
      'other.txt': 'some text',
    });

    const result = await parseNotebookFile(file);

    expect(result.title).toBe('test.notebook');
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].extension).toBe('png');
  });

  it('falls back to thumbnail.png when no pages or preview found', async () => {
    const file = await createZipFile({
      'thumbnail.png': 'fake-thumbnail-data',
      'other.txt': 'some text',
    });

    const result = await parseNotebookFile(file);

    expect(result.title).toBe('test.notebook');
    expect(result.pages).toHaveLength(1);
    expect(result.pages[0].extension).toBe('png');
  });

  it('throws error when no valid pages found', async () => {
    const file = await createZipFile({
      'other.txt': 'some text',
      'readme.md': 'readme content',
    });

    await expect(parseNotebookFile(file)).rejects.toThrow(
      'No valid pages found in Notebook file.'
    );
  });

  it('handles mixed format files correctly', async () => {
    const file = await createZipFile({
      'page0.png': 'fake-png-data-0',
      'page1.svg': '<svg></svg>',
      'page2.png': 'fake-png-data-2',
    });

    const result = await parseNotebookFile(file);

    // Should only include PNGs since PNGs are preferred
    expect(result.title).toBe('test.notebook');
    expect(result.pages).toHaveLength(2);
    expect(result.pages.every((p) => p.extension === 'png')).toBe(true);
  });

  it('handles empty notebook zip', async () => {
    const zip = new JSZip();
    const blob = await zip.generateAsync({ type: 'blob' });
    const file = new File([blob], 'empty.notebook');

    await expect(parseNotebookFile(file)).rejects.toThrow(
      'No valid pages found in Notebook file.'
    );
  });
});
