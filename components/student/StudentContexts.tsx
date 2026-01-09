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
  isAdmin: false,
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
//
// Widget Compatibility:
// - READ-ONLY COMPATIBLE: Clock, Timer, Stopwatch, Text, Embed, QR, Weather,
//   Schedule, Calendar, Drawing (display only), Poll (display only)
// - LIMITED SUPPORT: Traffic Light, Dice, Random (state changes won't persist)
// - NOT COMPATIBLE: Checklist, Scoreboard, WorkSymbols, LunchCount, Classes
//   (require user interaction and state updates)
const mockDashboard: DashboardContextType = {
  dashboards: [],
  activeDashboard: null,
  toasts: [],
  visibleTools: [],
  loading: false,
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
    // No-op
  },
  renameDashboard: () => {
    // No-op
  },
  loadDashboard: () => {
    // No-op
  },
  addWidget: () => {
    // No-op
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
  addRoster: async () => Promise.resolve(''),
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
