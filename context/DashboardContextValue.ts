import { createContext } from 'react';
import {
  Dashboard,
  WidgetData,
  WidgetType,
  Toast,
  ClassRoster,
} from '../types';

export interface DashboardContextType {
  dashboards: Dashboard[];
  activeDashboard: Dashboard | null;
  toasts: Toast[];
  visibleTools: WidgetType[];
  loading: boolean;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  createNewDashboard: (name: string, data?: Dashboard) => void;
  saveCurrentDashboard: () => void;
  deleteDashboard: (id: string) => void;
  renameDashboard: (id: string, name: string) => void;
  loadDashboard: (id: string) => void;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  removeWidgets: (ids: string[]) => void;
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
  bringToFront: (id: string) => void;
  setBackground: (bg: string) => void;
  toggleToolVisibility: (type: WidgetType) => void;
  setAllToolsVisibility: (visible: boolean) => void;
  reorderTools: (tools: WidgetType[]) => void;

  // --- ROSTER SYSTEM ---
  rosters: ClassRoster[];
  activeRosterId: string | null;
  addRoster: (name: string) => Promise<string>;
  updateRoster: (
    rosterId: string,
    updates: Partial<ClassRoster>
  ) => Promise<void>;
  deleteRoster: (rosterId: string) => Promise<void>;
  setActiveRoster: (rosterId: string | null) => void;
}

export const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);
