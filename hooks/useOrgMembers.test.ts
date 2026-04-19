import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useOrgMembers } from './useOrgMembers';
import { useAuth } from '@/context/useAuth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import type { MemberRecord } from '@/types/organization';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('@/config/firebase', () => ({
  db: {},
  isAuthBypass: false,
}));

vi.mock('@/context/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockMember: MemberRecord = {
  email: 'paul.ivers@orono.k12.mn.us',
  orgId: 'orono',
  roleId: 'super_admin',
  buildingIds: ['middle'],
  status: 'active',
  invitedAt: '2026-01-01',
  lastActive: null,
};

describe('useOrgMembers', () => {
  const mockUseAuth = useAuth as Mock;
  const mockCollection = collection as Mock;
  const mockOnSnapshot = onSnapshot as Mock;
  const mockDoc = doc as Mock;
  const mockUpdateDoc = updateDoc as Mock;
  const mockDeleteDoc = deleteDoc as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('members-ref');
    mockDoc.mockImplementation((_db: unknown, ...segs: string[]) =>
      segs.join('/')
    );
    mockUpdateDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
  });

  it('skips subscription when orgId is null', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    const { result } = renderHook(() => useOrgMembers(null));
    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(result.current.members).toEqual([]);
    expect(result.current.users).toEqual([]);
  });

  it('hydrates members + derives UserRecord view model', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    mockOnSnapshot.mockImplementation(
      (
        _ref: unknown,
        onNext: (snap: {
          docs: { id: string; data: () => MemberRecord }[];
        }) => void
      ) => {
        queueMicrotask(() =>
          onNext({
            docs: [{ id: mockMember.email, data: () => mockMember }],
          })
        );
        return () => undefined;
      }
    );

    const { result } = renderHook(() => useOrgMembers('orono'));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.members).toHaveLength(1);
      expect(result.current.users).toHaveLength(1);
      expect(result.current.users[0].email).toBe(mockMember.email);
      expect(result.current.users[0].name).toMatch(/Paul/); // derived from email local-part
      expect(result.current.users[0].role).toBe('super_admin');
    });
  });

  it('updateMember translates role → roleId and strips identity fields', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    mockOnSnapshot.mockReturnValue(() => undefined);

    const { result } = renderHook(() => useOrgMembers('orono'));

    await act(async () => {
      await result.current.updateMember('paul@x.com', {
        id: 'ignored',
        email: 'ignored',
        orgId: 'ignored',
        role: 'teacher',
        status: 'inactive',
      });
    });

    expect(mockUpdateDoc).toHaveBeenCalledWith(
      'organizations/orono/members/paul@x.com',
      { roleId: 'teacher', status: 'inactive' }
    );
  });

  it('updateMember no-ops when patch is empty', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    mockOnSnapshot.mockReturnValue(() => undefined);

    const { result } = renderHook(() => useOrgMembers('orono'));

    await act(async () => {
      await result.current.updateMember('paul@x.com', {});
    });

    expect(mockUpdateDoc).not.toHaveBeenCalled();
  });

  it('bulkUpdateMembers fans out across ids', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    mockOnSnapshot.mockReturnValue(() => undefined);

    const { result } = renderHook(() => useOrgMembers('orono'));

    await act(async () => {
      await result.current.bulkUpdateMembers(['a@x.com', 'b@x.com'], {
        status: 'inactive',
      });
    });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      'organizations/orono/members/a@x.com',
      { status: 'inactive' }
    );
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      'organizations/orono/members/b@x.com',
      { status: 'inactive' }
    );
  });

  it('removeMembers fans out deleteDoc calls', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    mockOnSnapshot.mockReturnValue(() => undefined);

    const { result } = renderHook(() => useOrgMembers('orono'));

    await act(async () => {
      await result.current.removeMembers(['a@x.com', 'b@x.com']);
    });

    expect(mockDeleteDoc).toHaveBeenCalledTimes(2);
    expect(mockDeleteDoc).toHaveBeenCalledWith(
      'organizations/orono/members/a@x.com'
    );
    expect(mockDeleteDoc).toHaveBeenCalledWith(
      'organizations/orono/members/b@x.com'
    );
  });

  it('inviteMembers is still a Phase 4 stub', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    mockOnSnapshot.mockReturnValue(() => undefined);

    const { result } = renderHook(() => useOrgMembers('orono'));

    await expect(
      result.current.inviteMembers([], 'teacher', [])
    ).rejects.toThrow(/Phase 4/);
  });

  it('writes reject when orgId is null', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useOrgMembers(null));
    await expect(
      result.current.updateMember('x', { status: 'active' })
    ).rejects.toThrow(/No organization/);
    await expect(
      result.current.bulkUpdateMembers(['x'], { status: 'active' })
    ).rejects.toThrow(/No organization/);
    await expect(result.current.removeMembers(['x'])).rejects.toThrow(
      /No organization/
    );
  });
});
