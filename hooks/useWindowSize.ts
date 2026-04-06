import { useSyncExternalStore, useCallback } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

const emptySize: WindowSize = { width: 0, height: 0 };

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
        return () => undefined;
      }
      window.addEventListener('resize', callback);
      return () => window.removeEventListener('resize', callback);
    },
    [enabled]
  );

  const getServerSnapshot = useCallback(() => emptySize, []);

  return useSyncExternalStore(subscribe, getSnapshotImpl, getServerSnapshot);
};

let globalLastSnapshot = emptySize;
function getSnapshotImpl() {
  if (typeof window === 'undefined') return emptySize;
  if (
    globalLastSnapshot.width !== window.innerWidth ||
    globalLastSnapshot.height !== window.innerHeight
  ) {
    globalLastSnapshot = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  return globalLastSnapshot;
}
