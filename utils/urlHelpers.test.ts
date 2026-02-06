import { describe, it, expect, vi, afterEach } from 'vitest';
import { getOriginUrl, getJoinUrl, convertToEmbedUrl } from './urlHelpers';

describe('urlHelpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('getOriginUrl', () => {
    it('returns window.location.origin when window is defined', () => {
      vi.stubGlobal('window', {
        location: {
          origin: 'https://myschool.com',
        },
      });

      expect(getOriginUrl()).toBe('https://myschool.com');
    });
  });

  describe('getJoinUrl', () => {
    it('returns full join URL when window is defined', () => {
      vi.stubGlobal('window', {
        location: {
          origin: 'https://myschool.com',
        },
      });

      expect(getJoinUrl()).toBe('https://myschool.com/join');
    });
  });

  describe('convertToEmbedUrl', () => {
    it('handles empty or null URLs', () => {
      expect(convertToEmbedUrl('')).toBe('');
      expect(convertToEmbedUrl('   ')).toBe('');
    });

    it('converts YouTube watch URLs to embed URLs', () => {
      expect(
        convertToEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      ).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(convertToEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
        'https://www.youtube.com/embed/dQw4w9WgXcQ'
      );
    });

    describe('Google Docs', () => {
      const docId = '1abc123_XYZ';

      it('converts /edit URLs to /edit?rm=minimal', () => {
        const url = `https://docs.google.com/document/d/${docId}/edit`;
        expect(convertToEmbedUrl(url)).toBe(
          `https://docs.google.com/document/d/${docId}/edit?rm=minimal`
        );
      });

      it('handles URLs with user segments (e.g., /u/0/)', () => {
        const url = `https://docs.google.com/document/u/0/d/${docId}/edit`;
        expect(convertToEmbedUrl(url)).toBe(
          `https://docs.google.com/document/d/${docId}/edit?rm=minimal`
        );
      });

      it('preserves other query parameters and fragments', () => {
        const url = `https://docs.google.com/document/d/${docId}/edit?foo=bar#heading=h.123`;
        const result = convertToEmbedUrl(url);
        expect(result).toContain('rm=minimal');
        expect(result).toContain('foo=bar');
        expect(result).toContain('#heading=h.123');
      });

      it('handles URLs with existing tab parameters', () => {
        const url = `https://docs.google.com/document/d/${docId}/edit?tab=t.0`;
        const result = convertToEmbedUrl(url);
        expect(result).toContain('rm=minimal');
        expect(result).toContain('tab=t.0');
      });

      it('handles bare document URLs', () => {
        const url = `https://docs.google.com/document/d/${docId}`;
        expect(convertToEmbedUrl(url)).toBe(
          `https://docs.google.com/document/d/${docId}/edit?rm=minimal`
        );
      });
    });

    describe('Google Slides', () => {
      it('converts edit URLs to /embed and preserves other params', () => {
        const url =
          'https://docs.google.com/presentation/d/preso-id/edit?delayms=3000';
        const result = convertToEmbedUrl(url);
        expect(result).toBe(
          'https://docs.google.com/presentation/d/preso-id/embed?delayms=3000'
        );
      });

      it('handles user segments', () => {
        const url = 'https://docs.google.com/presentation/u/0/d/preso-id/edit';
        expect(convertToEmbedUrl(url)).toBe(
          'https://docs.google.com/presentation/d/preso-id/embed'
        );
      });
    });

    describe('Google Sheets', () => {
      it('converts edit URLs to /embed and preserves other params', () => {
        const url =
          'https://docs.google.com/spreadsheets/d/sheet-id/edit?gid=0';
        const result = convertToEmbedUrl(url);
        expect(result).toBe(
          'https://docs.google.com/spreadsheets/d/sheet-id/embed?gid=0'
        );
      });
    });

    describe('Google Forms', () => {
      it('adds embedded=true and preserves others', () => {
        const url =
          'https://docs.google.com/forms/d/form-id/viewform?usp=sf_link';
        const result = convertToEmbedUrl(url);
        expect(result).toContain('embedded=true');
        expect(result).toContain('usp=sf_link');
      });
    });

    it('returns original URL for non-Google/YouTube links', () => {
      const url = 'https://example.com';
      expect(convertToEmbedUrl(url)).toBe(url);
    });
  });
});
