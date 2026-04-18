import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isAuthBypass } from '@/config/firebase';
import { useAuth } from '@/context/useAuth';
import type { OrgRecord } from '@/types/organization';

/**
 * Subscribes to the top-level `/organizations` collection.
 *
 * Firestore rules allow org reads only for members of that org or super
 * admins; a non-super-admin non-member will see a permission error. The hook
 * gates the subscription behind `isSuperAdmin` so the common teacher path
 * never triggers a failing listener.
 *
 * Writes (create / archive) are stubbed as no-ops that throw — Phase 3 wires
 * real mutations once the `orgAdminWrites` feature flag lands.
 */
export const useOrganizations = () => {
  const { user, userRoles } = useAuth();
  const [organizations, setOrganizations] = useState<OrgRecord[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const isSuperAdmin = Boolean(
    user?.email &&
    userRoles?.superAdmins?.some(
      (e) => e.toLowerCase() === user.email?.toLowerCase()
    )
  );

  const shouldSubscribe = !isAuthBypass && Boolean(user) && isSuperAdmin;
  const [loading, setLoading] = useState<boolean>(shouldSubscribe);

  // Adjust state during render when the subscription gate flips — avoids the
  // react-hooks/set-state-in-effect anti-pattern while still clearing stale
  // data when the user signs out or loses super-admin status.
  const [prevShouldSubscribe, setPrevShouldSubscribe] =
    useState(shouldSubscribe);
  if (shouldSubscribe !== prevShouldSubscribe) {
    setPrevShouldSubscribe(shouldSubscribe);
    setLoading(shouldSubscribe);
    if (!shouldSubscribe) {
      setOrganizations([]);
      setError(null);
    }
  }

  useEffect(() => {
    if (!shouldSubscribe) return;

    const unsub = onSnapshot(
      collection(db, 'organizations'),
      (snapshot) => {
        const orgs: OrgRecord[] = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as OrgRecord
        );
        setOrganizations(orgs);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('[useOrganizations] snapshot error:', err);
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [shouldSubscribe]);

  const createOrg = (_org: Partial<OrgRecord>): Promise<void> =>
    Promise.reject(
      new Error('Organization creation will be enabled in Phase 3.')
    );

  const archiveOrg = (_orgId: string): Promise<void> =>
    Promise.reject(
      new Error('Organization archival will be enabled in Phase 3.')
    );

  return {
    organizations,
    loading,
    error,
    createOrg,
    archiveOrg,
  };
};
