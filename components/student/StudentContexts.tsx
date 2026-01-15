import React, { ReactNode } from 'react';
import { AuthContext, AuthContextType } from '../../context/AuthContextValue';
import {
  DashboardContext,
  DashboardContextType,
} from '../../context/DashboardContextValue';

interface StudentProviderProps {
  children: ReactNode;
}

// --- MOCK AUTH ---
const mockAuth: AuthContextType = {
  user: null,
  loading: false,
  isAdmin: null,
  featurePermissions: [],
  canAccessWidget: () => true, // Allow everything in student view
  signInWithGoogle: async () => {
    // No-op
  },
  signOut: async () => {
    // No-op
  },
};

// --- MOCK DASHBOARD ---
// NOTE: Widgets in student view are read-only. The mock dashboard context
// returns no-op functions for critical operations like updateWidget, which
// is called by widgets for state management. This means widgets that attempt
// to update their configuration will silently fail.
// See studentViewConfig.ts for widget compatibility details.
const mockDashboard: DashboardContextType = {
  dashboards: [],
  activeDashboard: null,
  toasts: [],
  visibleTools: [],
  loading: false,
  gradeFilter: 'all',
  setGradeFilter: () => {
    // No-op
  },
  addToast: () => {
    // No-op
  },
  removeToast: () => {
    // No-op
  },
  createNewDashboard: () => {
    // No-op
  },
  saveCurrentDashboard: () => {
    // No-op
  },
  deleteDashboard: () => {
    /* mock */
  },
  renameDashboard: () => {
    /* mock */
  },
  loadDashboard: () => {
    /* mock */
  },
  reorderDashboards: () => {
    /* mock */
  },
  setDefaultDashboard: () => {
    /* mock */
  },
  addWidget: () => {
    /* mock */
  },
  removeWidget: () => {
    // No-op
  },
  removeWidgets: () => {
    // No-op
  },
  updateWidget: () => {
    // No-op. Widgets in student view are read-only or handle state internally.
  },
  bringToFront: () => {
    // No-op
  },
  moveWidgetLayer: () => {
    // No-op
  },
  setBackground: () => {
    // No-op
  },
  toggleToolVisibility: () => {
    // No-op
  },
  setAllToolsVisibility: () => {
    // No-op
  },
  reorderTools: () => {
    // No-op
  },

  // Roster mocks
  rosters: [],
  activeRosterId: null,
  addRoster: () => {
    return Promise.reject(
      new Error('addRoster is not implemented in student view')
    );
  },
  updateRoster: async () => {
    // No-op
  },
  deleteRoster: async () => {
    // No-op
  },
  setActiveRoster: () => {
    // No-op
  },
};

export const StudentProvider: React.FC<StudentProviderProps> = ({
  children,
}) => {
  return (
    <AuthContext.Provider value={mockAuth}>
      <DashboardContext.Provider value={mockDashboard}>
        {children}
      </DashboardContext.Provider>
    </AuthContext.Provider>
  );
};
