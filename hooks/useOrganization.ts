import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isAuthBypass } from '@/config/firebase';
import { useAuth } from '@/context/useAuth';
import type { OrgRecord } from '@/types/organization';

/**
 * Subscribes to a single `/organizations/{orgId}` doc. Reads are gated at the
 * rules layer to org members + super admins; non-members will see an error.
 *
 * Writes (update / archive) are stubbed — Phase 3 wires real mutations.
 */
export const useOrganization = (orgId: string | null) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrgRecord | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const shouldSubscribe = !isAuthBypass && Boolean(user) && Boolean(orgId);
  const [loading, setLoading] = useState<boolean>(shouldSubscribe);

  const [prevKey, setPrevKey] = useState(`${shouldSubscribe}:${orgId ?? ''}`);
  const nextKey = `${shouldSubscribe}:${orgId ?? ''}`;
  if (prevKey !== nextKey) {
    setPrevKey(nextKey);
    setLoading(shouldSubscribe);
    if (!shouldSubscribe) {
      setOrganization(null);
      setError(null);
    }
  }

  useEffect(() => {
    if (!shouldSubscribe || !orgId) return;

    const unsub = onSnapshot(
      doc(db, 'organizations', orgId),
      (snap) => {
        setOrganization(
          snap.exists() ? ({ id: snap.id, ...snap.data() } as OrgRecord) : null
        );
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`[useOrganization:${orgId}] snapshot error:`, err);
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [shouldSubscribe, orgId]);

  const updateOrg = (_patch: Partial<OrgRecord>): Promise<void> =>
    Promise.reject(new Error('Organization edits will be enabled in Phase 3.'));

  const archiveOrg = (): Promise<void> =>
    Promise.reject(
      new Error('Organization archival will be enabled in Phase 3.')
    );

  return {
    organization,
    loading,
    error,
    updateOrg,
    archiveOrg,
  };
};
