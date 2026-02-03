import { describe, it, expect } from 'vitest';
import { detectWidgetType } from './smartPaste';
import { EmbedConfig, QRConfig } from '../types';

describe('detectWidgetType (Smart Paste)', () => {
  it('detects Google Slides and converts to preview URL', () => {
    const input =
      'https://docs.google.com/presentation/d/14weFpoSvOXRuO8DfhyB3cCEzX48VnCNmqShAdUh_esk/edit?slide=id.g3c33466b1b1_0_0#slide=id.g3c33466b1b1_0_0';
    const result = detectWidgetType(input);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('embed');
    const config = result?.config as EmbedConfig;
    expect(config.url).toBe(
      'https://docs.google.com/presentation/d/14weFpoSvOXRuO8DfhyB3cCEzX48VnCNmqShAdUh_esk/preview'
    );
  });

  it('detects Google Docs and converts to edit with minimal UI', () => {
    const input = 'https://docs.google.com/document/d/1abc123/view';
    const result = detectWidgetType(input);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('embed');
    const config = result?.config as EmbedConfig;
    // From urlHelpers.ts: parsed.pathname = `/document/d/${docId}/edit`; parsed.searchParams.set('rm', 'minimal');
    expect(config.url).toContain('/document/d/1abc123/edit');
    expect(config.url).toContain('rm=minimal');
  });

  it('detects YouTube and converts to embed URL', () => {
    const input = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = detectWidgetType(input);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('embed');
    const config = result?.config as EmbedConfig;
    expect(config.url).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('detects other URLs and defaults to QR widget', () => {
    const input = 'https://google.com';
    const result = detectWidgetType(input);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('qr');
    const config = result?.config as QRConfig;
    expect(config.url).toBe('https://google.com');
  });
});
