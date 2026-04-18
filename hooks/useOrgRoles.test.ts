import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useOrgRoles } from './useOrgRoles';
import { useAuth } from '@/context/useAuth';
import { collection, onSnapshot } from 'firebase/firestore';
import type { RoleRecord } from '@/types/organization';

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

const mockRole = {
  id: 'teacher',
  name: 'Teacher',
  blurb: 'Default teacher role',
  color: 'sky',
  system: true,
  perms: {},
} as unknown as RoleRecord;

describe('useOrgRoles', () => {
  const mockUseAuth = useAuth as Mock;
  const mockCollection = collection as Mock;
  const mockOnSnapshot = onSnapshot as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('roles-ref');
  });

  it('skips subscription when orgId is null', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    const { result } = renderHook(() => useOrgRoles(null));
    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(result.current.roles).toEqual([]);
  });

  it('hydrates roles from snapshot', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    mockOnSnapshot.mockImplementation(
      (
        _ref: unknown,
        onNext: (snap: {
          forEach: (cb: (d: { data: () => RoleRecord }) => void) => void;
        }) => void
      ) => {
        queueMicrotask(() =>
          onNext({ forEach: (cb) => cb({ data: () => mockRole }) })
        );
        return () => undefined;
      }
    );

    const { result } = renderHook(() => useOrgRoles('orono'));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.roles).toHaveLength(1);
      expect(result.current.roles[0].id).toBe('teacher');
    });
  });

  it('write stubs throw phase-3 errors', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useOrgRoles('orono'));
    await expect(result.current.saveRoles([])).rejects.toThrow(/Phase 3/);
    await expect(result.current.resetRoles()).rejects.toThrow(/Phase 3/);
  });
});
