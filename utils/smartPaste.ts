import { WidgetType, WidgetConfig } from '../types';
import { convertToEmbedUrl } from './urlHelpers';

export type PasteResult =
  | {
      action: 'create-widget';
      type: WidgetType;
      config: WidgetConfig;
      title?: string;
    }
  | { action: 'import-board'; url: string }
  | { action: 'create-mini-app'; html: string; title?: string };

/**
 * Detects the most appropriate paste action based on the provided text.
 * This can result in creating a widget, importing a board, or creating a mini app.
 *
 * @param text - The text content pasted by the user.
 * @returns A {@link PasteResult} describing the detected paste action, or null if the text does not map to any supported action.
 */
export function detectWidgetType(text: string): PasteResult | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  // 1. Board Import (Share Link)
  // Normalize and validate as a URL before treating as an import link.
  // Only allow http(s) URLs or same-origin relative paths whose pathname starts with /share/.
  let candidate = trimmed;
  // Add protocol for bare domains (e.g., "example.com/share/abc")
  const hasShareProtocol = /^(http|https):\/\//i.test(candidate);
  if (!hasShareProtocol) {
    const shareDomainLikePattern =
      /^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:[/:?].*)?$/;
    if (shareDomainLikePattern.test(candidate)) {
      candidate = `https://${candidate}`;
    }
  }

  try {
    const url = new URL(candidate, window.location.origin);
    const protocol = url.protocol.toLowerCase();
    if (
      (protocol === 'http:' || protocol === 'https:') &&
      url.pathname.startsWith('/share/')
    ) {
      return {
        action: 'import-board',
        url: url.href,
      };
    }
  } catch {
    // If parsing fails, fall through and let other detectors handle the text.
  }

  // 2. HTML Content (Mini App)
  if (/^\s*<[a-z][\s\S]*>/i.test(trimmed)) {
    // Extract title if present
    const titleMatch = trimmed.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    return {
      action: 'create-mini-app',
      html: trimmed,
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
