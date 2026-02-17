import { useState, useEffect, useCallback, useRef } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook that returns the current window dimensions.
 * @param enabled - Whether to actively listen for resize events. Defaults to true.
 *                  Optimization: pass false when the component doesn't need to respond
 *                  to resizes (e.g. when not maximized).
 * @param throttleMs - The throttle delay in milliseconds. Defaults to 100ms.
 */
export const useWindowSize = (
  enabled: boolean = true,
  throttleMs: number = 100
): WindowSize => {
  const [windowSize, setWindowSize] = useState<WindowSize>(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  }));

  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRun = useRef<number | null>(null);

  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const now = Date.now();

    const updateSize = () => {
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
      lastRun.current = Date.now();
      timeoutId.current = null;
    };

    if (lastRun.current === null || now - lastRun.current >= throttleMs) {
      // If enough time has passed, run immediately
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
      updateSize();
    } else {
      // Otherwise, schedule for the end of the throttle period (trailing edge)
      if (!timeoutId.current) {
        // If lastRun.current is somehow null here (it shouldn't be due to the check above), use 0
        const lastRunTime = lastRun.current || 0;
        const wait = throttleMs - (now - lastRunTime);
        timeoutId.current = setTimeout(updateSize, wait);
      }
    }
  }, [throttleMs]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    window.addEventListener('resize', handleResize);

    // Initial sync in case window size changed while disabled or before mount
    // The state update is guarded by an equality check inside handleResize to prevent infinite loops.
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [enabled, handleResize]);

  return windowSize;
};
