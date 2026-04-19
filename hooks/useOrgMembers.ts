import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
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

// Translate a `UserRecord` patch from the UI into the underlying
// `MemberRecord` field names. `role` (UI) ↔ `roleId` (schema); identity
// fields (id/email/orgId) are stripped because they're immutable.
const userPatchToMemberPatch = (
  patch: Partial<UserRecord>
): Record<string, unknown> => {
  const {
    id: _omitId,
    email: _omitEmail,
    orgId: _omitOrg,
    role,
    ...rest
  } = patch;
  const memberPatch: Record<string, unknown> = { ...rest };
  if (role !== undefined) memberPatch.roleId = role;
  return memberPatch;
};

/**
 * Subscribes to `/organizations/{orgId}/members`. Returns both the raw member
 * records and a UI-friendly `UserRecord[]` projection.
 *
 * Writes: `updateMember` / `bulkUpdateMembers` patch member docs (rules scope
 * the allowed fields per actor role). `removeMembers` deletes the docs —
 * rules restrict this to domain+ admins. `inviteMembers` is a Phase 4 stub
 * because the invite flow requires a Cloud Function to mint tokens and send
 * email; it still throws here.
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
        const items: MemberRecord[] = snapshot.docs.map(
          (d) => ({ email: d.id, ...d.data() }) as MemberRecord
        );
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

  const updateMember = async (
    id: string,
    patch: Partial<UserRecord>
  ): Promise<void> => {
    if (!orgId) {
      throw new Error('No organization selected.');
    }
    const memberPatch = userPatchToMemberPatch(patch);
    if (Object.keys(memberPatch).length === 0) return;
    await updateDoc(
      doc(db, 'organizations', orgId, 'members', id),
      memberPatch
    );
  };

  const bulkUpdateMembers = async (
    ids: string[],
    patch: Partial<UserRecord>
  ): Promise<void> => {
    if (!orgId) {
      throw new Error('No organization selected.');
    }
    const memberPatch = userPatchToMemberPatch(patch);
    if (Object.keys(memberPatch).length === 0 || ids.length === 0) return;
    await Promise.all(
      ids.map((id) =>
        updateDoc(doc(db, 'organizations', orgId, 'members', id), memberPatch)
      )
    );
  };

  const removeMembers = async (ids: string[]): Promise<void> => {
    if (!orgId) {
      throw new Error('No organization selected.');
    }
    if (ids.length === 0) return;
    await Promise.all(
      ids.map((id) => deleteDoc(doc(db, 'organizations', orgId, 'members', id)))
    );
  };

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
