import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useOrganizations } from './useOrganizations';
import { useAuth } from '@/context/useAuth';
import { collection, onSnapshot } from 'firebase/firestore';
import type { OrgRecord } from '@/types/organization';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('@/config/firebase', () => ({
  db: {},
  isAuthBypass: false,
}));

vi.mock('@/context/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockOrg: OrgRecord = {
  id: 'orono',
  name: 'Orono Public Schools',
  shortName: 'Orono',
  shortCode: 'OPS',
  state: 'MN',
  plan: 'full',
  aiEnabled: true,
  primaryAdminEmail: 'admin@orono.k12.mn.us',
  createdAt: '2026-01-01',
  users: 12,
  buildings: 4,
  status: 'active',
  seedColor: 'bg-indigo-600',
};

describe('useOrganizations', () => {
  const mockUseAuth = useAuth as Mock;
  const mockCollection = collection as Mock;
  const mockOnSnapshot = onSnapshot as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('organizations-ref');
  });

  it('does not subscribe when user is not a super admin', () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'teacher@orono.k12.mn.us' },
      userRoles: { superAdmins: ['someone-else@example.com'] },
    });

    const { result } = renderHook(() => useOrganizations());

    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(result.current.organizations).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('subscribes and loads orgs for a super admin', async () => {
    mockUseAuth.mockReturnValue({
      user: { email: 'paul.ivers@orono.k12.mn.us' },
      userRoles: { superAdmins: ['paul.ivers@orono.k12.mn.us'] },
    });

    mockOnSnapshot.mockImplementation(
      (
        _ref: unknown,
        onNext: (snap: {
          docs: { id: string; data: () => OrgRecord }[];
        }) => void
      ) => {
        queueMicrotask(() =>
          onNext({
            docs: [{ id: 'orono', data: () => mockOrg }],
          })
        );
        return () => undefined;
      }
    );

    const { result } = renderHook(() => useOrganizations());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.organizations).toHaveLength(1);
      expect(result.current.organizations[0].id).toBe('orono');
    });
  });

  it('write stubs throw phase-3 errors', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userRoles: { superAdmins: [] },
    });

    const { result } = renderHook(() => useOrganizations());

    await expect(result.current.createOrg({})).rejects.toThrow(/Phase 3/);
    await expect(result.current.archiveOrg('orono')).rejects.toThrow(/Phase 3/);
  });
});
