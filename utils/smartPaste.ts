import { WidgetType, WidgetConfig } from '../types';
import { convertToEmbedUrl } from './urlHelpers';

export type PasteResult =
  | {
      action: 'create-widget';
      type: WidgetType;
      config: WidgetConfig;
      title?: string;
    }
  | { action: 'import-board'; url: string };

/**
 * Detects the most appropriate widget type and initial configuration based on pasted text.
 *
 * @param text - The text content pasted by the user.
 * @returns An object containing the detected type and config, or null if no appropriate type is found.
 */
export function detectWidgetType(text: string): PasteResult | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 1. Board Import (Share Link)
  if (trimmed.includes('/share/')) {
    // Basic validation to ensure it looks like a URL from this app
    // We can be lenient as the import logic will fail if invalid
    return {
      action: 'import-board',
      url: trimmed,
    };
  }

  // 2. HTML Content (Mini App)
  if (/^\s*<[a-z][\s\S]*>/i.test(trimmed)) {
    // Extract title if present
    const titleMatch = trimmed.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    return {
      action: 'create-widget',
      type: 'embed',
      config: {
        mode: 'code',
        html: trimmed,
      } as WidgetConfig,
      title,
    };
  }

  // URL Handling: Normalize by adding protocol if missing but looks like a domain
  let normalizedUrl = trimmed;
  const hasProtocol = /^(http|https):\/\//i.test(normalizedUrl);
  if (!hasProtocol) {
    // Basic domain check: something.something with at least 2 chars TLD
    // and no spaces
    const domainLikePattern = /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:[/:?].*)?$/;
    if (domainLikePattern.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
  }

  // URL Detection
  const isUrl = /^(http|https):\/\/[^ "]+$/.test(normalizedUrl);

  if (isUrl) {
    // Image URL (Sticker)
    if (/\.(png|jpg|jpeg|gif|webp|svg)(\?[^#]*)?(#.*)?$/i.test(normalizedUrl)) {
      return {
        action: 'create-widget',
        type: 'sticker',
        config: { url: normalizedUrl, rotation: 0 } as WidgetConfig,
      };
    }

    // Embed URL (YouTube, Vimeo, Google Docs)
    const isEmbed =
      /(youtube\.com|youtu\.be|vimeo\.com|docs\.google\.com)/.test(
        normalizedUrl
      );

    if (isEmbed) {
      return {
        action: 'create-widget',
        type: 'embed',
        config: {
          url: convertToEmbedUrl(normalizedUrl),
          mode: 'url',
        } as WidgetConfig,
      };
    }

    // Default to QR for other URLs
    return {
      action: 'create-widget',
      type: 'qr',
      config: { url: normalizedUrl } as WidgetConfig,
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
      action: 'create-widget',
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
    action: 'create-widget',
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
