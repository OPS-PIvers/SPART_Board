import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Dashboard, WidgetData, WidgetType, Toast, TOOLS } from '../types';
import { useAuth } from './AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { migrateLocalStorageToFirestore } from '../utils/migration';

interface DashboardContextType {
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
  loadDashboard: (id: string) => void;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
  bringToFront: (id: string) => void;
  setBackground: (bg: string) => void;
  toggleToolVisibility: (type: WidgetType) => void;
  setAllToolsVisibility: (visible: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { loadDashboards, saveDashboard, deleteDashboard: deleteDashboardFirestore, subscribeToDashboards } = useFirestore(user?.uid || null);
  
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [visibleTools, setVisibleTools] = useState<WidgetType[]>(TOOLS.map(t => t.type));
  const [loading, setLoading] = useState(true);
  const [migrated, setMigrated] = useState(false);

  // Load dashboards on mount and subscribe to changes
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time subscription to Firestore
    const unsubscribe = subscribeToDashboards((updatedDashboards) => {
      setDashboards(updatedDashboards);
      
      // If no active dashboard or active dashboard deleted, set to first
      if (updatedDashboards.length > 0 && !activeId) {
        setActiveId(updatedDashboards[0].id);
      }
      
      // Create default dashboard if none exist
      if (updatedDashboards.length === 0 && !migrated) {
        const defaultDb: Dashboard = {
          id: uuidv4(),
          name: 'My First Dashboard',
          background: 'bg-slate-900',
          widgets: [],
          createdAt: Date.now()
        };
        saveDashboard(defaultDb).then(() => {
          addToast('Welcome! Dashboard created');
        });
      }
      
      setLoading(false);
    });

    // Load tool visibility from localStorage (user preference)
    const savedTools = localStorage.getItem('classroom_visible_tools');
    if (savedTools) {
      setVisibleTools(JSON.parse(savedTools));
    }

    // Migrate localStorage data on first sign-in
    const localData = localStorage.getItem('classroom_dashboards');
    if (localData && !migrated) {
      migrateLocalStorageToFirestore(user.uid, saveDashboard)
        .then(count => {
          if (count > 0) {
            addToast(`Migrated ${count} dashboard(s) to cloud`, 'success');
          }
          setMigrated(true);
        })
        .catch(err => {
          console.error('Migration error:', err);
          addToast('Failed to migrate local data', 'error');
        });
    }

    return unsubscribe;
  }, [user]);

  // Auto-save to Firestore with debouncing
  useEffect(() => {
    if (!user || loading || !activeId) return;

    const timeoutId = setTimeout(() => {
      const active = dashboards.find(d => d.id === activeId);
      if (active) {
        saveDashboard(active).catch(err => {
          console.error('Auto-save failed:', err);
          addToast('Failed to sync changes', 'error');
        });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [dashboards, activeId, user, loading]);

  const toggleToolVisibility = (type: WidgetType) => {
    setVisibleTools(prev => {
      const next = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
      localStorage.setItem('classroom_visible_tools', JSON.stringify(next));
      return next;
    });
  };

  const setAllToolsVisibility = (visible: boolean) => {
    const next = visible ? TOOLS.map(t => t.type) : [];
    setVisibleTools(next);
    localStorage.setItem('classroom_visible_tools', JSON.stringify(next));
  };

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const createNewDashboard = (name: string, data?: Dashboard) => {
    if (!user) {
      addToast('Must be signed in to create dashboard', 'error');
      return;
    }
    
    const newDb: Dashboard = data ? { ...data, id: uuidv4(), name } : {
      id: uuidv4(),
      name,
      background: 'bg-slate-800',
      widgets: [],
      createdAt: Date.now()
    };
    
    saveDashboard(newDb).then(() => {
      setActiveId(newDb.id);
      addToast(`Dashboard "${name}" ready`);
    }).catch(err => {
      console.error('Failed to create dashboard:', err);
      addToast('Failed to create dashboard', 'error');
    });
  };

  const saveCurrentDashboard = () => {
    if (!user) {
      addToast('Must be signed in to save', 'error');
      return;
    }
    
    const active = dashboards.find(d => d.id === activeId);
    if (active) {
      saveDashboard(active).then(() => {
        addToast('All changes saved to cloud', 'success');
      }).catch(err => {
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
    
    deleteDashboardFirestore(id).then(() => {
      if (activeId === id) {
        const filtered = dashboards.filter(d => d.id !== id);
        setActiveId(filtered.length > 0 ? filtered[0].id : null);
      }
      addToast('Dashboard removed');
    }).catch(err => {
      console.error('Delete failed:', err);
      addToast('Delete failed', 'error');
    });
  };

  const loadDashboard = (id: string) => {
    setActiveId(id);
    addToast('Board loaded');
  };

  const activeDashboard = dashboards.find(d => d.id === activeId) || null;

  const updateDashboard = useCallback((updates: Partial<Dashboard>) => {
    if (!activeId) return;
    setDashboards(prev => prev.map(d => d.id === activeId ? { ...d, ...updates } : d));
  }, [activeId]);

  const addWidget = (type: WidgetType) => {
    if (!activeDashboard) return;
    const maxZ = activeDashboard.widgets.reduce((max, w) => Math.max(max, w.z), 0);
    
    const defaults: Record<WidgetType, Partial<WidgetData>> = {
      clock: { w: 280, h: 140, config: { format24: true, showSeconds: true } },
      timer: { w: 280, h: 180, config: { duration: 300, sound: true } },
      stopwatch: { w: 280, h: 180, config: {} },
      traffic: { w: 120, h: 320, config: {} },
      text: { w: 300, h: 250, config: { content: 'Double click to edit...', bgColor: '#fef9c3', fontSize: 18 } },
      checklist: { w: 280, h: 300, config: { items: [] } },
      random: { w: 300, h: 320, config: { firstNames: '', lastNames: '', mode: 'single' } },
      dice: { w: 240, h: 240, config: { count: 1 } },
      sound: { w: 300, h: 180, config: { sensitivity: 5 } },
      drawing: { w: 400, h: 350, config: { mode: 'window', paths: [] } },
      qr: { w: 200, h: 250, config: { url: 'https://google.com' } },
      embed: { w: 480, h: 350, config: { url: '' } },
      poll: { w: 300, h: 250, config: { question: 'Vote now!', options: [{label: 'Option A', votes: 0}, {label: 'Option B', votes: 0}] } },
      webcam: { w: 350, h: 300, config: {} },
      scoreboard: { w: 320, h: 200, config: { scoreA: 0, scoreB: 0, teamA: 'Team 1', teamB: 'Team 2' } },
      workSymbols: { w: 300, h: 250, config: { voice: 'none', routine: 'none' } },
      weather: { w: 250, h: 280, config: { temp: 72, condition: 'sunny' } },
      schedule: { w: 300, h: 350, config: { items: [{time: '08:00', task: 'Morning Meeting'}, {time: '09:00', task: 'Math'}] } },
      calendar: { w: 300, h: 350, config: { events: [{date: 'Friday', title: 'Pillar Power'}, {date: 'Monday', title: 'Loon Day - PE'}] } },
      lunchCount: { w: 500, h: 400, config: { firstNames: '', lastNames: '', assignments: {}, recipient: 'paul.ivers@orono.k12.mn.us' } }
    };

    const newWidget: WidgetData = {
      id: uuidv4(),
      type,
      x: 150 + (activeDashboard.widgets.length * 20),
      y: 150 + (activeDashboard.widgets.length * 20),
      flipped: false,
      z: maxZ + 1,
      ...defaults[type],
      config: { ...(defaults[type].config || {}) }
    } as WidgetData;

    updateDashboard({ widgets: [...activeDashboard.widgets, newWidget] });
  };

  const removeWidget = (id: string) => {
    if (!activeDashboard) return;
    updateDashboard({ widgets: activeDashboard.widgets.filter(w => w.id !== id) });
  };

  const updateWidget = (id: string, updates: Partial<WidgetData>) => {
    if (!activeDashboard) return;
    updateDashboard({
      widgets: activeDashboard.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
    });
  };

  const bringToFront = (id: string) => {
    if (!activeDashboard) return;
    const maxZ = activeDashboard.widgets.reduce((max, w) => Math.max(max, w.z), 0);
    const target = activeDashboard.widgets.find(w => w.id === id);
    if (target && target.z < maxZ) {
      updateWidget(id, { z: maxZ + 1 });
    }
  };

  const setBackground = (bg: string) => {
    updateDashboard({ background: bg });
  };

  return (
    <DashboardContext.Provider value={{
      dashboards, activeDashboard, toasts, visibleTools, loading, addToast, removeToast,
      createNewDashboard, saveCurrentDashboard, deleteDashboard, loadDashboard,
      addWidget, removeWidget, updateWidget, bringToFront, setBackground,
      toggleToolVisibility, setAllToolsVisibility
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard must be used within DashboardProvider");
  return context;
};
