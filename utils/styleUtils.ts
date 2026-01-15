import type { CSSProperties } from 'react';

/**
 * Returns inline styles for background images (URLs or data URIs).
 * Returns empty object for Tailwind class-based backgrounds.
 */
export const getBackgroundImageStyle = (bg?: string): CSSProperties => {
  if (!bg) return {};

  // Only allow HTTPS URLs and data URIs for security
  if (bg.startsWith('https://') || bg.startsWith('data:')) {
    return {
      backgroundImage: `url("${bg}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  return {};
};

/**
 * Returns Tailwind class name for backgrounds, with validation to prevent XSS.
 * Only allows valid Tailwind background utility classes.
 */
export const getBackgroundClass = (bg?: string): string => {
  if (!bg) return '';

  // If it's a URL, don't apply as a class
  if (bg.startsWith('https://') || bg.startsWith('data:')) return '';

  const trimmed = bg.trim();
  // Only allow expected Tailwind background utility classes
  // Pattern matches: bg-*, from-*, to-*, [background-size:*], etc.
  const isValidTailwindBgClass =
    /^(bg-|from-|to-|\[background-size:)[a-z0-9\-/:()#[\]_,%]+(\s+(bg-|from-|to-|\[background-size:)[a-z0-9\-/:()#[\]_,%]+)*$/i.test(
      trimmed
    );

  return isValidTailwindBgClass ? trimmed : '';
};
