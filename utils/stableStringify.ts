// Firestore hands documents back with alphabetically sorted map keys, so a
// plain JSON.stringify of a value round-tripped through it never matches the
// same-content value as first constructed locally. Sort keys before
// stringifying so change-detection/merge comparisons are content-based, not
// key-order-based. See PR #2843 and #2876 for the two prior occurrences of
// this exact bug class.
export const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const body = Object.keys(obj)
      .sort()
      .filter((k) => obj[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
      .join(',');
    return `{${body}}`;
  }
  return JSON.stringify(value) ?? 'null';
};
