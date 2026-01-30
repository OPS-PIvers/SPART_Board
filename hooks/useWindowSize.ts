import { useState, useLayoutEffect, useEffect } from 'react';

// Use useLayoutEffect in browser environments to prevent flicker,
// and useEffect in SSR to avoid warnings.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface WindowSize {
  width: number;
  height: number;
}

// Module-level singleton state to share one event listener
const listeners = new Set<(size: WindowSize) => void>();

let windowSize: WindowSize = {
  width: typeof window !== 'undefined' ? window.innerWidth : 0,
  height: typeof window !== 'undefined' ? window.innerHeight : 0,
};

let timeoutId: number | null = null;

const handleResize = () => {
  if (timeoutId) return;

  // Throttle updates to 100ms
  timeoutId = window.setTimeout(() => {
    const nextWidth = window.innerWidth;
    const nextHeight = window.innerHeight;

    // Only update and notify listeners if the size actually changed
    if (nextWidth !== windowSize.width || nextHeight !== windowSize.height) {
      windowSize = {
        width: nextWidth,
        height: nextHeight,
      };
      listeners.forEach((listener) => listener(windowSize));
    }
    timeoutId = null;
  }, 100);
};

export const useWindowSize = (): WindowSize => {
  const [size, setSize] = useState<WindowSize>(windowSize);

  useIsomorphicLayoutEffect(() => {
    // Add this component's state setter to the listeners
    listeners.add(setSize);

    // If this is the first listener, set up the global event listener
    if (listeners.size === 1) {
      window.addEventListener('resize', handleResize);
    }

    // Check for stale state (e.g. resized while no listeners were active)
    // Only update if actually different to avoid unnecessary re-renders
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    if (
      currentWidth !== windowSize.width ||
      currentHeight !== windowSize.height
    ) {
      windowSize = {
        width: currentWidth,
        height: currentHeight,
      };
      // Notify all listeners (including self, since we just added setSize)
      listeners.forEach((listener) => listener(windowSize));
    } else {
      // Even if global state matches, ensure local component state is in sync.
      // We use the functional update form to access the current state value
      // without adding 'size' to the dependency array.
      setSize((prevSize) => {
        if (
          prevSize.width !== windowSize.width ||
          prevSize.height !== windowSize.height
        ) {
          return windowSize;
        }
        return prevSize;
      });
    }

    return () => {
      listeners.delete(setSize);

      // If no listeners remain, clean up the global event listener
      if (listeners.size === 0) {
        window.removeEventListener('resize', handleResize);
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    };
  }, []);

  return size;
};
