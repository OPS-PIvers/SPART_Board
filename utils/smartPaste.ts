import { WidgetType, WidgetConfig } from '../types';

export function detectWidgetType(text: string): {
  type: WidgetType;
  config: WidgetConfig;
} | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  // URL Detection
  const isUrl = /^(http|https):\/\/[^ "]+$/.test(trimmed);

  if (isUrl) {
    // Image URL (Sticker)
    if (/\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(trimmed)) {
      return {
        type: 'sticker',
        config: { url: trimmed, rotation: 0 } as WidgetConfig,
      };
    }

    // Embed URL (YouTube, Vimeo, Google Docs)
    // Note: EmbedWidget handles formatting these URLs internally
    const isEmbed =
      /(youtube\.com|youtu\.be|vimeo\.com|docs\.google\.com)/.test(trimmed);

    if (isEmbed) {
      return {
        type: 'embed',
        config: { url: trimmed, mode: 'url' } as WidgetConfig,
      };
    }

    // Default to QR for other URLs
    return {
      type: 'qr',
      config: { url: trimmed } as WidgetConfig,
    };
  }

  // Checklist Detection (Multi-line)
  // Heuristic: If there are 3 or more non-empty lines, assume it's a list.
  const lines = trimmed
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l);
  if (lines.length >= 3) {
    return {
      type: 'checklist',
      config: {
        items: lines.map((line) => ({
          id: crypto.randomUUID(),
          text: line,
          completed: false,
        })),
        mode: 'manual',
      } as WidgetConfig,
    };
  }

  // Text Fallback
  // Convert newlines to breaks for HTML display
  return {
    type: 'text',
    config: {
      content: trimmed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br/>'),
      bgColor: '#fef3c7',
      fontSize: 18,
    } as WidgetConfig,
  };
}
