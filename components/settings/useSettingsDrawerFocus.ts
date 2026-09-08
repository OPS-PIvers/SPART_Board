// Focus management and the edited-widget marker for the settings drawer
// (§3 items 9 and 11). The marker is set imperatively because DraggableWindow
// renders the widget root.

import { useEffect, type RefObject } from 'react';

export const SETTINGS_TARGET_ATTRIBUTE = 'data-settings-target';

const widgetRoot = (widgetId: string): HTMLElement | null =>
  typeof document === 'undefined'
    ? null
    : document.querySelector<HTMLElement>(
        `[data-widget-id="${widgetId}"]:not([data-widget-portal])`
      );

/** Sets the edited-widget marker whenever the drawer is open, regardless of which tab opened it. */
export const useSettingsTargetMarker = (
  widgetId: string | null,
  open: boolean
): void => {
  useEffect(() => {
    if (!open || !widgetId) return undefined;
    const root = widgetRoot(widgetId);
    root?.setAttribute(SETTINGS_TARGET_ATTRIBUTE, '');
    return () => {
      root?.removeAttribute(SETTINGS_TARGET_ATTRIBUTE);
    };
  }, [open, widgetId]);
};

export interface UseSettingsDrawerFocusArgs {
  widgetId: string | null;
  /** Move focus to the heading on open / opener on close (local-origin opens only). */
  open: boolean;
  /** The drawer heading (tabIndex -1); focus moves here on open. */
  headingRef: RefObject<HTMLElement | null>;
  /** The element that opened the drawer (gear button); focused on close. */
  openerRef?: RefObject<HTMLElement | null>;
}

export const useSettingsDrawerFocus = ({
  widgetId,
  open,
  headingRef,
  openerRef,
}: UseSettingsDrawerFocusArgs): void => {
  useEffect(() => {
    if (!open || !widgetId) return;
    headingRef.current?.focus();
    // Capture now: a same-render widget swap repoints openerRef before this cleanup runs.
    const opener = openerRef?.current ?? null;

    return () => {
      if (opener && opener.isConnected) {
        opener.focus();
        return;
      }
      const fallback = widgetRoot(widgetId);
      if (!fallback) return;
      if (!fallback.hasAttribute('tabindex')) fallback.tabIndex = -1;
      fallback.focus();
    };
  }, [open, widgetId, headingRef, openerRef]);
};
