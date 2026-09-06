// Module-level "settings just closed" signal (§4.5). Written by both close
// paths (floating panel and drawer), read by DraggableWindow's Escape chain.

/** Freshness window: long enough for the same synchronous keydown dispatch. */
const FRESHNESS_MS = 50;

let closedAt = 0;
let gestureAt = 0;

const now = (): number => Date.now();

/** Marks a settings surface as closed by an explicit close action. */
export const markSettingsJustClosed = (): void => {
  closedAt = now();
};

/** True while the close is fresh enough to suppress a redundant Escape write. */
export const wasSettingsJustClosed = (at: number = now()): boolean =>
  closedAt !== 0 && at - closedAt <= FRESHNESS_MS && at >= closedAt;

/** Marks a close caused by a widget drag/resize gesture: the camera is not restored. */
export const markSettingsClosedByGesture = (): void => {
  gestureAt = now();
};

/** True while a gesture-driven close is fresh. */
export const wasSettingsClosedByGesture = (at: number = now()): boolean =>
  gestureAt !== 0 && at - gestureAt <= FRESHNESS_MS && at >= gestureAt;

/** Test-only reset. */
export const resetSettingsCloseSignal = (): void => {
  closedAt = 0;
  gestureAt = 0;
};
