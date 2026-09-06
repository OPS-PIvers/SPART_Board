// Side selection for the settings drawer (§3 items 8 and 10, D23/D24). The side
// is chosen once per open from the widget's live DOM rect and never re-runs on
// drawer resize.

import { useCallback, useLayoutEffect, useReducer, useRef } from 'react';
import { useWindowSize } from '@/hooks/useWindowSize';
import type { DockPosition } from '@/types';

export const BOTTOM_SHEET_BREAKPOINT = 900;

export type DrawerPlacement = 'right' | 'left' | 'bottom';

export interface DrawerRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface SelectDrawerSideArgs {
  rect: DrawerRect;
  viewportWidth: number;
  drawerWidth: number;
  dockPosition?: DockPosition;
}

export interface DrawerSideSelection {
  side: 'right' | 'left';
  needsPan: boolean;
}

/** Pure side selection: prefer a side that needs no pan, else right + pan. */
export const selectDrawerSide = ({
  rect,
  viewportWidth,
  drawerWidth,
  dockPosition = 'bottom',
}: SelectDrawerSideArgs): DrawerSideSelection => {
  const right = rect.left + rect.width;
  const fitsRightDocked =
    rect.left >= 0 && right <= viewportWidth - drawerWidth;
  const fitsLeftDocked = rect.left >= drawerWidth && right <= viewportWidth;

  if (fitsRightDocked && fitsLeftDocked) {
    // Tie-break away from a side-anchored dock (D23).
    const side = dockPosition === 'right' ? 'left' : 'right';
    return { side, needsPan: false };
  }
  if (fitsRightDocked) return { side: 'right', needsPan: false };
  if (fitsLeftDocked) return { side: 'left', needsPan: false };
  return { side: 'right', needsPan: true };
};

/** Viewport rect of the edited widget's DraggableWindow root, or null. */
export const measureWidgetRect = (widgetId: string): DrawerRect | null => {
  if (typeof document === 'undefined') return null;
  const root = document.querySelector(`[data-widget-id="${widgetId}"]`);
  if (!root) return null;
  const r = root.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

interface ChosenSide {
  key: string;
  selection: DrawerSideSelection;
  rect: DrawerRect | null;
}

export interface UseSettingsDrawerPlacementArgs {
  widgetId: string | null;
  open: boolean;
  drawerWidth: number;
  dockPosition?: DockPosition;
}

export interface SettingsDrawerPlacement {
  placement: DrawerPlacement;
  needsPan: boolean;
  rect: DrawerRect | null;
  /** i18n key for the visually-hidden live region; null for the bottom sheet. */
  announcementKey: string | null;
}

export const useSettingsDrawerPlacement = ({
  widgetId,
  open,
  drawerWidth,
  dockPosition = 'bottom',
}: UseSettingsDrawerPlacementArgs): SettingsDrawerPlacement => {
  const { width: viewportWidth } = useWindowSize();
  const isBottom = viewportWidth > 0 && viewportWidth < BOTTOM_SHEET_BREAKPOINT;

  // Guard key: a drawer resize re-runs the effect but never re-selects (D24).
  const selectedForRef = useRef<string | null>(null);

  // useReducer: its dispatch is not flagged by react-hooks/set-state-in-effect (see BoardBreadcrumb).
  const [chosen, setChosen] = useReducer(
    (_: ChosenSide | null, next: ChosenSide | null) => next,
    null
  );

  const openKey = open && widgetId ? widgetId : null;

  // DOM measurement → state, via a callback so the setter is not called in the effect body.
  const select = useCallback(() => {
    if (!openKey || isBottom) {
      selectedForRef.current = null;
      return;
    }
    if (selectedForRef.current === openKey) return;
    selectedForRef.current = openKey;
    const rect = measureWidgetRect(openKey);
    const selection = rect
      ? selectDrawerSide({
          rect,
          viewportWidth: window.innerWidth,
          drawerWidth,
          dockPosition,
        })
      : { side: 'right' as const, needsPan: false };
    setChosen({ key: openKey, selection, rect });
  }, [openKey, isBottom, drawerWidth, dockPosition]);

  useLayoutEffect(() => {
    select();
  }, [select]);

  if (!openKey) {
    return {
      placement: isBottom ? 'bottom' : 'right',
      needsPan: false,
      rect: null,
      announcementKey: null,
    };
  }
  if (isBottom) {
    return {
      placement: 'bottom',
      needsPan: false,
      rect: null,
      announcementKey: null,
    };
  }
  const side = chosen?.key === openKey ? chosen.selection.side : 'right';
  const needsPan = chosen?.key === openKey ? chosen.selection.needsPan : false;
  return {
    placement: side,
    needsPan,
    rect: chosen?.key === openKey ? chosen.rect : null,
    announcementKey:
      side === 'left'
        ? 'widgetSettings.common.dockedLeft'
        : 'widgetSettings.common.dockedRight',
  };
};
