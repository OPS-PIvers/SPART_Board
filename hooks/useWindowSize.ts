import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export const useWindowSize = (enabled: boolean = true): WindowSize => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize((prev) => {
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
    };

    window.addEventListener('resize', handleResize);
    // Initial sync in case window size changed while disabled or before mount
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [enabled]);

  return windowSize;
};
