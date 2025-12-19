
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Dashboard, WidgetData, WidgetType, Toast } from '../types';

interface DashboardContextType {
  dashboards: Dashboard[];
  activeDashboard: Dashboard | null;
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  createNewDashboard: (name: string) => void;
  saveCurrentDashboard: () => void;
  deleteDashboard: (id: string) => void;
  loadDashboard: (id: string) => void;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
  bringToFront: (id: string) => void;
  setBackground: (bg: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Load from LocalStorage (Simulating Persistence)
  useEffect(() => {
    const saved = localStorage.getItem('classroom_dashboards');
    if (saved) {
      const parsed = JSON.parse(saved);
      setDashboards(parsed);
      if (parsed.length > 0) setActiveId(parsed[0].id);
    } else {
      // Default initial dashboard
      const defaultDb: Dashboard = {
        id: uuidv4(),
        name: 'My First Dashboard',
        background: 'bg-slate-900',
        widgets: [],
        createdAt: Date.now()
      };
      setDashboards([defaultDb]);
      setActiveId(defaultDb.id);
    }
  }, []);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const createNewDashboard = (name: string) => {
    const newDb: Dashboard = {
      id: uuidv4(),
      name,
      background: 'bg-slate-800',
      widgets: [],
      createdAt: Date.now()
    };
    setDashboards(prev => [...prev, newDb]);
    setActiveId(newDb.id);
    addToast(`Dashboard "${name}" created`);
  };

  const saveCurrentDashboard = () => {
    localStorage.setItem('classroom_dashboards', JSON.stringify(dashboards));
    addToast('Dashboard saved successfully', 'success');
  };

  const deleteDashboard = (id: string) => {
    const filtered = dashboards.filter(d => d.id !== id);
    setDashboards(filtered);
    if (activeId === id) {
      setActiveId(filtered.length > 0 ? filtered[0].id : null);
    }
    addToast('Dashboard deleted');
  };

  const loadDashboard = (id: string) => {
    setActiveId(id);
    addToast('Loaded dashboard');
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
      traffic: { w: 120, h: 320, config: {} },
      text: { w: 300, h: 250, config: { content: 'Type something...', bgColor: '#fef9c3', fontSize: 18 } },
      checklist: { w: 280, h: 300, config: { items: ['Read a book', 'Finish math'] } },
      random: { w: 300, h: 250, config: { list: 'Alice\nBob\nCharlie', mode: 'single' } },
      dice: { w: 200, h: 200, config: { count: 1 } },
      sound: { w: 300, h: 120, config: { sensitivity: 5 } },
      drawing: { w: 400, h: 300, config: {} },
      qr: { w: 220, h: 260, config: { url: 'https://google.com' } },
      embed: { w: 480, h: 320, config: { url: '' } },
      poll: { w: 300, h: 220, config: { labelA: 'Yes', labelB: 'No', votesA: 0, votesB: 0 } },
      webcam: { w: 320, h: 240, config: {} }
    };

    const newWidget: WidgetData = {
      id: uuidv4(),
      type,
      x: 100 + (activeDashboard.widgets.length * 20),
      y: 100 + (activeDashboard.widgets.length * 20),
      flipped: false,
      z: maxZ + 1,
      ...defaults[type],
      config: defaults[type].config || {}
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
      dashboards, activeDashboard, toasts, addToast, removeToast,
      createNewDashboard, saveCurrentDashboard, deleteDashboard, loadDashboard,
      addWidget, removeWidget, updateWidget, bringToFront, setBackground
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
