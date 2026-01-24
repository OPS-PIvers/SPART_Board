import { describe, it, expect, vi } from 'vitest';
import { detectWidgetType } from '../../utils/smartPaste';
import { ChecklistConfig } from '../../types';

describe('detectWidgetType', () => {
  // Mock crypto.randomUUID
  vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => 'test-uuid'),
  });

  it('detects YouTube URL as embed', () => {
    const text = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const result = detectWidgetType(text);
    expect(result).toEqual({
      type: 'embed',
      config: { url: text, mode: 'url' },
    });
  });

  it('detects Google Docs URL as embed', () => {
    const text = 'https://docs.google.com/document/d/123/edit';
    const result = detectWidgetType(text);
    expect(result).toEqual({
      type: 'embed',
      config: { url: text, mode: 'url' },
    });
  });

  it('detects Image URL as sticker', () => {
    const text = 'https://example.com/image.png';
    const result = detectWidgetType(text);
    expect(result).toEqual({
      type: 'sticker',
      config: { url: text, rotation: 0 },
    });
  });

  it('detects Generic URL as QR', () => {
    const text = 'https://www.wikipedia.org';
    const result = detectWidgetType(text);
    expect(result).toEqual({
      type: 'qr',
      config: { url: text },
    });
  });

  it('detects Multi-line text as checklist', () => {
    const text = 'Apples\nBananas\nOranges';
    const result = detectWidgetType(text);
    expect(result?.type).toBe('checklist');
    // We expect 3 items
    const config = result?.config as ChecklistConfig;
    expect(config.items).toHaveLength(3);
    expect(config.items[0].text).toBe('Apples');
  });

  it('detects Short text as TextWidget', () => {
    const text = 'Hello World';
    const result = detectWidgetType(text);
    expect(result).toEqual({
      type: 'text',
      config: {
        content: 'Hello World',
        bgColor: '#fef3c7',
        fontSize: 18,
      },
    });
  });

  it('escapes HTML in TextWidget', () => {
    const text = '<script>alert("xss")</script>';
    const result = detectWidgetType(text);
    expect(result?.config).toMatchObject({
      content: '&lt;script&gt;alert("xss")&lt;/script&gt;',
    });
  });
});
