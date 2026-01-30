import { useState, useEffect } from 'react';

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
    windowSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    listeners.forEach((listener) => listener(windowSize));
    timeoutId = null;
  }, 100);
};

export const useWindowSize = (): WindowSize => {
  const [size, setSize] = useState<WindowSize>(windowSize);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Add this component's state setter to the listeners
    listeners.add(setSize);

    // If this is the first listener, set up the global event listener
    if (listeners.size === 1) {
      window.addEventListener('resize', handleResize);
    }

    // Check for stale state (e.g. resized while no listeners were active)
    // Only update if actually different to avoid unnecessary re-renders
    if (
      window.innerWidth !== windowSize.width ||
      window.innerHeight !== windowSize.height
    ) {
      windowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      // Notify all listeners (including self, since we just added setSize)
      listeners.forEach((listener) => listener(windowSize));
    } else {
      // Even if global state matches, ensure local component state is in sync
      // (This handles the edge case where a component mounts with an old initial state but global is current)
      if (
        size.width !== windowSize.width ||
        size.height !== windowSize.height
      ) {
        setSize(windowSize);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return size;
};
