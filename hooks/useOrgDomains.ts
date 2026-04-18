import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isAuthBypass } from '@/config/firebase';
import { useAuth } from '@/context/useAuth';
import type { DomainRecord } from '@/types/organization';

/**
 * Subscribes to `/organizations/{orgId}/domains`. Reads allowed for org
 * members + super admins via Firestore rules.
 *
 * Writes are stubbed — Phase 3 wires real mutations.
 */
export const useOrgDomains = (orgId: string | null) => {
  const { user } = useAuth();
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const shouldSubscribe = !isAuthBypass && Boolean(user) && Boolean(orgId);
  const [loading, setLoading] = useState<boolean>(shouldSubscribe);

  const [prevKey, setPrevKey] = useState(`${shouldSubscribe}:${orgId ?? ''}`);
  const nextKey = `${shouldSubscribe}:${orgId ?? ''}`;
  if (prevKey !== nextKey) {
    setPrevKey(nextKey);
    setLoading(shouldSubscribe);
    if (!shouldSubscribe) {
      setDomains([]);
      setError(null);
    }
  }

  useEffect(() => {
    if (!shouldSubscribe || !orgId) return;

    const unsub = onSnapshot(
      collection(db, 'organizations', orgId, 'domains'),
      (snapshot) => {
        const items: DomainRecord[] = [];
        snapshot.forEach((d) => items.push(d.data() as DomainRecord));
        setDomains(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`[useOrgDomains:${orgId}] snapshot error:`, err);
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [shouldSubscribe, orgId]);

  const addDomain = (_domain: Partial<DomainRecord>): Promise<void> =>
    Promise.reject(new Error('Domain creation will be enabled in Phase 3.'));

  const removeDomain = (_id: string): Promise<void> =>
    Promise.reject(new Error('Domain removal will be enabled in Phase 3.'));

  return {
    domains,
    loading,
    error,
    addDomain,
    removeDomain,
  };
};
