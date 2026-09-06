// Module-level registry for the board camera's pan setter (§4.8): DashboardView
// registers a clamped setter on mount; the settings drawer's camera hook calls
// requestPan. No context, no window event, and a no-op when nothing registered.

import type { Point } from '@/utils/zoomPanMath';

export type PanUpdater = Point | ((previous: Point) => Point);
export type PanSetter = (next: PanUpdater) => void;

let panSetter: PanSetter | null = null;

/** Registers the host's pan setter and returns its unregister function. */
export const registerPanSetter = (setter: PanSetter): (() => void) => {
  panSetter = setter;
  return () => {
    if (panSetter === setter) panSetter = null;
  };
};

/** Applies a pan; returns false (and does nothing) when no host is registered. */
export const requestPan = (next: PanUpdater): boolean => {
  if (!panSetter) return false;
  panSetter(next);
  return true;
};

export const isPanSetterRegistered = (): boolean => panSetter !== null;
