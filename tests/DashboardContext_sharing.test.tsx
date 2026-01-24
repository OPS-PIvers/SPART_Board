import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DashboardProvider } from '../context/DashboardContext';
import { Dashboard } from '../types';

// Mock dependencies
const mockUser = {
  uid: 'test-user',
  displayName: 'Test User',
  email: 'test@example.com',
};

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAdmin: false,
  }),
}));

const mockLoadSharedDashboard = vi.fn();
const mockSaveDashboard = vi.fn().mockResolvedValue(undefined);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSubscribeToDashboards = vi.fn((cb: any) => {
  // Immediate callback with empty list to simulate loaded state
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  cb([], false);
  return () => {
    // no-op
  };
});

vi.mock('../hooks/useFirestore', () => ({
  useFirestore: () => ({
    saveDashboard: mockSaveDashboard,
    saveDashboards: vi.fn().mockResolvedValue(undefined),
    deleteDashboard: vi.fn().mockResolvedValue(undefined),
    subscribeToDashboards: mockSubscribeToDashboards,
    shareDashboard: vi.fn(),
    loadSharedDashboard: mockLoadSharedDashboard,
    rosters: [],
    addRoster: vi.fn(),
    updateRoster: vi.fn(),
    deleteRoster: vi.fn(),
    setActiveRoster: vi.fn(),
    activeRosterId: null,
  }),
}));

vi.mock('../hooks/useRosters', () => ({
  useRosters: () => ({
    rosters: [],
    activeRosterId: null,
    addRoster: vi.fn(),
    updateRoster: vi.fn(),
    deleteRoster: vi.fn(),
    setActiveRoster: vi.fn(),
  }),
}));

describe('DashboardContext Sharing Logic', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'location', {
      value: {
        ...originalLocation,
        pathname: '/share/test-share-id',
        assign: vi.fn(),
        replace: vi.fn(),
      },
      writable: true,
    });

    // Mock history.replaceState
    window.history.replaceState = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('should load shared dashboard and duplicate it when visiting share URL', async () => {
    const sharedDashboard: Dashboard = {
      id: 'original-id',
      name: 'Shared Board',
      background: 'bg-slate-900',
      widgets: [],
      createdAt: 1234567890,
    };

    mockLoadSharedDashboard.mockResolvedValue(sharedDashboard);

    render(
      <DashboardProvider>
        <div>Test App</div>
      </DashboardProvider>
    );

    // Verify loadSharedDashboard is called
    await waitFor(
      () => {
        expect(mockLoadSharedDashboard).toHaveBeenCalledWith('test-share-id');
      },
      { timeout: 2000 }
    );

    // Verify saveDashboard is called (duplication)
    await waitFor(() => {
      expect(mockSaveDashboard).toHaveBeenCalled();
      // We might have multiple calls to saveDashboard (one for default dashboard, one for shared)
      // We need to find the one that corresponds to the shared dashboard
      const calls = mockSaveDashboard.mock.calls;
      const sharedSave = calls.find(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (call) => call[0].name === 'Shared Board (Copy)'
      );
      expect(sharedSave).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-non-null-assertion
      expect(sharedSave![0].id).not.toBe('original-id');
    });

    // Verify URL cleanup
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/');
  });
});
