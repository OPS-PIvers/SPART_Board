// Module-level registry for the board camera's pan setter (§4.8): DashboardView
// registers a clamped setter on mount; the settings drawer's camera hook calls
// requestPan. No context, no window event, and a no-op when nothing registered.

import type { Point } from '@/utils/zoomPanMath';

export type PanUpdater = Point | ((previous: Point) => Point);
export type PanSetter = (next: PanUpdater) => void;

export type PanGetter = () => Point;

let panSetter: PanSetter | null = null;
let panGetter: PanGetter | null = null;

/** Registers the host's pan setter and returns its unregister function. */
export const registerPanSetter = (setter: PanSetter): (() => void) => {
  panSetter = setter;
  return () => {
    if (panSetter === setter) panSetter = null;
  };
};

/** Registers an accessor for the host's current pan and returns its unregister function. */
export const registerPanGetter = (getter: PanGetter): (() => void) => {
  panGetter = getter;
  return () => {
    if (panGetter === getter) panGetter = null;
  };
};

/** Applies a pan; returns false (and does nothing) when no host is registered. */
export const requestPan = (next: PanUpdater): boolean => {
  if (!panSetter) return false;
  panSetter(next);
  return true;
};

/** Reads the current pan without triggering a setter/board-pan event; null when no host is registered. */
export const getPan = (): Point | null => (panGetter ? panGetter() : null);

export const isPanSetterRegistered = (): boolean => panSetter !== null;
