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
  const [prevEnabled, setPrevEnabled] = useState(enabled);

  // "Adjusting state during rendering" pattern: if enabled changes, or on initial render,
  // we check if dimensions have drifted while disabled/unmounted.
  if (enabled && typeof window !== 'undefined') {
    if (
      windowSize.width !== window.innerWidth ||
      windowSize.height !== window.innerHeight
    ) {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }

  // We still need to track prevEnabled to ensure we don't infinitely re-render
  // if dimensions drift continuously, but actually the equality check above is sufficient
  // because if windowSize already matches window.inner*, it won't set state again.
  if (enabled !== prevEnabled) {
    setPrevEnabled(enabled);
  }

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
    return () => window.removeEventListener('resize', handleResize);
  }, [enabled, handleResize]);

  return windowSize;
};
