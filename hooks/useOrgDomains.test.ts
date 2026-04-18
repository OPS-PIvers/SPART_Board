import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { useOrgDomains } from './useOrgDomains';
import { useAuth } from '@/context/useAuth';
import { collection, onSnapshot } from 'firebase/firestore';
import type { DomainRecord } from '@/types/organization';

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

const mockDomain: DomainRecord = {
  id: 'orono.k12.mn.us',
  orgId: 'orono',
  domain: '@orono.k12.mn.us',
  authMethod: 'google',
  status: 'verified',
  role: 'primary',
  users: 12,
  addedAt: '2026-01-01',
};

describe('useOrgDomains', () => {
  const mockUseAuth = useAuth as Mock;
  const mockCollection = collection as Mock;
  const mockOnSnapshot = onSnapshot as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection.mockReturnValue('domains-ref');
  });

  it('skips subscription when orgId is null', () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    const { result } = renderHook(() => useOrgDomains(null));
    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(result.current.domains).toEqual([]);
  });

  it('hydrates domains from snapshot', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u' } });
    mockOnSnapshot.mockImplementation(
      (
        _ref: unknown,
        onNext: (snap: {
          docs: { id: string; data: () => DomainRecord }[];
        }) => void
      ) => {
        queueMicrotask(() =>
          onNext({
            docs: [{ id: 'orono.k12.mn.us', data: () => mockDomain }],
          })
        );
        return () => undefined;
      }
    );

    const { result } = renderHook(() => useOrgDomains('orono'));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.domains).toHaveLength(1);
    });
  });

  it('write stubs throw phase-3 errors', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useOrgDomains('orono'));
    await expect(result.current.addDomain({})).rejects.toThrow(/Phase 3/);
    await expect(result.current.removeDomain('x')).rejects.toThrow(/Phase 3/);
  });
});
