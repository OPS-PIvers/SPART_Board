import { useState, useEffect, useCallback } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook that returns the current window dimensions.
 * @param enabled - Whether to actively listen for resize events. Defaults to true.
 *                  Optimization: pass false when the component doesn't need to respond
 *                  to resizes (e.g. when not maximized).
 */
export const useWindowSize = (enabled: boolean = true): WindowSize => {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;
    setWindowSize((prev) => {
      // Optimization: skip state update if dimensions haven't actually changed
      if (
        prev.width === window.innerWidth &&
        prev.height === window.innerHeight
      ) {
        return prev;
      }
      return {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    });
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    window.addEventListener('resize', handleResize);

    // Initial sync in case window size changed while disabled or before mount
    // The state update is guarded by an equality check inside handleResize to prevent infinite loops.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [enabled, handleResize]);

  return windowSize;
};
