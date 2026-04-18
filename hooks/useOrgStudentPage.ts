import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, isAuthBypass } from '@/config/firebase';
import { useAuth } from '@/context/useAuth';
import type { StudentPageConfig } from '@/types/organization';

/**
 * Subscribes to `/organizations/{orgId}/studentPageConfig/default`. Reads
 * allowed for org members + super admins via Firestore rules.
 *
 * Writes are stubbed — Phase 3 wires real mutations behind the
 * `orgAdminWrites` feature flag.
 */
export const useOrgStudentPage = (orgId: string | null) => {
  const { user } = useAuth();
  const [studentPage, setStudentPage] = useState<StudentPageConfig | null>(
    null
  );
  const [error, setError] = useState<Error | null>(null);

  const shouldSubscribe = !isAuthBypass && Boolean(user) && Boolean(orgId);
  const [loading, setLoading] = useState<boolean>(shouldSubscribe);

  const [prevKey, setPrevKey] = useState(`${shouldSubscribe}:${orgId ?? ''}`);
  const nextKey = `${shouldSubscribe}:${orgId ?? ''}`;
  if (prevKey !== nextKey) {
    setPrevKey(nextKey);
    setLoading(shouldSubscribe);
    if (!shouldSubscribe) {
      setStudentPage(null);
      setError(null);
    }
  }

  useEffect(() => {
    if (!shouldSubscribe || !orgId) return;

    const unsub = onSnapshot(
      doc(db, 'organizations', orgId, 'studentPageConfig', 'default'),
      (snap) => {
        setStudentPage(
          snap.exists() ? (snap.data() as StudentPageConfig) : null
        );
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`[useOrgStudentPage:${orgId}] snapshot error:`, err);
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [shouldSubscribe, orgId]);

  const updateStudentPage = (
    _patch: Partial<StudentPageConfig>
  ): Promise<void> =>
    Promise.reject(new Error('Student page edits will be enabled in Phase 3.'));

  return {
    studentPage,
    loading,
    error,
    updateStudentPage,
  };
};
