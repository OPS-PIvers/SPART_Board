import { useSyncExternalStore, useCallback } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const emptySubscribe = () => () => {};

/**
 * Hook that returns the current window dimensions.
 * @param enabled - Whether to actively listen for resize events. Defaults to true.
 *                  Optimization: pass false when the component doesn't need to respond
 *                  to resizes (e.g. when not maximized).
 */
export const useWindowSize = (enabled: boolean = true): WindowSize => {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!enabled || typeof window === 'undefined') {
        return emptySubscribe();
      }
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    [enabled]
  );

  // For getServerSnapshot, we provide a stable empty result for SSR
  const getServerSnapshot = useCallback((): WindowSize => {
    return { width: 0, height: 0 };
  }, []);

  // React requires the snapshot to be referentially stable if the values haven't changed.
  // We can't return a new object every time getSnapshot is called unless the size actually changed.
  // We'll wrap getSnapshot to cache the result based on innerWidth/innerHeight.
  // However, useSyncExternalStore internally calls getSnapshot and expects it to return the same reference
  // if nothing changed. Since window.innerWidth/innerHeight might be the same but we create a new object,
  // we need a module-level or stable cache for the snapshot.

  return useSyncExternalStore(subscribe, getSnapshotWrapper, getServerSnapshot);
};

let cachedSnapshot: WindowSize | null = null;
const getSnapshotWrapper = (): WindowSize => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  const currentWidth = window.innerWidth;
  const currentHeight = window.innerHeight;

  if (
    !cachedSnapshot ||
    cachedSnapshot.width !== currentWidth ||
    cachedSnapshot.height !== currentHeight
  ) {
    cachedSnapshot = { width: currentWidth, height: currentHeight };
  }
  return cachedSnapshot;
};
