// Focus management and the edited-widget marker for the settings drawer
// (§3 items 9 and 11). The marker is set imperatively because DraggableWindow
// renders the widget root.

import { useEffect, type RefObject } from 'react';

export const SETTINGS_TARGET_ATTRIBUTE = 'data-settings-target';

const widgetRoot = (widgetId: string): HTMLElement | null =>
  typeof document === 'undefined'
    ? null
    : document.querySelector<HTMLElement>(`[data-widget-id="${widgetId}"]`);

export interface UseSettingsDrawerFocusArgs {
  widgetId: string | null;
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
    const root = widgetRoot(widgetId);
    root?.setAttribute(SETTINGS_TARGET_ATTRIBUTE, '');
    // Read at close time on purpose: the opener is whatever the host points at then.
    const readOpener = () => openerRef?.current ?? null;

    return () => {
      root?.removeAttribute(SETTINGS_TARGET_ATTRIBUTE);
      const opener = readOpener();
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
