import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isAuthBypass } from '@/config/firebase';
import { useAuth } from '@/context/useAuth';
import type { BuildingRecord } from '@/types/organization';

/**
 * Subscribes to `/organizations/{orgId}/buildings`. Reads allowed for org
 * members + super admins via Firestore rules.
 *
 * Writes are stubbed — Phase 3 wires real mutations.
 */
export const useOrgBuildings = (orgId: string | null) => {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<BuildingRecord[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const shouldSubscribe = !isAuthBypass && Boolean(user) && Boolean(orgId);
  const [loading, setLoading] = useState<boolean>(shouldSubscribe);

  const [prevKey, setPrevKey] = useState(`${shouldSubscribe}:${orgId ?? ''}`);
  const nextKey = `${shouldSubscribe}:${orgId ?? ''}`;
  if (prevKey !== nextKey) {
    setPrevKey(nextKey);
    setLoading(shouldSubscribe);
    if (!shouldSubscribe) {
      setBuildings([]);
      setError(null);
    }
  }

  useEffect(() => {
    if (!shouldSubscribe || !orgId) return;

    const unsub = onSnapshot(
      collection(db, 'organizations', orgId, 'buildings'),
      (snapshot) => {
        const items: BuildingRecord[] = [];
        snapshot.forEach((d) => items.push(d.data() as BuildingRecord));
        setBuildings(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`[useOrgBuildings:${orgId}] snapshot error:`, err);
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [shouldSubscribe, orgId]);

  const addBuilding = (_building: Partial<BuildingRecord>): Promise<void> =>
    Promise.reject(new Error('Building creation will be enabled in Phase 3.'));

  const updateBuilding = (
    _id: string,
    _patch: Partial<BuildingRecord>
  ): Promise<void> =>
    Promise.reject(new Error('Building edits will be enabled in Phase 3.'));

  const removeBuilding = (_id: string): Promise<void> =>
    Promise.reject(new Error('Building archival will be enabled in Phase 3.'));

  return {
    buildings,
    loading,
    error,
    addBuilding,
    updateBuilding,
    removeBuilding,
  };
};
