import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { db, isAuthBypass } from '@/config/firebase';
import { useAuth } from '@/context/useAuth';
import type {
  AuthMethod,
  DomainRecord,
  DomainRole,
  DomainStatus,
} from '@/types/organization';

const slug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/^@/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

const defaultDomainId = (d: Partial<DomainRecord>): string => {
  const base = slug(d.domain ?? '');
  if (base) return base;
  return (globalThis.crypto?.randomUUID?.() ?? `domain-${Date.now()}`).slice(
    0,
    24
  );
};

/**
 * Subscribes to `/organizations/{orgId}/domains`. Reads allowed for org
 * members + super admins via Firestore rules.
 *
 * Writes (add/remove) are scoped to domain+ admins at the rules tier.
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
        const items: DomainRecord[] = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as DomainRecord
        );
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

  const addDomain = async (domain: Partial<DomainRecord>): Promise<void> => {
    if (!orgId) {
      throw new Error('No organization selected.');
    }
    if (!domain.domain) {
      throw new Error('Domain is required.');
    }
    const id = domain.id ?? defaultDomainId(domain);
    const record: DomainRecord = {
      id,
      orgId,
      domain: domain.domain,
      authMethod: (domain.authMethod as AuthMethod) ?? 'google',
      status: (domain.status as DomainStatus) ?? 'pending',
      role: (domain.role as DomainRole) ?? 'staff',
      users: domain.users ?? 0,
      addedAt: domain.addedAt ?? new Date().toISOString(),
    };
    await setDoc(doc(db, 'organizations', orgId, 'domains', id), record);
  };

  const removeDomain = async (id: string): Promise<void> => {
    if (!orgId) {
      throw new Error('No organization selected.');
    }
    await deleteDoc(doc(db, 'organizations', orgId, 'domains', id));
  };

  return {
    domains,
    loading,
    error,
    addDomain,
    removeDomain,
  };
};
