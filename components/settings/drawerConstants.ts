/** Drawer geometry (D4, §3 item 10). Side placements size in px; the bottom sheet sizes in vh. */
export const DRAWER_MIN_WIDTH = 360;
export const DRAWER_MAX_WIDTH = 560;
export const DRAWER_DEFAULT_WIDTH = 400;

/** Below this viewport width the drawer renders as a bottom sheet (D14). */
export const DRAWER_SHEET_BREAKPOINT = 900;

export const SHEET_MIN_VH = 35;
export const SHEET_MAX_VH = 85;
export const SHEET_DEFAULT_VH = 50;

/** Keyboard resize steps: plain arrow, then Shift + arrow. */
export const DRAWER_RESIZE_STEP = 16;
export const DRAWER_RESIZE_STEP_LARGE = 64;
export const SHEET_RESIZE_STEP = 2;
export const SHEET_RESIZE_STEP_LARGE = 8;

export type DrawerPlacement = 'right' | 'left' | 'bottom';

export type DrawerSizeBounds = {
  min: number;
  max: number;
  step: number;
  stepLarge: number;
};

export function drawerSizeBounds(placement: DrawerPlacement): DrawerSizeBounds {
  return placement === 'bottom'
    ? {
        min: SHEET_MIN_VH,
        max: SHEET_MAX_VH,
        step: SHEET_RESIZE_STEP,
        stepLarge: SHEET_RESIZE_STEP_LARGE,
      }
    : {
        min: DRAWER_MIN_WIDTH,
        max: DRAWER_MAX_WIDTH,
        step: DRAWER_RESIZE_STEP,
        stepLarge: DRAWER_RESIZE_STEP_LARGE,
      };
}

export function clampDrawerSize(
  size: number,
  placement: DrawerPlacement
): number {
  const { min, max } = drawerSizeBounds(placement);
  if (!Number.isFinite(size)) return min;
  return Math.min(max, Math.max(min, Math.round(size)));
}
