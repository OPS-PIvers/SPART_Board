import { describe, it, expect } from 'vitest';
import { getFontClass } from '@/utils/styles';

describe('styles util', () => {
  describe('getFontClass', () => {
    it('returns the global font class when fontFamily is "global"', () => {
      expect(getFontClass('global', 'sans')).toBe('font-sans');
      expect(getFontClass('global', 'serif')).toBe('font-serif');
    });

    it('returns the fontFamily as is when it already starts with "font-"', () => {
      expect(getFontClass('font-mono', 'sans')).toBe('font-mono');
      expect(getFontClass('font-comic', 'serif')).toBe('font-comic');
    });

    it('prepends "font-" to the fontFamily when it does not start with "font-" and is not "global"', () => {
      expect(getFontClass('cursive', 'sans')).toBe('font-cursive');
      expect(getFontClass('mono', 'serif')).toBe('font-mono');
    });
  });
});
