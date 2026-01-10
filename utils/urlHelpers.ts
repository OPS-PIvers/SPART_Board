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
