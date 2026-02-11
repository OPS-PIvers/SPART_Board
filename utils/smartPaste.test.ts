import { describe, it, expect } from 'vitest';
import { detectWidgetType } from './smartPaste';
import { EmbedConfig, QRConfig } from '../types';

describe('detectWidgetType (Smart Paste)', () => {
  it('detects Google Slides and converts to preview URL', () => {
    const input =
      'https://docs.google.com/presentation/d/14weFpoSvOXRuO8DfhyB3cCEzX48VnCNmqShAdUh_esk/edit?slide=id.g3c33466b1b1_0_0#slide=id.g3c33466b1b1_0_0';
    const result = detectWidgetType(input);

    expect(result).not.toBeNull();
    if (result?.action === 'create-widget') {
      expect(result.type).toBe('embed');
      const config = result.config as EmbedConfig;
      expect(config.url).toContain(
        '/presentation/d/14weFpoSvOXRuO8DfhyB3cCEzX48VnCNmqShAdUh_esk/preview'
      );
    } else {
      throw new Error('Expected create-widget action');
    }
  });

  it('detects Google Docs and converts to edit with minimal UI', () => {
    const input = 'https://docs.google.com/document/d/1abc123/view';
    const result = detectWidgetType(input);

    expect(result).not.toBeNull();
    if (result?.action === 'create-widget') {
      expect(result.type).toBe('embed');
      const config = result.config as EmbedConfig;
      // From urlHelpers.ts: parsed.pathname = `/document/d/${docId}/edit`; parsed.searchParams.set('rm', 'minimal');
      expect(config.url).toContain('/document/d/1abc123/edit');
      expect(config.url).toContain('rm=minimal');
    } else {
      throw new Error('Expected create-widget action');
    }
  });

  it('detects YouTube and converts to embed URL', () => {
    const input = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = detectWidgetType(input);

    expect(result).not.toBeNull();
    if (result?.action === 'create-widget') {
      expect(result.type).toBe('embed');
      const config = result.config as EmbedConfig;
      expect(config.url).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    } else {
      throw new Error('Expected create-widget action');
    }
  });

  it('detects other URLs and defaults to QR widget', () => {
    const input = 'https://google.com';
    const result = detectWidgetType(input);

    expect(result).not.toBeNull();
    if (result?.action === 'create-widget') {
      expect(result.type).toBe('qr');
      const config = result.config as QRConfig;
      expect(config.url).toBe('https://google.com');
    } else {
      throw new Error('Expected create-widget action');
    }
  });

  it('detects HTML content', () => {
    const input = '<html><title>My App</title><body>Hello</body></html>';
    const result = detectWidgetType(input);

    expect(result).not.toBeNull();
    if (result?.action === 'create-mini-app') {
      expect(result.title).toBe('My App');
      expect(result.html).toBe(input);
    } else {
      throw new Error('Expected create-mini-app action');
    }
  });

  it('detects Share Links', () => {
    const input = 'https://myapp.com/share/12345';
    const result = detectWidgetType(input);

    expect(result).not.toBeNull();
    if (result?.action === 'import-board') {
      expect(result.url).toBe(input);
    } else {
      throw new Error('Expected import-board action');
    }
  });
});
