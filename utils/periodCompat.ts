/**
 * Backwards-compatible helpers for the periodName → periodNames migration.
 *
 * Old assignments have `periodName?: string`. New assignments have
 * `periodNames?: string[]`. Both may coexist during the transition.
 * These helpers normalise the two fields into a single `string[]`.
 */

/**
 * Normalise legacy `periodName` and new `periodNames` into a single array.
 * Reads `periodNames` if present, otherwise wraps `periodName` into a
 * single-element array. Returns `[]` if neither is set.
 */
export function resolvePeriodNames(obj: {
  periodName?: string;
  periodNames?: string[];
}): string[] {
  if (obj.periodNames && obj.periodNames.length > 0) return obj.periodNames;
  if (obj.periodName) return [obj.periodName];
  return [];
}

/**
 * Build a Firestore-write payload that sets BOTH fields for backwards
 * compatibility. `periodName` = first element (for old clients),
 * `periodNames` = full array.
 */
export function buildPeriodFields(names: string[]): {
  periodName: string;
  periodNames: string[];
} {
  return {
    periodName: names[0] ?? '',
    periodNames: names,
  };
}
