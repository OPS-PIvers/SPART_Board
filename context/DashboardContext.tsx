import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import {
  Dashboard,
  WidgetData,
  WidgetType,
  WidgetConfig,
  Toast,
  ClassRoster,
  Student,
  GradeFilter,
  DockItem,
  DockFolder,
  GlobalStyle,
  DEFAULT_GLOBAL_STYLE,
} from '../types';
import { useAuth } from './useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { db, isAuthBypass } from '../config/firebase';
import { TOOLS } from '../config/tools';
import { WIDGET_DEFAULTS } from '../config/widgetDefaults';
import {
  migrateLocalStorageToFirestore,
  migrateWidget,
} from '../utils/migration';
import { DashboardContext } from './DashboardContextValue';

/**
 * Singleton pattern for mock roster storage in bypass mode.
 * This ensures rosters created in bypass mode are properly stored and
 * accessible in the UI, following the same pattern as mockDashboards.
 */
class MockRosterStore {
  private static instance: MockRosterStore;
  private rosters: ClassRoster[] = [];
  private listeners = new Set<(rosters: ClassRoster[]) => void>();

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): MockRosterStore {
    if (!MockRosterStore.instance) {
      MockRosterStore.instance = new MockRosterStore();
    }
    return MockRosterStore.instance;
  }

  getRosters(): ClassRoster[] {
    return [...this.rosters].sort((a, b) => a.name.localeCompare(b.name));
  }

  addRoster(id: string, name: string, students: Student[]): void {
    const newRoster: ClassRoster = {
      id,
      name,
      students,
      createdAt: Date.now(),
    };
    this.rosters.push(newRoster);
    this.notifyListeners();
  }

  updateRoster(id: string, updates: Partial<ClassRoster>): void {
    const index = this.rosters.findIndex((r) => r.id === id);
    if (index >= 0) {
      this.rosters[index] = { ...this.rosters[index], ...updates };
      this.notifyListeners();
    }
  }

  deleteRoster(id: string): void {
    const index = this.rosters.findIndex((r) => r.id === id);
    if (index >= 0) {
      this.rosters.splice(index, 1);
      this.notifyListeners();
    }
  }

  addListener(callback: (rosters: ClassRoster[]) => void): void {
    this.listeners.add(callback);
  }

  removeListener(callback: (rosters: ClassRoster[]) => void): void {
    this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const sorted = this.getRosters();
    this.listeners.forEach((callback) => callback(sorted));
  }

  /**
   * Reset the store - useful for testing and clearing state.
   */
  reset(): void {
    this.rosters = [];
    this.listeners.clear();
  }
}

const mockRosterStore = MockRosterStore.getInstance();

// Helper to validate roster data from Firestore

const validateRoster = (id: string, data: unknown): ClassRoster | null => {
  if (!data || typeof data !== 'object') return null;

  const d = data as Record<string, unknown>;

  if (typeof d.name !== 'string') return null;

  const rawStudents = d.students;

  const students: Student[] = Array.isArray(rawStudents)
    ? rawStudents

        .map((s: unknown) => {
          if (!s || typeof s !== 'object') return null;

          const student = s as Record<string, unknown>;

          if (
            typeof student.id === 'string' &&
            typeof student.firstName === 'string' &&
            typeof student.lastName === 'string'
          ) {
            return {
              id: student.id,

              firstName: student.firstName,

              lastName: student.lastName,
            };
          }

          return null;
        })

        .filter((s): s is Student => s !== null)
    : [];

  return {
    id,

    name: d.name,

    students,

    createdAt: typeof d.createdAt === 'number' ? d.createdAt : Date.now(),
  };
};

// Helper to migrate legacy visibleTools to dockItems
const migrateToDockItems = (visibleTools: WidgetType[]): DockItem[] => {
  return visibleTools.map((type) => ({ type: 'tool', toolType: type }));
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const {
    saveDashboard,
    saveDashboards,
    deleteDashboard: deleteDashboardFirestore,
    subscribeToDashboards,
    shareDashboard,
    loadSharedDashboard,
  } = useFirestore(user?.uid ?? null);

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [pendingShareId, setPendingShareId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    if (path.startsWith('/share/')) {
      return path.split('/share/')[1] || null;
    }
    return null;
  });

  const clearPendingShare = useCallback(() => {
    setPendingShareId(null);
    window.history.replaceState(null, '', '/');
  }, []);

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef(activeId);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [visibleTools, setVisibleTools] = useState<WidgetType[]>(() => {
    const saved = localStorage.getItem('classroom_visible_tools');
    if (saved) {
      try {
        return JSON.parse(saved) as WidgetType[];
      } catch (e) {
        console.error('Failed to parse saved tools', e);
      }
    }
    return TOOLS.map((t) => t.type);
  });

  const [dockItems, setDockItems] = useState<DockItem[]>(() => {
    const saved = localStorage.getItem('classroom_dock_items');
    if (saved) {
      try {
        return JSON.parse(saved) as DockItem[];
      } catch (e) {
        console.error('Failed to parse saved dock items', e);
      }
    }
    // Fallback: migrate from visibleTools if available
    const savedTools = localStorage.getItem('classroom_visible_tools');
    if (savedTools) {
      try {
        const tools = JSON.parse(savedTools) as WidgetType[];
        return migrateToDockItems(tools);
      } catch (e) {
        console.error('Failed to migrate tools to dock items', e);
      }
    }
    return migrateToDockItems(TOOLS.map((t) => t.type));
  });

  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(false);

  const [gradeFilter, setGradeFilter] = useState<GradeFilter>(() => {
    const saved = localStorage.getItem('spartboard_gradeFilter');
    const validFilters: GradeFilter[] = ['all', 'k-2', '3-5', '6-8', '9-12'];
    return saved && validFilters.includes(saved as GradeFilter)
      ? (saved as GradeFilter)
      : 'all';
  });

  const handleSetGradeFilter = useCallback((filter: GradeFilter) => {
    setGradeFilter(filter);
    localStorage.setItem('spartboard_gradeFilter', filter);
  }, []);

  // --- ROSTER STATE ---
  const [rosters, setRosters] = useState<ClassRoster[]>([]);
  const [activeRosterId, setActiveRosterIdState] = useState<string | null>(
    () => {
      return localStorage.getItem('spart_active_roster_id');
    }
  );

  // Refs to prevent race conditions
  const lastLocalUpdateAt = useRef<number>(0);

  // Sync activeId to ref
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Load dashboards on mount and subscribe to changes
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setLoading(true), 0);

    // Real-time subscription to Firestore
    const unsubscribe = subscribeToDashboards((updatedDashboards) => {
      // Sort dashboards: default first, then by order, then by createdAt
      const sortedDashboards = [...updatedDashboards].sort((a, b) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      const migratedDashboards = sortedDashboards.map((db) => ({
        ...db,
        widgets: db.widgets.map(migrateWidget),
      }));

      setDashboards((prev) => {
        // If we have very recent local changes, keep our local version of the active dashboard
        const now = Date.now();
        if (now - lastLocalUpdateAt.current < 3000) {
          return migratedDashboards.map((db) => {
            if (db.id === activeIdRef.current) {
              const currentActive = prev.find(
                (p) => p.id === activeIdRef.current
              );
              return currentActive ?? db;
            }
            return db;
          });
        }
        return migratedDashboards;
      });

      if (migratedDashboards.length > 0 && !activeIdRef.current) {
        // Try to load default dashboard first
        const defaultDb = migratedDashboards.find((d) => d.isDefault);
        setActiveId(defaultDb ? defaultDb.id : migratedDashboards[0].id);
      }

      // Create default dashboard if none exist
      if (updatedDashboards.length === 0 && !migrated) {
        const defaultDb: Dashboard = {
          id: crypto.randomUUID(),
          name: 'My First Board',
          background: 'bg-slate-900',
          widgets: [],
          createdAt: Date.now(),
        };
        void saveDashboard(defaultDb).then(() => {
          setToasts((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              message: 'Welcome! Board created',
              type: 'info' as const,
            },
          ]);
        });
      }

      setLoading(false);
    });

    // Migrate localStorage data on first sign-in
    const localData = localStorage.getItem('classroom_dashboards');
    if (localData && !migrated) {
      migrateLocalStorageToFirestore(user.uid, saveDashboard)
        .then((count) => {
          if (count > 0) {
            setToasts((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                message: `Migrated ${count} dashboard(s) to cloud`,
                type: 'success' as const,
              },
            ]);
          }
          setMigrated(true);
        })
        .catch((err) => {
          console.error('Migration error:', err);
          setToasts((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              message: 'Failed to migrate local data',
              type: 'error' as const,
            },
          ]);
        });
    }

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [user, subscribeToDashboards, migrated, saveDashboard]);

  // --- NEW ROSTER EFFECT ---
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => setRosters([]), 0);
      return () => clearTimeout(timer);
    }

    if (isAuthBypass) {
      // Use mock roster store in bypass mode
      const callback = (rosters: ClassRoster[]) => {
        setRosters(rosters);
      };
      mockRosterStore.addListener(callback);
      // Initial callback with current state
      callback(mockRosterStore.getRosters());
      return () => {
        mockRosterStore.removeListener(callback);
      };
    }

    const rostersRef = collection(db, 'users', user.uid, 'rosters');
    const q = query(rostersRef, orderBy('name'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: ClassRoster[] = [];
        snapshot.forEach((doc) => {
          const validated = validateRoster(doc.id, doc.data());
          if (validated) loaded.push(validated);
        });
        setRosters(loaded);
      },
      (error) => {
        console.error('Roster subscription error:', error);
        // Fallback if index isn't created yet: try without orderBy
        if (error.code === 'failed-precondition') {
          onSnapshot(rostersRef, (innerSnapshot) => {
            const innerLoaded: ClassRoster[] = [];
            innerSnapshot.forEach((doc) => {
              const validated = validateRoster(doc.id, doc.data());
              if (validated) innerLoaded.push(validated);
            });
            innerLoaded.sort((a, b) => a.name.localeCompare(b.name));
            setRosters(innerLoaded);
          });
        }
      }
    );
    return () => unsubscribe();
  }, [user]);

  // --- ROSTER ACTIONS ---
  const addRoster = useCallback(
    async (name: string, students: Student[] = []) => {
      if (!user) throw new Error('No user');

      if (isAuthBypass) {
        const id = 'mock-roster-id-' + Date.now();
        mockRosterStore.addRoster(id, name, students);
        return id;
      }

      const newRoster = { name, students, createdAt: Date.now() };
      const ref = await addDoc(
        collection(db, 'users', user.uid, 'rosters'),
        newRoster
      );
      return ref.id;
    },
    [user]
  );

  const updateRoster = useCallback(
    async (id: string, updates: Partial<ClassRoster>) => {
      if (!user) return;

      if (isAuthBypass) {
        mockRosterStore.updateRoster(id, updates);
        return;
      }

      await updateDoc(doc(db, 'users', user.uid, 'rosters', id), updates);
    },
    [user]
  );

  const setActiveRoster = useCallback((id: string | null) => {
    setActiveRosterIdState(id);
    if (id) localStorage.setItem('spart_active_roster_id', id);
    else localStorage.removeItem('spart_active_roster_id');
  }, []);

  const deleteRoster = useCallback(
    async (id: string) => {
      if (!user) return;

      if (isAuthBypass) {
        mockRosterStore.deleteRoster(id);
        if (activeRosterId === id) setActiveRoster(null);
        return;
      }

      await deleteDoc(doc(db, 'users', user.uid, 'rosters', id));
      if (activeRosterId === id) setActiveRoster(null);
    },
    [user, activeRosterId, setActiveRoster]
  );

  // Auto-save to Firestore with debouncing
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<string>('');

  useEffect(() => {
    if (!user || loading || !activeId) return;

    const active = dashboards.find((d) => d.id === activeId);
    if (!active) return;

    const currentData =
      JSON.stringify(active.widgets) + active.background + active.name;

    // Always clear any pending timer, even if data hasn't changed
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    if (currentData === lastSavedDataRef.current) return;

    saveTimerRef.current = setTimeout(() => {
      lastSavedDataRef.current = currentData;
      saveDashboard(active).catch((err) => {
        console.error('Auto-save failed:', err);
        setToasts((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            message: 'Failed to sync changes',
            type: 'error' as const,
          },
        ]);
      });
    }, 500); // 500ms debounce to balance responsiveness and write frequency

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [dashboards, activeId, user, loading, saveDashboard]);

  const toggleToolVisibility = useCallback(
    (type: WidgetType) => {
      setVisibleTools((prev) => {
        const next = prev.includes(type)
          ? prev.filter((t) => t !== type)
          : [...prev, type];
        localStorage.setItem('classroom_visible_tools', JSON.stringify(next));
        return next;
      });

      setDockItems((prev) => {
        const isVisible = visibleTools.includes(type);
        let next: DockItem[];

        if (isVisible) {
          // Remove from dockItems (search globally in tools and folders)
          next = prev
            .map((item) => {
              if (item.type === 'folder') {
                return {
                  ...item,
                  folder: {
                    ...item.folder,
                    items: item.folder.items.filter((t) => t !== type),
                  },
                };
              }
              return item;
            })
            .filter(
              (item) => !(item.type === 'tool' && item.toolType === type)
            );
        } else {
          // Add to dockItems (if not already present)
          const exists = prev.some(
            (item) =>
              (item.type === 'tool' && item.toolType === type) ||
              (item.type === 'folder' && item.folder.items.includes(type))
          );
          next = exists ? prev : [...prev, { type: 'tool', toolType: type }];
        }

        localStorage.setItem('classroom_dock_items', JSON.stringify(next));
        return next;
      });
    },
    [visibleTools]
  );

  const setAllToolsVisibility = useCallback((visible: boolean) => {
    const nextTools = visible ? TOOLS.map((t) => t.type) : [];
    setVisibleTools(nextTools);
    localStorage.setItem('classroom_visible_tools', JSON.stringify(nextTools));

    const nextDock = visible ? migrateToDockItems(nextTools) : [];
    setDockItems(nextDock);
    localStorage.setItem('classroom_dock_items', JSON.stringify(nextDock));
  }, []);

  const reorderTools = useCallback((tools: WidgetType[]) => {
    setVisibleTools(tools);
    localStorage.setItem('classroom_visible_tools', JSON.stringify(tools));
  }, []);

  const reorderDockItems = useCallback((items: DockItem[]) => {
    setDockItems(items);
    localStorage.setItem('classroom_dock_items', JSON.stringify(items));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: Toast['type'] = 'info') => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        removeToast(id);
      }, 3000);
    },
    [removeToast]
  );

  // --- FOLDER ACTIONS ---
  const addFolder = useCallback(
    (name: string) => {
      const newFolder: DockFolder = {
        id: crypto.randomUUID(),
        name,
        items: [],
      };
      setDockItems((prev) => {
        const next = [...prev, { type: 'folder' as const, folder: newFolder }];
        localStorage.setItem('classroom_dock_items', JSON.stringify(next));
        return next;
      });
      addToast(`Folder "${name}" created`);
    },
    [addToast]
  );

  const createFolderWithItems = useCallback(
    (name: string, items: WidgetType[]) => {
      setDockItems((prev) => {
        // 1. Remove items from their current locations
        let currentItems = [...prev];
        items.forEach((type) => {
          currentItems = currentItems
            .map((item) => {
              if (item.type === 'folder') {
                return {
                  ...item,
                  folder: {
                    ...item.folder,
                    items: item.folder.items.filter((t) => t !== type),
                  },
                };
              }
              return item;
            })
            .filter(
              (item) => !(item.type === 'tool' && item.toolType === type)
            );
        });

        // 2. Create new folder with items
        const newFolder: DockFolder = {
          id: crypto.randomUUID(),
          name,
          items,
        };

        // 3. Add to dock
        const next = [
          ...currentItems,
          { type: 'folder' as const, folder: newFolder },
        ];
        localStorage.setItem('classroom_dock_items', JSON.stringify(next));
        return next;
      });
      addToast('Group created');
    },
    [addToast]
  );

  const renameFolder = useCallback((id: string, name: string) => {
    setDockItems((prev) => {
      const next = prev.map((item) =>
        item.type === 'folder' && item.folder.id === id
          ? { ...item, folder: { ...item.folder, name } }
          : item
      );
      localStorage.setItem('classroom_dock_items', JSON.stringify(next));
      return next;
    });
  }, []);

  const deleteFolder = useCallback(
    (id: string) => {
      setDockItems((prev) => {
        const folder = prev.find(
          (item) => item.type === 'folder' && item.folder.id === id
        );
        if (!folder || folder.type !== 'folder') return prev;

        // Move items back to root dock
        const folderItems: DockItem[] = folder.folder.items.map((type) => ({
          type: 'tool',
          toolType: type,
        }));

        const next = prev
          .filter((item) => !(item.type === 'folder' && item.folder.id === id))
          .concat(folderItems);

        localStorage.setItem('classroom_dock_items', JSON.stringify(next));
        return next;
      });
      addToast('Folder removed');
    },
    [addToast]
  );

  const addItemToFolder = useCallback((folderId: string, type: WidgetType) => {
    setDockItems((prev) => {
      // 1. Remove the tool from wherever it was (top-level or another folder)
      const cleaned = prev
        .map((item) => {
          if (item.type === 'folder') {
            return {
              ...item,
              folder: {
                ...item.folder,
                items: item.folder.items.filter((t) => t !== type),
              },
            };
          }
          return item;
        })
        .filter((item) => !(item.type === 'tool' && item.toolType === type));

      // 2. Add it to the target folder
      const next = cleaned.map((item) =>
        item.type === 'folder' && item.folder.id === folderId
          ? {
              ...item,
              folder: {
                ...item.folder,
                items: [...item.folder.items, type],
              },
            }
          : item
      );

      localStorage.setItem('classroom_dock_items', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeItemFromFolder = useCallback(
    (folderId: string, type: WidgetType) => {
      setDockItems((prev) => {
        const next = prev.map((item) =>
          item.type === 'folder' && item.folder.id === folderId
            ? {
                ...item,
                folder: {
                  ...item.folder,
                  items: item.folder.items.filter((t) => t !== type),
                },
              }
            : item
        );
        localStorage.setItem('classroom_dock_items', JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const moveItemOutOfFolder = useCallback(
    (folderId: string, type: WidgetType, index: number) => {
      setDockItems((prev) => {
        // Remove from folder
        const cleaned = prev.map((item) =>
          item.type === 'folder' && item.folder.id === folderId
            ? {
                ...item,
                folder: {
                  ...item.folder,
                  items: item.folder.items.filter((t) => t !== type),
                },
              }
            : item
        );

        // Insert at root level at specified index
        const next = [...cleaned];
        next.splice(index, 0, { type: 'tool', toolType: type });

        localStorage.setItem('classroom_dock_items', JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const reorderFolderItems = useCallback(
    (folderId: string, newItems: WidgetType[]) => {
      setDockItems((prev) => {
        const next = prev.map((item) =>
          item.type === 'folder' && item.folder.id === folderId
            ? {
                ...item,
                folder: {
                  ...item.folder,
                  items: newItems,
                },
              }
            : item
        );
        localStorage.setItem('classroom_dock_items', JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const createNewDashboard = useCallback(
    (name: string, data?: Dashboard) => {
      if (!user) {
        addToast('Must be signed in to create dashboard', 'error');
        return;
      }

      const maxOrder = dashboards.reduce(
        (max, db) => Math.max(max, db.order ?? 0),
        0
      );

      const newDb: Dashboard = data
        ? { ...data, id: crypto.randomUUID(), name, order: maxOrder + 1 }
        : {
            id: crypto.randomUUID(),
            name,
            background: 'bg-slate-800',
            widgets: [],
            createdAt: Date.now(),
            order: maxOrder + 1,
          };

      saveDashboard(newDb)
        .then(() => {
          setActiveId(newDb.id);
          addToast(`Dashboard "${name}" ready`);
        })
        .catch((err) => {
          console.error('Failed to create dashboard:', err);
          addToast('Failed to create dashboard', 'error');
        });
    },
    [user, dashboards, saveDashboard, addToast]
  );

  const saveCurrentDashboard = useCallback(() => {
    if (!user) {
      addToast('Must be signed in to save', 'error');
      return;
    }

    const active = dashboards.find((d) => d.id === activeId);
    if (active) {
      saveDashboard(active)
        .then(() => {
          addToast('All changes saved to cloud', 'success');
        })
        .catch((err) => {
          console.error('Save failed:', err);
          addToast('Save failed', 'error');
        });
    }
  }, [user, dashboards, activeId, saveDashboard, addToast]);

  const deleteDashboard = useCallback(
    (id: string) => {
      if (!user) {
        addToast('Must be signed in to delete', 'error');
        return;
      }

      deleteDashboardFirestore(id)
        .then(() => {
          if (activeId === id) {
            const filtered = dashboards.filter((d) => d.id !== id);
            setActiveId(filtered.length > 0 ? filtered[0].id : null);
          }
          addToast('Dashboard removed');
        })
        .catch((err) => {
          console.error('Delete failed:', err);
          addToast('Delete failed', 'error');
        });
    },
    [user, activeId, dashboards, deleteDashboardFirestore, addToast]
  );

  const duplicateDashboard = useCallback(
    (id: string) => {
      if (!user) {
        addToast('Must be signed in to duplicate', 'error');
        return;
      }

      const dashboard = dashboards.find((d) => d.id === id);
      if (!dashboard) return;

      const maxOrder = dashboards.reduce(
        (max, db) => Math.max(max, db.order ?? 0),
        0
      );

      const duplicated: Dashboard = {
        ...dashboard,
        id: crypto.randomUUID(),
        name: `${dashboard.name} (Copy)`,
        isDefault: false,
        createdAt: Date.now(),
        order: maxOrder + 1,
      };

      saveDashboard(duplicated)
        .then(() => {
          addToast(`Board "${dashboard.name}" duplicated`);
        })
        .catch((err) => {
          console.error('Duplicate failed:', err);
          addToast('Duplicate failed', 'error');
        });
    },
    [user, dashboards, saveDashboard, addToast]
  );

  const renameDashboard = useCallback(
    (id: string, name: string) => {
      if (!user) {
        addToast('Must be signed in to rename', 'error');
        return;
      }

      const dashboard = dashboards.find((d) => d.id === id);
      if (!dashboard) return;

      const updated = { ...dashboard, name };

      // Update local state immediately
      setDashboards((prev) => prev.map((d) => (d.id === id ? updated : d)));

      if (activeId === id) {
        lastLocalUpdateAt.current = Date.now();
      }

      saveDashboard(updated)
        .then(() => {
          addToast('Dashboard renamed');
        })
        .catch((err) => {
          console.error('Rename failed:', err);
          addToast('Rename failed', 'error');
          // Revert
          setDashboards((prev) =>
            prev.map((d) => (d.id === id ? dashboard : d))
          );
        });
    },
    [user, dashboards, activeId, saveDashboard, addToast]
  );

  const reorderDashboards = useCallback(
    (ids: string[]) => {
      if (!user) return;

      const updatedDashboards: Dashboard[] = [];
      ids.forEach((id, index) => {
        const db = dashboards.find((d) => d.id === id);
        if (db) {
          updatedDashboards.push({ ...db, order: index });
        }
      });

      // Update local state
      setDashboards((prev) => {
        const next = [...prev];
        updatedDashboards.forEach((updated) => {
          const index = next.findIndex((d) => d.id === updated.id);
          if (index >= 0) next[index] = updated;
        });
        return next.sort((a, b) => {
          const orderA = a.order ?? 0;
          const orderB = b.order ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
      });

      // Save to Firestore
      void saveDashboards(updatedDashboards).catch((err) => {
        console.error('Failed to save reordered dashboards:', err);
      });
    },
    [user, dashboards, saveDashboards]
  );

  const setDefaultDashboard = useCallback(
    (id: string) => {
      if (!user) return;

      const updatedDashboards = dashboards.map((db) => ({
        ...db,
        isDefault: db.id === id,
      }));

      // Update local state
      setDashboards(
        [...updatedDashboards].sort((a, b) => {
          const orderA = a.order ?? 0;
          const orderB = b.order ?? 0;
          if (orderA !== orderB) return orderA - orderB;
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return (b.createdAt || 0) - (a.createdAt || 0);
        })
      );

      // Save to Firestore
      void saveDashboards(updatedDashboards).catch((err) => {
        console.error('Failed to save default dashboard status:', err);
      });

      addToast('Default board updated');
    },
    [user, dashboards, saveDashboards, addToast]
  );

  const loadDashboard = useCallback(
    (id: string) => {
      setActiveId(id);
      addToast('Board loaded');
    },
    [addToast]
  );

  const activeDashboard = dashboards.find((d) => d.id === activeId) ?? null;

  const addWidget = useCallback(
    (type: WidgetType, initialData?: Partial<WidgetData>) => {
      if (!activeId) return;
      lastLocalUpdateAt.current = Date.now();

      setDashboards((prev) =>
        prev.map((d) => {
          if (d.id !== activeId) return d;
          const maxZ = d.widgets.reduce((max, w) => Math.max(max, w.z), 0);

          const defaultPosition = {
            x: 150 + d.widgets.length * 20,
            y: 150 + d.widgets.length * 20,
          };

          const defaults = WIDGET_DEFAULTS[type] || {};

          const newWidget: WidgetData = {
            id: crypto.randomUUID(),
            type,
            x: initialData?.x ?? defaultPosition.x,
            y: initialData?.y ?? defaultPosition.y,
            w: initialData?.w ?? defaults.w ?? 200,
            h: initialData?.h ?? defaults.h ?? 200,
            flipped: false,
            z: maxZ + 1,
            ...defaults,
            ...initialData,
            config: {
              ...(defaults.config ?? {}),
              ...(initialData?.config ?? {}),
            },
          } as WidgetData;
          return { ...d, widgets: [...d.widgets, newWidget] };
        })
      );
    },
    [activeId]
  );

  const addWidgets = useCallback(
    (widgets: { type: WidgetType; config?: Partial<WidgetConfig> }[]) => {
      if (!activeId) return;
      lastLocalUpdateAt.current = Date.now();

      setDashboards((prev) =>
        prev.map((d) => {
          if (d.id !== activeId) return d;

          let maxZ = d.widgets.reduce((max, w) => Math.max(max, w.z), 0);

          const newWidgets: WidgetData[] = widgets.map((item, i) => {
            const defaults = WIDGET_DEFAULTS[item.type] || {};
            // Grid Layout Logic
            const col = i % 3;
            const row = Math.floor(i / 3);

            // Base position with simple grid
            const x = 50 + col * 350;
            const y = 80 + row * 300;

            maxZ++;

            return {
              id: crypto.randomUUID(),
              type: item.type,
              x,
              y,
              w: defaults.w ?? 300,
              h: defaults.h ?? 250,
              flipped: false,
              z: maxZ,
              ...defaults,
              config: {
                ...(defaults.config ?? {}),
                ...(item.config ?? {}),
              },
            } as WidgetData;
          });

          return { ...d, widgets: [...d.widgets, ...newWidgets] };
        })
      );
    },
    [activeId]
  );

  const removeWidget = useCallback(
    (id: string) => {
      if (!activeId) return;
      lastLocalUpdateAt.current = Date.now();
      setDashboards((prev) =>
        prev.map((d) =>
          d.id === activeId
            ? { ...d, widgets: d.widgets.filter((w) => w.id !== id) }
            : d
        )
      );
    },
    [activeId]
  );

  const duplicateWidget = useCallback(
    (id: string) => {
      if (!activeId) return;
      lastLocalUpdateAt.current = Date.now();
      setDashboards((prev) =>
        prev.map((d) => {
          if (d.id !== activeId) return d;
          const target = d.widgets.find((w) => w.id === id);
          if (!target) return d;

          const maxZ = d.widgets.reduce((max, w) => Math.max(max, w.z), 0);
          const duplicated: WidgetData = {
            ...target,
            id: crypto.randomUUID(),
            x: target.x + 20,
            y: target.y + 20,
            z: maxZ + 1,
            config: JSON.parse(JSON.stringify(target.config)) as WidgetConfig,
          };
          return { ...d, widgets: [...d.widgets, duplicated] };
        })
      );
    },
    [activeId]
  );

  const removeWidgets = useCallback(
    (ids: string[]) => {
      if (!activeId) return;
      lastLocalUpdateAt.current = Date.now();
      setDashboards((prev) =>
        prev.map((d) =>
          d.id === activeId
            ? { ...d, widgets: d.widgets.filter((w) => !ids.includes(w.id)) }
            : d
        )
      );
    },
    [activeId]
  );

  const clearAllStickers = useCallback(() => {
    if (!activeDashboard) return;
    const stickerWidgetIds = activeDashboard.widgets
      .filter((w) => w.type === 'sticker')
      .map((w) => w.id);
    if (stickerWidgetIds.length > 0) {
      removeWidgets(stickerWidgetIds);
    }
  }, [activeDashboard, removeWidgets]);

  const clearAllWidgets = useCallback(() => {
    if (!activeId) return;
    lastLocalUpdateAt.current = Date.now();
    setDashboards((prev) =>
      prev.map((d) => (d.id === activeId ? { ...d, widgets: [] } : d))
    );
    addToast('All windows cleared');
  }, [activeId, addToast]);

  const updateWidget = useCallback(
    (id: string, updates: Partial<WidgetData>) => {
      if (!activeIdRef.current) return;
      lastLocalUpdateAt.current = Date.now();
      setDashboards((prev) =>
        prev.map((d) => {
          if (d.id !== activeIdRef.current) return d;
          return {
            ...d,
            widgets: d.widgets.map((w) =>
              w.id === id
                ? {
                    ...w,
                    ...updates,
                    config: updates.config
                      ? { ...w.config, ...updates.config }
                      : w.config,
                  }
                : w
            ),
          };
        })
      );
    },
    []
  );

  const bringToFront = useCallback((id: string) => {
    if (!activeIdRef.current) return;

    setDashboards((prev) => {
      const active = prev.find((d) => d.id === activeIdRef.current);
      if (!active) return prev;

      const maxZ = active.widgets.reduce((max, w) => Math.max(max, w.z), 0);
      const target = active.widgets.find((w) => w.id === id);

      if (target && target.z < maxZ) {
        lastLocalUpdateAt.current = Date.now();
        return prev.map((d) => {
          if (d.id !== activeIdRef.current) return d;
          return {
            ...d,
            widgets: d.widgets.map((w) =>
              w.id === id ? { ...w, z: maxZ + 1 } : w
            ),
          };
        });
      }
      return prev;
    });
  }, []);

  const moveWidgetLayer = useCallback(
    (id: string, direction: 'up' | 'down') => {
      if (!activeIdRef.current) return;

      setDashboards((prev) => {
        const active = prev.find((d) => d.id === activeIdRef.current);
        if (!active) return prev;

        // Deep copy widgets to avoid mutation and prepare for sort/modify
        const widgets = active.widgets.map((w) => ({ ...w }));

        // Sort by Z
        widgets.sort((a, b) => a.z - b.z);

        // Normalize Zs to ensure contiguous 0..N-1
        widgets.forEach((w, i) => {
          w.z = i;
        });

        const idx = widgets.findIndex((w) => w.id === id);
        if (idx === -1) return prev;

        if (direction === 'up') {
          if (idx < widgets.length - 1) {
            // Swap with next
            widgets[idx].z = idx + 1;
            widgets[idx + 1].z = idx;
            lastLocalUpdateAt.current = Date.now();
          } else {
            return prev;
          }
        } else {
          // down
          if (idx > 0) {
            // Swap with prev
            widgets[idx].z = idx - 1;
            widgets[idx - 1].z = idx;
            lastLocalUpdateAt.current = Date.now();
          } else {
            return prev;
          }
        }

        return prev.map((d) =>
          d.id === activeIdRef.current ? { ...d, widgets } : d
        );
      });
    },
    []
  );

  const setBackground = useCallback((bg: string) => {
    if (!activeIdRef.current) return;
    lastLocalUpdateAt.current = Date.now();
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeIdRef.current ? { ...d, background: bg } : d
      )
    );
  }, []);

  const updateDashboardSettings = useCallback(
    (updates: Partial<Dashboard['settings']>) => {
      if (!activeIdRef.current) return;
      lastLocalUpdateAt.current = Date.now();
      setDashboards((prev) =>
        prev.map((d) =>
          d.id === activeIdRef.current
            ? {
                ...d,
                settings: {
                  ...(d.settings ?? {}),
                  ...updates,
                },
              }
            : d
        )
      );
    },
    []
  );

  const setGlobalStyle = useCallback((style: Partial<GlobalStyle>) => {
    if (!activeIdRef.current) return;
    lastLocalUpdateAt.current = Date.now();
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeIdRef.current
          ? {
              ...d,
              globalStyle: {
                ...(d.globalStyle ?? DEFAULT_GLOBAL_STYLE),
                ...style,
              },
            }
          : d
      )
    );
  }, []);

  const contextValue = useMemo(
    () => ({
      dashboards,
      activeDashboard,
      toasts,
      visibleTools,
      dockItems,
      loading,
      gradeFilter,
      setGradeFilter: handleSetGradeFilter,
      addToast,
      removeToast,
      createNewDashboard,
      saveCurrentDashboard,
      deleteDashboard,
      duplicateDashboard,
      renameDashboard,
      loadDashboard,
      reorderDashboards,
      setDefaultDashboard,
      addWidget,
      addWidgets,
      removeWidget,
      duplicateWidget,
      removeWidgets,
      updateWidget,
      bringToFront,
      moveWidgetLayer,
      setBackground,
      updateDashboardSettings,
      setGlobalStyle,
      toggleToolVisibility,
      setAllToolsVisibility,
      reorderTools,
      reorderDockItems,
      clearAllStickers,
      clearAllWidgets,
      rosters,
      activeRosterId,
      addRoster,
      updateRoster,
      deleteRoster,
      setActiveRoster,
      addFolder,
      createFolderWithItems,
      renameFolder,
      deleteFolder,
      addItemToFolder,
      removeItemFromFolder,
      moveItemOutOfFolder,
      reorderFolderItems,
      shareDashboard,
      loadSharedDashboard,
      pendingShareId,
      clearPendingShare,
    }),
    [
      dashboards,
      activeDashboard,
      toasts,
      visibleTools,
      dockItems,
      loading,
      gradeFilter,
      handleSetGradeFilter,
      addToast,
      removeToast,
      createNewDashboard,
      saveCurrentDashboard,
      deleteDashboard,
      duplicateDashboard,
      renameDashboard,
      loadDashboard,
      reorderDashboards,
      setDefaultDashboard,
      addWidget,
      addWidgets,
      removeWidget,
      duplicateWidget,
      removeWidgets,
      updateWidget,
      bringToFront,
      moveWidgetLayer,
      setBackground,
      updateDashboardSettings,
      setGlobalStyle,
      toggleToolVisibility,
      setAllToolsVisibility,
      reorderTools,
      reorderDockItems,
      clearAllStickers,
      clearAllWidgets,
      rosters,
      activeRosterId,
      addRoster,
      updateRoster,
      deleteRoster,
      setActiveRoster,
      addFolder,
      createFolderWithItems,
      renameFolder,
      deleteFolder,
      addItemToFolder,
      removeItemFromFolder,
      moveItemOutOfFolder,
      reorderFolderItems,
      shareDashboard,
      loadSharedDashboard,
      pendingShareId,
      clearPendingShare,
    ]
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};
