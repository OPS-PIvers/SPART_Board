// Client mirror of the server chunker (functions/src/quizReadAloud.ts chunkText, R4).
import { describe, it, expect } from 'vitest';
import { chunkReadAloudText } from '@/utils/quizReadAloudApi';

const bytes = (s: string) => new TextEncoder().encode(s).length;

describe('chunkReadAloudText', () => {
  it('returns nothing for blank text', () => {
    expect(chunkReadAloudText('  \n ')).toEqual([]);
  });

  it('splits on sentence boundaries under the byte cap and loses no text', () => {
    const text = Array.from(
      { length: 12 },
      (_, i) => `Sentence number ${i} has a few words in it.`
    ).join(' ');
    const chunks = chunkReadAloudText(text, 100);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.join(' ')).toBe(text);
    for (const c of chunks) expect(bytes(c)).toBeLessThanOrEqual(100);
  });

  it('splits a single oversized sentence rather than dropping it', () => {
    const chunks = chunkReadAloudText('a'.repeat(250), 100);
    expect(chunks.join('')).toBe('a'.repeat(250));
    for (const c of chunks) expect(bytes(c)).toBeLessThanOrEqual(100);
  });

  it('treats blank lines as boundaries and measures UTF-8 bytes', () => {
    const chunks = chunkReadAloudText('Ünïcödé one.\n\nÜnïcödé two.', 20);
    expect(chunks).toEqual(['Ünïcödé one.', 'Ünïcödé two.']);
  });
});
