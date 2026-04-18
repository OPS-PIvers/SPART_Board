import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useOrgBuildings } from './useOrgBuildings';
import { useAuth } from '@/context/useAuth';
import { collection, onSnapshot } from 'firebase/firestore';
import type { BuildingRecord } from '@/types/organization';

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

const mockBuilding: BuildingRecord = {
  id: 'schumann',
  orgId: 'orono',
  name: 'Schumann Elementary',
  type: 'elementary',
  address: '123 Elm',
  grades: 'K-2',
  users: 3,
  adminEmails: [],
};

describe('useOrgBuildings', () => {
  const mockUseAuth = useAuth as Mock;
  const mockCollection = collection as Mock;
  const mockOnSnapshot = onSnapshot as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('buildings-ref');
  });

  it('skips subscription when orgId is null', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    const { result } = renderHook(() => useOrgBuildings(null));
    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(result.current.buildings).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('hydrates buildings from snapshot', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    mockOnSnapshot.mockImplementation(
      (
        _ref: unknown,
        onNext: (snap: {
          forEach: (cb: (d: { data: () => BuildingRecord }) => void) => void;
        }) => void
      ) => {
        queueMicrotask(() =>
          onNext({ forEach: (cb) => cb({ data: () => mockBuilding }) })
        );
        return () => undefined;
      }
    );

    const { result } = renderHook(() => useOrgBuildings('orono'));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.buildings).toHaveLength(1);
      expect(result.current.buildings[0].id).toBe('schumann');
    });
  });

  it('write stubs throw phase-3 errors', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useOrgBuildings('orono'));
    await expect(result.current.addBuilding({})).rejects.toThrow(/Phase 3/);
    await expect(result.current.updateBuilding('x', {})).rejects.toThrow(
      /Phase 3/
    );
    await expect(result.current.removeBuilding('x')).rejects.toThrow(/Phase 3/);
  });
});
