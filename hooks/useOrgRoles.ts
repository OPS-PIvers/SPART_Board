import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isAuthBypass } from '@/config/firebase';
import { useAuth } from '@/context/useAuth';
import type { RoleRecord } from '@/types/organization';

/**
 * Subscribes to `/organizations/{orgId}/roles`. Reads allowed for org members
 * + super admins via Firestore rules.
 *
 * Writes are stubbed — Phase 3 wires real role save / reset behind the
 * `orgAdminWrites` feature flag, with system-role protection in the rules.
 */
export const useOrgRoles = (orgId: string | null) => {
  const { user } = useAuth();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const shouldSubscribe = !isAuthBypass && Boolean(user) && Boolean(orgId);
  const [loading, setLoading] = useState<boolean>(shouldSubscribe);

  const [prevKey, setPrevKey] = useState(`${shouldSubscribe}:${orgId ?? ''}`);
  const nextKey = `${shouldSubscribe}:${orgId ?? ''}`;
  if (prevKey !== nextKey) {
    setPrevKey(nextKey);
    setLoading(shouldSubscribe);
    if (!shouldSubscribe) {
      setRoles([]);
      setError(null);
    }
  }

  useEffect(() => {
    if (!shouldSubscribe || !orgId) return;

    const unsub = onSnapshot(
      collection(db, 'organizations', orgId, 'roles'),
      (snapshot) => {
        const items: RoleRecord[] = [];
        snapshot.forEach((d) => items.push(d.data() as RoleRecord));
        setRoles(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`[useOrgRoles:${orgId}] snapshot error:`, err);
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [shouldSubscribe, orgId]);

  const saveRoles = (_roles: RoleRecord[]): Promise<void> =>
    Promise.reject(new Error('Role edits will be enabled in Phase 3.'));

  const resetRoles = (): Promise<void> =>
    Promise.reject(new Error('Role reset will be enabled in Phase 3.'));

  return {
    roles,
    loading,
    error,
    saveRoles,
    resetRoles,
  };
};
