import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
  Toast,
  TOOLS,
  ClassRoster,
  Student,
  GradeFilter,
} from '../types';
import { useAuth } from './useAuth';
import { useFirestore } from '../hooks/useFirestore';
import { db } from '../config/firebase';
import {
  migrateLocalStorageToFirestore,
  migrateWidget,
} from '../utils/migration';
import { DashboardContext } from './DashboardContextValue';

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

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const {
    loadDashboards: _loadDashboards,
    saveDashboard,
    deleteDashboard: deleteDashboardFirestore,
    subscribeToDashboards,
  } = useFirestore(user?.uid ?? null);

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = React.useRef(activeId);
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
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(false);

  const [gradeFilter, setGradeFilter] = useState<GradeFilter>(() => {
    const saved = localStorage.getItem('spartboard_gradeFilter');
    const validFilters: GradeFilter[] = ['all', 'k-2', '3-5', '6-8', '9-12'];
    return saved && validFilters.includes(saved as GradeFilter)
      ? (saved as GradeFilter)
      : 'all';
  });

  const handleSetGradeFilter = (filter: GradeFilter) => {
    setGradeFilter(filter);
    localStorage.setItem('spartboard_gradeFilter', filter);
  };

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
      const migratedDashboards = updatedDashboards.map((db) => ({
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
        setActiveId(migratedDashboards[0].id);
      }

      // Create default dashboard if none exist
      if (updatedDashboards.length === 0 && !migrated) {
        const defaultDb: Dashboard = {
          id: uuidv4(),
          name: 'My First Board',
          background: 'bg-slate-900',
          widgets: [],
          createdAt: Date.now(),
        };
        void saveDashboard(defaultDb).then(() => {
          setToasts((prev) => [
            ...prev,
            {
              id: uuidv4(),
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
                id: uuidv4(),
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
              id: uuidv4(),
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
            id: uuidv4(),
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

  const toggleToolVisibility = (type: WidgetType) => {
    setVisibleTools((prev) => {
      const next = prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type];
      localStorage.setItem('classroom_visible_tools', JSON.stringify(next));
      return next;
    });
  };

  const setAllToolsVisibility = (visible: boolean) => {
    const next = visible ? TOOLS.map((t) => t.type) : [];
    setVisibleTools(next);
    localStorage.setItem('classroom_visible_tools', JSON.stringify(next));
  };

  const reorderTools = (tools: WidgetType[]) => {
    setVisibleTools(tools);
    localStorage.setItem('classroom_visible_tools', JSON.stringify(tools));
  };

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = uuidv4();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const createNewDashboard = (name: string, data?: Dashboard) => {
    if (!user) {
      addToast('Must be signed in to create dashboard', 'error');
      return;
    }

    const newDb: Dashboard = data
      ? { ...data, id: uuidv4(), name }
      : {
          id: uuidv4(),
          name,
          background: 'bg-slate-800',
          widgets: [],
          createdAt: Date.now(),
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
  };

  const saveCurrentDashboard = () => {
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
  };

  const deleteDashboard = (id: string) => {
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
  };

  const renameDashboard = (id: string, name: string) => {
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
        setDashboards((prev) => prev.map((d) => (d.id === id ? dashboard : d)));
      });
  };

  const loadDashboard = (id: string) => {
    setActiveId(id);
    addToast('Board loaded');
  };

  const activeDashboard = dashboards.find((d) => d.id === activeId) ?? null;

  const addWidget = (type: WidgetType) => {
    if (!activeId) return;
    lastLocalUpdateAt.current = Date.now();

    const defaults: Record<string, Partial<WidgetData>> = {
      clock: { w: 280, h: 140, config: { format24: true, showSeconds: true } },
      timer: {
        w: 280,
        h: 180,
        config: {
          duration: 300,
          sound: true,
        },
      },
      'time-tool': {
        w: 420,
        h: 400,
        config: {
          mode: 'timer',
          visualType: 'digital',
          theme: 'light',
          duration: 600,
          elapsedTime: 600,
          isRunning: false,
          selectedSound: 'Gong',
        },
      },
      traffic: { w: 120, h: 320, config: {} },
      text: {
        w: 300,
        h: 250,
        config: {
          content: 'Double click to edit...',
          bgColor: '#fef9c3',
          fontSize: 18,
        },
      },
      checklist: { w: 280, h: 300, config: { items: [] } },
      random: {
        w: 300,
        h: 320,
        config: { firstNames: '', lastNames: '', mode: 'single' },
      },
      dice: { w: 240, h: 240, config: { count: 1 } },
      sound: { w: 300, h: 180, config: { sensitivity: 5 } },
      drawing: { w: 400, h: 350, config: { mode: 'window', paths: [] } },
      qr: { w: 200, h: 250, config: { url: 'https://google.com' } },
      embed: { w: 480, h: 350, config: { url: '' } },
      poll: {
        w: 300,
        h: 250,
        config: {
          question: 'Vote now!',
          options: [
            { label: 'Option A', votes: 0 },
            { label: 'Option B', votes: 0 },
          ],
        },
      },
      webcam: {
        w: 400,
        h: 300,
        config: {
          zoomLevel: 1,
          isMirrored: true,
        },
      },
      scoreboard: {
        w: 320,
        h: 200,
        config: { scoreA: 0, scoreB: 0, teamA: 'Team 1', teamB: 'Team 2' },
      },
      workSymbols: {
        w: 300,
        h: 250,
        config: { voice: 'none', routine: 'none' },
      },
      weather: { w: 250, h: 280, config: { temp: 72, condition: 'sunny' } },
      schedule: {
        w: 300,
        h: 350,
        config: {
          items: [
            { time: '08:00', task: 'Morning Meeting' },
            { time: '09:00', task: 'Math' },
          ],
        },
      },
      calendar: {
        w: 300,
        h: 350,
        config: {
          events: [
            { date: 'Friday', title: 'Pillar Power' },
            { date: 'Monday', title: 'Loon Day - PE' },
          ],
        },
      },
      lunchCount: {
        w: 500,
        h: 400,
        config: {
          schoolSite: 'schumann-elementary',
          isManualMode: false,
          manualHotLunch: '',
          manualBentoBox: '',
          roster: [],
          assignments: {},
          recipient: '',
        },
      },
      classes: {
        w: 600,
        h: 500,
        config: {},
      },
      instructionalRoutines: {
        w: 350,
        h: 450,
        config: { selectedRoutineId: null },
      },
    };

    setDashboards((prev) =>
      prev.map((d) => {
        if (d.id !== activeId) return d;
        const maxZ = d.widgets.reduce((max, w) => Math.max(max, w.z), 0);
        const newWidget: WidgetData = {
          id: uuidv4(),
          type,
          x: 150 + d.widgets.length * 20,
          y: 150 + d.widgets.length * 20,
          flipped: false,
          z: maxZ + 1,
          ...defaults[type],
          config: { ...(defaults[type].config ?? {}) },
        } as WidgetData;
        return { ...d, widgets: [...d.widgets, newWidget] };
      })
    );
  };

  const removeWidget = (id: string) => {
    if (!activeId) return;
    lastLocalUpdateAt.current = Date.now();
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeId
          ? { ...d, widgets: d.widgets.filter((w) => w.id !== id) }
          : d
      )
    );
  };

  const removeWidgets = (ids: string[]) => {
    if (!activeId) return;
    lastLocalUpdateAt.current = Date.now();
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === activeId
          ? { ...d, widgets: d.widgets.filter((w) => !ids.includes(w.id)) }
          : d
      )
    );
  };

  const updateWidget = useCallback(
    (id: string, updates: Partial<WidgetData>) => {
      if (!activeId) return;
      lastLocalUpdateAt.current = Date.now();
      setDashboards((prev) =>
        prev.map((d) => {
          if (d.id !== activeId) return d;
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
    [activeId]
  );

  const bringToFront = (id: string) => {
    if (!activeId) return;

    setDashboards((prev) => {
      const active = prev.find((d) => d.id === activeId);
      if (!active) return prev;

      const maxZ = active.widgets.reduce((max, w) => Math.max(max, w.z), 0);
      const target = active.widgets.find((w) => w.id === id);

      if (target && target.z < maxZ) {
        lastLocalUpdateAt.current = Date.now();
        return prev.map((d) => {
          if (d.id !== activeId) return d;
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
  };

  const setBackground = (bg: string) => {
    if (!activeId) return;
    lastLocalUpdateAt.current = Date.now();
    setDashboards((prev) =>
      prev.map((d) => (d.id === activeId ? { ...d, background: bg } : d))
    );
  };

  return (
    <DashboardContext.Provider
      value={{
        dashboards,
        activeDashboard,
        toasts,
        visibleTools,
        loading,
        gradeFilter,
        setGradeFilter: handleSetGradeFilter,
        addToast,
        removeToast,
        createNewDashboard,
        saveCurrentDashboard,
        deleteDashboard,
        renameDashboard,
        loadDashboard,
        addWidget,
        removeWidget,
        removeWidgets,
        updateWidget,
        bringToFront,
        setBackground,
        toggleToolVisibility,
        setAllToolsVisibility,
        reorderTools,
        rosters,
        activeRosterId,
        addRoster,
        updateRoster,
        deleteRoster,
        setActiveRoster,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
