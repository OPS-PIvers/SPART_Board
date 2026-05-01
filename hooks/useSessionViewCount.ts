/**
 * useSessionViewCount — fetches the count of view-tracking docs for a single
 * view-only session.
 *
 * The four assignment widgets (Quiz, Video Activity, Mini App, Guided
 * Learning) each persist anonymous view events to a `views/` subcollection on
 * their session doc whenever a student loads a view-only share URL. This
 * hook exposes that count so the teacher's Shared / Archive surface can
 * show "viewed N times" without adding a denormalized counter on the
 * session itself.
 *
 * Cost shape: one Firestore aggregation query (`getCountFromServer`) per
 * `(collection, sessionId)` pair, gated behind a module-level cache.
 * Subsequent mounts of the same session — including remount-after-unmount —
 * reuse the cached count. Teachers can force a refetch by calling
 * `invalidateSessionViewCount` (wired into the reactivate / reopen
 * callbacks so the count refreshes after a Closed share is brought back).
 *
 * The hook is intentionally read-once: the user's stated need is "see how
 * many times the URL was opened" — a snapshot suffices and a live listener
 * would be a real-time write multiplier across the teacher's archive.
 */

import { useEffect, useState } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type ViewTrackingCollection =
  | 'quiz_sessions'
  | 'video_activity_sessions'
  | 'mini_app_sessions'
  | 'guided_learning_sessions';

interface CacheEntry {
  count: number | null;
  promise: Promise<number> | null;
}

// Module-level cache so the same sessionId rendered from multiple cards
// (or after a list re-render) doesn't fanout to repeat aggregation queries.
// Cleared on full page reload — sufficient lifetime for a teacher session.
const cache = new Map<string, CacheEntry>();

function cacheKey(collectionName: ViewTrackingCollection, sessionId: string) {
  return `${collectionName}:${sessionId}`;
}

/**
 * Drop the cached view count for a session so the next mount of
 * `useSessionViewCount` re-issues the aggregation query. Wire this into
 * status-change callbacks (Reactivate, Reopen, etc.) where the count is
 * expected to grow again after the call — without it, teachers would see
 * the pre-Closed count forever even as new students hit the link.
 */
export function invalidateSessionViewCount(
  collectionName: ViewTrackingCollection,
  sessionId: string
): void {
  cache.delete(cacheKey(collectionName, sessionId));
}

export interface UseSessionViewCountResult {
  count: number | null;
  loading: boolean;
}

/**
 * @param collectionName Top-level Firestore session collection.
 * @param sessionId Session doc id whose `views/` subcollection should be counted.
 *   Pass `undefined` (or `enabled === false`) to skip the read entirely.
 * @param enabled When false the hook returns `{count: null, loading: false}`
 *   without issuing any query — used to gate the read on view-only mode.
 */
export function useSessionViewCount(
  collectionName: ViewTrackingCollection,
  sessionId: string | undefined,
  enabled: boolean
): UseSessionViewCountResult {
  // Resolved key for the current props — null when the hook is disabled.
  const key = enabled && sessionId ? cacheKey(collectionName, sessionId) : null;

  // The hook reads `count` and `loading` from `cache[key]` during render and
  // re-renders the consumer when the async fetch resolves via `bumpRevision`.
  // No synchronous setState lives in the effect body — the disable / key-
  // change paths just produce a different derived render output, while the
  // network resolution path bumps the revision counter from inside the
  // promise's `.then` callback (async, allowed).
  const [, setRevision] = useState(0);

  useEffect(() => {
    if (!key) return;

    // Early-return on EITHER a resolved count OR an in-flight promise. The
    // promise check is what makes the coalescing actually work under React
    // 18 StrictMode (and any concurrent mount): without it, two effects
    // racing through `cache.get(key)` before either has set `promise` would
    // each call `getCountFromServer`, doubling Firestore reads in dev.
    const cached = cache.get(key);
    if (cached?.count != null) return;
    if (cached?.promise) {
      // Coalesce: hitch a ride on the in-flight promise so this consumer
      // re-renders when it resolves, but don't fire a second query.
      let cancelled = false;
      void cached.promise.then(() => {
        if (!cancelled) setRevision((r) => r + 1);
      });
      return () => {
        cancelled = true;
      };
    }

    // Cache miss + no in-flight: claim the slot synchronously by writing
    // the promise BEFORE awaiting, so a concurrent mount sees it.
    const inFlight: Promise<number> = getCountFromServer(
      collection(db, collectionName, sessionId as string, 'views')
    ).then(
      (snap) => snap.data().count,
      (err: unknown) => {
        // Surface the failure to the caller as `count: 0` rather than
        // null — a zero-state UI ("0 views") is a fine soft-fail and
        // avoids broadcasting an empty cell. Logged for debugging.
        console.warn('[useSessionViewCount] count query failed', err);
        return 0;
      }
    );
    cache.set(key, { count: null, promise: inFlight });

    let cancelled = false;
    void inFlight.then((n) => {
      cache.set(key, { count: n, promise: null });
      if (!cancelled) setRevision((r) => r + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [collectionName, sessionId, enabled, key]);

  if (!key) return { count: null, loading: false };
  const cached = cache.get(key);
  return {
    count: cached?.count ?? null,
    loading: cached?.count == null,
  };
}
