import React, { useContext } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardProvider } from '../context/DashboardContext';
import { DashboardContext } from '../context/DashboardContextValue';
import { Dashboard, WidgetType } from '../types';

// --- Mocks ---

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

let dashboardsStore: Dashboard[] = [];
let subscriptionCallback: ((dashboards: Dashboard[], hasPendingWrites: boolean) => void) | null = null;

const mockSaveDashboard = vi.fn().mockImplementation(async (dashboard: Dashboard) => {
  const index = dashboardsStore.findIndex(d => d.id === dashboard.id);
  if (index >= 0) {
    dashboardsStore[index] = dashboard;
  } else {
    dashboardsStore.push(dashboard);
  }
  if (subscriptionCallback) {
    subscriptionCallback([...dashboardsStore], false);
  }
});

const mockSaveDashboards = vi.fn().mockImplementation(async (dashboards: Dashboard[]) => {
    dashboards.forEach(db => {
        const index = dashboardsStore.findIndex(d => d.id === db.id);
        if (index >= 0) {
            dashboardsStore[index] = db;
        } else {
            dashboardsStore.push(db);
        }
    });
    if (subscriptionCallback) {
        subscriptionCallback([...dashboardsStore], false);
    }
});

const mockDeleteDashboard = vi.fn().mockImplementation(async (id: string) => {
  dashboardsStore = dashboardsStore.filter(d => d.id !== id);
  if (subscriptionCallback) {
    subscriptionCallback([...dashboardsStore], false);
  }
});

const mockSubscribeToDashboards = vi.fn((cb) => {
  subscriptionCallback = cb;
  // Simulate initial load
  cb([...dashboardsStore], false);
  return () => {
    subscriptionCallback = null;
  };
});

vi.mock('../hooks/useFirestore', () => ({
  useFirestore: () => ({
    saveDashboard: mockSaveDashboard,
    saveDashboards: mockSaveDashboards,
    deleteDashboard: mockDeleteDashboard,
    subscribeToDashboards: mockSubscribeToDashboards,
    shareDashboard: vi.fn(),
    loadSharedDashboard: vi.fn(),
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

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

// --- Test Harness ---

const TestHarness = () => {
  const context = useContext(DashboardContext);

  if (!context) return <div>No Context</div>;

  return (
    <div>
      <div data-testid="dashboard-count">{context.dashboards.length}</div>
      <div data-testid="active-dashboard-id">{context.activeDashboard?.id || 'none'}</div>
      <div data-testid="active-dashboard-name">{context.activeDashboard?.name || 'none'}</div>

      <div data-testid="widget-list">
        {context.activeDashboard?.widgets.map(w => (
          <div key={w.id} data-testid={`widget-${w.type}`}>
            {w.id}
          </div>
        ))}
      </div>

      <div data-testid="dock-items">
         {context.dockItems.map((item, i) => (
             <div key={i} data-testid={`dock-item-${i}`}>
                 {item.type === 'folder' ? `Folder: ${item.folder.name}` : `Tool: ${item.toolType}`}
             </div>
         ))}
      </div>

      <button onClick={() => context.createNewDashboard('New Board')}>Create Board</button>
      <button onClick={() => context.activeDashboard && context.deleteDashboard(context.activeDashboard.id)}>Delete Board</button>
      <button onClick={() => context.activeDashboard && context.renameDashboard(context.activeDashboard.id, 'Renamed Board')}>Rename Board</button>

      <button onClick={() => context.addWidget('clock')}>Add Clock</button>
      <button onClick={() => context.clearAllWidgets()}>Clear Widgets</button>

      <button onClick={() => context.addFolder('My Folder')}>Add Folder</button>
    </div>
  );
};

// --- Tests ---

describe('DashboardContext Core Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    dashboardsStore = [];
    subscriptionCallback = null;
  });

  it('creates a new dashboard', async () => {
    const user = userEvent.setup();
    render(
      <DashboardProvider>
        <TestHarness />
      </DashboardProvider>
    );

    // Initial state (might be 1 if default created, or 0 if mocked empty)
    // The provider creates a default dashboard if list is empty.
    // Let's wait for the "My First Board" to be created if logic triggers

    // Actually, in the provider:
    // if (updatedDashboards.length === 0 && !migrated) -> creates default.
    // Our mockSubscribeToDashboards returns [], so it might create one.

    await waitFor(() => {
      // It might trigger saveDashboard for default board
      // But let's just click Create Board
    });

    await user.click(screen.getByText('Create Board'));

    await waitFor(() => {
      expect(mockSaveDashboard).toHaveBeenCalled();
    });

    const calls = mockSaveDashboard.mock.calls;
    const lastCall = calls[calls.length - 1][0] as Dashboard;
    expect(lastCall.name).toBe('New Board');
  });

  it('deletes a dashboard', async () => {
    // Setup: We need a dashboard to delete.
    // We can simulate an existing dashboard by modifying the mock or just creating one.

    // Let's rely on the internal state.
    // Since mockSubscribeToDashboards is called once, subsequent updates are local optimistically
    // unless we update the mock to return new data.
    // The context logic: setDashboards update locally first.

    const user = userEvent.setup();
    render(
      <DashboardProvider>
        <TestHarness />
      </DashboardProvider>
    );

    // Create one first
    await user.click(screen.getByText('Create Board'));

    await waitFor(() => {
        expect(screen.getByTestId('active-dashboard-name')).toHaveTextContent('New Board');
    });

    // Delete it
    await user.click(screen.getByText('Delete Board'));

    await waitFor(() => {
        expect(mockDeleteDashboard).toHaveBeenCalled();
    });
  });

  it('renames a dashboard', async () => {
    const user = userEvent.setup();
    render(
      <DashboardProvider>
        <TestHarness />
      </DashboardProvider>
    );

    await user.click(screen.getByText('Create Board'));
    await waitFor(() => expect(screen.getByTestId('active-dashboard-name')).toHaveTextContent('New Board'));

    await user.click(screen.getByText('Rename Board'));

    await waitFor(() => {
       expect(screen.getByTestId('active-dashboard-name')).toHaveTextContent('Renamed Board');
       expect(mockSaveDashboard).toHaveBeenCalled();
       // Check that the last call had the new name
       const calls = mockSaveDashboard.mock.calls;
       const lastCall = calls[calls.length - 1][0] as Dashboard;
       expect(lastCall.name).toBe('Renamed Board');
    });
  });

  it('adds a widget', async () => {
     const user = userEvent.setup();
     render(
       <DashboardProvider>
         <TestHarness />
       </DashboardProvider>
     );

     await user.click(screen.getByText('Create Board'));
     await waitFor(() => expect(screen.getByTestId('active-dashboard-name')).toHaveTextContent('New Board'));

     await user.click(screen.getByText('Add Clock'));

     await waitFor(() => {
         expect(screen.getByTestId('widget-clock')).toBeInTheDocument();
     });

     // Widget addition triggers auto-save (debounced)
     // We can wait or just trust local state for now.
  });

  it('clears all widgets', async () => {
      const user = userEvent.setup();
      render(
        <DashboardProvider>
          <TestHarness />
        </DashboardProvider>
      );

      await user.click(screen.getByText('Create Board'));
      await user.click(screen.getByText('Add Clock'));
      await waitFor(() => expect(screen.getByTestId('widget-clock')).toBeInTheDocument());

      await user.click(screen.getByText('Clear Widgets'));

      await waitFor(() => {
          expect(screen.queryByTestId('widget-clock')).not.toBeInTheDocument();
      });
  });

  it('adds a folder to dock', async () => {
      const user = userEvent.setup();
      render(
        <DashboardProvider>
          <TestHarness />
        </DashboardProvider>
      );

      await user.click(screen.getByText('Add Folder'));

      await waitFor(() => {
          expect(screen.getByText('Folder: My Folder')).toBeInTheDocument();
      });
  });

});
