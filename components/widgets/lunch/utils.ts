import { NutrisliceWeek } from './types';

export const SCHOOL_OPTIONS = [
  { id: 'schumann-elementary', label: 'Schumann Elementary' },
  { id: 'orono-intermediate-school', label: 'Orono Intermediate' },
];

export const DEFAULT_RECIPIENT_EMAIL = 'paul.ivers@orono.k12.mn.us';

// NOTE: Using third-party CORS proxy services introduces security and reliability concerns.
// These proxies can inspect all data passing through them, and their availability is not guaranteed.
// TODO: Implement a backend proxy endpoint under our control or work with Nutrislice API
// to get proper CORS headers configured for a production-ready solution.
export const fetchWithFallback = async (url: string): Promise<NutrisliceWeek | undefined> => {
  const proxies = [
    (u: string) =>
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) =>
      `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  ];

  let lastError: Error | null = null;

  for (const getProxyUrl of proxies) {
    try {
      const response = await fetch(getProxyUrl(url));
      if (!response.ok) throw new Error(`Proxy status: ${response.status}`);

      const text = await response.text();
      const trimmedText = text.trim();

      // Improved HTML/Empty detection (case-insensitive and more robust)
      if (
        !trimmedText ||
        trimmedText.startsWith('<') ||
        trimmedText.toLowerCase().startsWith('<!doctype') ||
        trimmedText.toLowerCase().startsWith('<html')
      ) {
        throw new Error(
          'Proxy returned HTML or empty response instead of JSON'
        );
      }

      const jsonContent = JSON.parse(trimmedText) as NutrisliceWeek;

      console.warn('[LunchCountWidget] Fetched Nutrislice Data successfully');

      if (jsonContent && jsonContent.days) return jsonContent;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));

      // Use console.warn as required by lint rules

      console.warn(
        `[LunchCountWidget] Proxy attempt failed: ${lastError.message}`
      );
    }
  }
  throw lastError ?? new Error('All proxies failed');
};
