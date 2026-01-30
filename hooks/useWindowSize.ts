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
      // Ensure we have the latest size immediately
      windowSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setSize(windowSize);
    } else {
      // Sync with current known size
      setSize(windowSize);
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
