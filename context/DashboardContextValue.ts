import { createContext } from 'react';
import {
  Dashboard,
  WidgetData,
  WidgetType,
  Toast,
  ClassRoster,
  Student,
  GradeFilter,
  DockItem,
} from '../types';

export interface DashboardContextType {
  dashboards: Dashboard[];
  activeDashboard: Dashboard | null;
  toasts: Toast[];
  visibleTools: WidgetType[];
  dockItems: DockItem[];
  loading: boolean;
  gradeFilter: GradeFilter;
  setGradeFilter: (filter: GradeFilter) => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  createNewDashboard: (name: string, data?: Dashboard) => void;
  saveCurrentDashboard: () => void;
  deleteDashboard: (id: string) => void;
  duplicateDashboard: (id: string) => void;
  renameDashboard: (id: string, name: string) => void;
  loadDashboard: (id: string) => void;
  reorderDashboards: (ids: string[]) => void;
  setDefaultDashboard: (id: string) => void;
  addWidget: (type: WidgetType, initialConfig?: Partial<WidgetData>) => void;
  removeWidget: (id: string) => void;
  duplicateWidget: (id: string) => void;
  removeWidgets: (ids: string[]) => void;
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
  bringToFront: (id: string) => void;
  moveWidgetLayer: (id: string, direction: 'up' | 'down') => void;
  setBackground: (bg: string) => void;
  toggleToolVisibility: (type: WidgetType) => void;
  setAllToolsVisibility: (visible: boolean) => void;
  reorderTools: (tools: WidgetType[]) => void;
  reorderDockItems: (items: DockItem[]) => void;

  // --- FOLDER ACTIONS ---
  addFolder: (name: string) => void;
  createFolderWithItems: (name: string, items: WidgetType[]) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  addItemToFolder: (folderId: string, type: WidgetType) => void;
  removeItemFromFolder: (folderId: string, type: WidgetType) => void;
  moveItemOutOfFolder: (
    folderId: string,
    type: WidgetType,
    index: number
  ) => void;
  reorderFolderItems: (folderId: string, newItems: WidgetType[]) => void;

  // --- ROSTER SYSTEM ---
  rosters: ClassRoster[];
  activeRosterId: string | null;
  addRoster: (name: string, students: Student[]) => Promise<string>;
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
