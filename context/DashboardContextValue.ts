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

export interface DashboardContextValue {
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
  addWidget: (type: WidgetType, initialData?: Partial<WidgetData>) => void;
  removeWidget: (id: string) => void;
  duplicateWidget: (id: string) => void;
  removeWidgets: (ids: string[]) => void;
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
  bringToFront: (id: string) => void;
  moveWidgetLayer: (id: string, direction: 'up' | 'down') => void;
  setBackground: (bg: string) => void;
  setGlobalStyle: (style: Partial<GlobalStyle>) => void;
  toggleToolVisibility: (type: WidgetType) => void;
  setAllToolsVisibility: (visible: boolean) => void;
  reorderTools: (tools: WidgetType[]) => void;
  reorderDockItems: (items: DockItem[]) => void;
  updateDashboardSettings: (settings: Partial<Dashboard['settings']>) => void;
  clearAllStickers: () => void;
  // Roster system
  rosters: ClassRoster[];
  activeRosterId: string | null;
  addRoster: (name: string, students: Student[]) => Promise<string>;
  updateRoster: (id: string, updates: Partial<ClassRoster>) => Promise<void>;
  deleteRoster: (id: string) => Promise<void>;
  setActiveRoster: (id: string | null) => void;
  // Folder system
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
}

export const DashboardContext = createContext<
  DashboardContextValue | undefined
>(undefined);
