import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, isAuthBypass } from '@/config/firebase';
import { useAuth } from '@/context/useAuth';
import type { MemberRecord, UserRecord } from '@/types/organization';

// Derive a display name from an email local-part when the member record
// doesn't carry one. Matches the pattern used by the prototype invite flow.
const nameFromEmail = (email: string): string => {
  const local = email.split('@')[0] ?? email;
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
};

const toUserRecord = (m: MemberRecord, orgId: string): UserRecord => ({
  id: m.email,
  orgId,
  name: m.name ?? nameFromEmail(m.email),
  email: m.email,
  role: m.roleId,
  buildingIds: m.buildingIds ?? [],
  status: m.status,
  lastActive: m.lastActive ?? null,
  invitedAt: m.invitedAt,
});

/**
 * Subscribes to `/organizations/{orgId}/members`. Returns both the raw member
 * records and a UI-friendly `UserRecord[]` projection.
 *
 * Writes (update / bulk / remove / invite) are stubbed — Phase 3 wires real
 * mutations behind the `orgAdminWrites` flag. Phase 4 wires invite emails +
 * the Cloud Function that syncs `members` → `/admins/{email}`.
 */
export const useOrgMembers = (orgId: string | null) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const shouldSubscribe = !isAuthBypass && Boolean(user) && Boolean(orgId);
  const [loading, setLoading] = useState<boolean>(shouldSubscribe);

  const [prevKey, setPrevKey] = useState(`${shouldSubscribe}:${orgId ?? ''}`);
  const nextKey = `${shouldSubscribe}:${orgId ?? ''}`;
  if (prevKey !== nextKey) {
    setPrevKey(nextKey);
    setLoading(shouldSubscribe);
    if (!shouldSubscribe) {
      setMembers([]);
      setError(null);
    }
  }

  useEffect(() => {
    if (!shouldSubscribe || !orgId) return;

    const unsub = onSnapshot(
      collection(db, 'organizations', orgId, 'members'),
      (snapshot) => {
        const items: MemberRecord[] = [];
        snapshot.forEach((d) => items.push(d.data() as MemberRecord));
        setMembers(items);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`[useOrgMembers:${orgId}] snapshot error:`, err);
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, [shouldSubscribe, orgId]);

  const users = useMemo<UserRecord[]>(
    () => (orgId ? members.map((m) => toUserRecord(m, orgId)) : []),
    [members, orgId]
  );

  const updateMember = (
    _id: string,
    _patch: Partial<UserRecord>
  ): Promise<void> =>
    Promise.reject(new Error('User edits will be enabled in Phase 3.'));

  const bulkUpdateMembers = (
    _ids: string[],
    _patch: Partial<UserRecord>
  ): Promise<void> =>
    Promise.reject(new Error('Bulk user edits will be enabled in Phase 3.'));

  const removeMembers = (_ids: string[]): Promise<void> =>
    Promise.reject(new Error('User removal will be enabled in Phase 3.'));

  const inviteMembers = (
    _emails: string[],
    _roleId: string,
    _buildingIds: string[],
    _message?: string
  ): Promise<void> =>
    Promise.reject(new Error('Invitations will be enabled in Phase 4.'));

  return {
    members,
    users,
    loading,
    error,
    updateMember,
    bulkUpdateMembers,
    removeMembers,
    inviteMembers,
  };
};
