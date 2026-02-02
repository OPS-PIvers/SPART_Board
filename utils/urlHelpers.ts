/**
 * Get the current origin URL safely, handling SSR contexts where window may be undefined.
 * @returns The origin URL (e.g., 'https://example.com') or an empty string if window is unavailable
 */
export const getOriginUrl = (): string => {
  return typeof window !== 'undefined' ? window.location.origin : '';
};

/**
 * Get the full join URL for students to access the live session.
 * @returns The join URL (e.g., 'https://example.com/join')
 */
export const getJoinUrl = (): string => {
  const origin = getOriginUrl();
  return origin ? `${origin}/join` : '/join';
};

/**
 * Converts various service URLs (YouTube, Google Docs/Slides/Sheets/Forms) to their embeddable counterparts.
 * @param url The original URL to convert
 * @returns The embeddable URL
 */
export const convertToEmbedUrl = (url: string): string => {
  if (!url) return '';
  const embedUrl = url.trim();

  // YouTube
  const ytMatch =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(
      embedUrl
    );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Google Docs
  if (embedUrl.includes('docs.google.com/document')) {
    const docIdMatch = /\/document\/d\/([a-zA-Z0-9_-]+)/.exec(embedUrl);
    if (docIdMatch) {
      const docId = docIdMatch[1];
      const tabMatch = /[?&]tab=([^&]+)/.exec(embedUrl);
      const tabParam = tabMatch ? `&tab=${tabMatch[1]}` : '';
      return `https://docs.google.com/document/d/${docId}/edit?rm=minimal${tabParam}`;
    }
  }

  // Google Slides
  if (embedUrl.includes('docs.google.com/presentation')) {
    return embedUrl.replace(/\/edit.*$/, '/embed');
  }

  // Google Sheets
  if (embedUrl.includes('docs.google.com/spreadsheets')) {
    return embedUrl.replace(/\/edit.*$/, '/preview');
  }

  // Google Forms
  if (
    embedUrl.includes('docs.google.com/forms') &&
    !embedUrl.includes('embedded=true')
  ) {
    const separator = embedUrl.includes('?') ? '&' : '?';
    return `${embedUrl}${separator}embedded=true`;
  }

  return embedUrl;
};
