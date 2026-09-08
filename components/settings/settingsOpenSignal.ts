// Module-level "this tab opened settings" signal (§3 multi-tab). A `flipped: true`
// arriving from a Firestore snapshot carries no such mark, so the host renders the
// drawer without panning, focusing, or announcing.

const FRESHNESS_MS = 1000;

let openedId: string | null = null;
let openedAt = 0;

/** Called from the gear / Alt+S path in the tab that initiated the open. */
export const markSettingsOpenedLocally = (widgetId: string): void => {
  openedId = widgetId;
  openedAt = Date.now();
};

/** Consumes the mark for `widgetId`; true only for a local, fresh open. */
export const consumeLocalSettingsOpen = (widgetId: string): boolean => {
  const fresh = openedId === widgetId && Date.now() - openedAt <= FRESHNESS_MS;
  if (fresh) openedId = null;
  return fresh;
};

/** Test-only reset. */
export const resetSettingsOpenSignal = (): void => {
  openedId = null;
  openedAt = 0;
};
