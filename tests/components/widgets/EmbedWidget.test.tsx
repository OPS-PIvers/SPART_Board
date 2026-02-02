import { describe, it, expect } from 'vitest';
import { convertToEmbedUrl } from '@/utils/urlHelpers';

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

    it('converts /view URLs to /edit?rm=minimal', () => {
      const url = `https://docs.google.com/document/d/${docId}/view`;
      expect(convertToEmbedUrl(url)).toBe(
        `https://docs.google.com/document/d/${docId}/edit?rm=minimal`
      );
    });

    it('converts /preview URLs to /edit?rm=minimal', () => {
      const url = `https://docs.google.com/document/d/${docId}/preview`;
      expect(convertToEmbedUrl(url)).toBe(
        `https://docs.google.com/document/d/${docId}/edit?rm=minimal`
      );
    });

    it('handles URLs with existing tab parameters', () => {
      const url = `https://docs.google.com/document/d/${docId}/edit?tab=t.0`;
      expect(convertToEmbedUrl(url)).toBe(
        `https://docs.google.com/document/d/${docId}/edit?rm=minimal&tab=t.0`
      );
    });

    it('handles URLs with existing tab parameters in different positions', () => {
      const url = `https://docs.google.com/document/d/${docId}/edit?other=1&tab=t.abc&more=2`;
      expect(convertToEmbedUrl(url)).toBe(
        `https://docs.google.com/document/d/${docId}/edit?rm=minimal&tab=t.abc`
      );
    });

    it('handles bare document URLs', () => {
      const url = `https://docs.google.com/document/d/${docId}`;
      expect(convertToEmbedUrl(url)).toBe(
        `https://docs.google.com/document/d/${docId}/edit?rm=minimal`
      );
    });

    it('handles bare document URLs with trailing slash', () => {
      const url = `https://docs.google.com/document/d/${docId}/`;
      expect(convertToEmbedUrl(url)).toBe(
        `https://docs.google.com/document/d/${docId}/edit?rm=minimal`
      );
    });
  });

  it('converts Google Slides edit URLs to /embed', () => {
    const url = 'https://docs.google.com/presentation/d/presentation-id/edit';
    expect(convertToEmbedUrl(url)).toBe(
      'https://docs.google.com/presentation/d/presentation-id/embed'
    );
  });

  it('converts Google Sheets edit URLs to /preview', () => {
    const url = 'https://docs.google.com/spreadsheets/d/sheet-id/edit';
    expect(convertToEmbedUrl(url)).toBe(
      'https://docs.google.com/spreadsheets/d/sheet-id/preview'
    );
  });

  it('adds embedded=true to Google Forms URLs', () => {
    const url = 'https://docs.google.com/forms/d/form-id/viewform';
    expect(convertToEmbedUrl(url)).toBe(
      'https://docs.google.com/forms/d/form-id/viewform?embedded=true'
    );
  });

  it('returns original URL for non-Google/YouTube links', () => {
    const url = 'https://example.com';
    expect(convertToEmbedUrl(url)).toBe(url);
  });
});
