import {
  Dashboard,
  WidgetData,
  TimeToolConfig,
  TextConfig,
  ScheduleConfig,
} from '../types';
import { sanitizeHtml } from './security';

interface LegacyConfig {
  duration?: number;
}

export const migrateWidget = (widget: WidgetData): WidgetData => {
  const type = widget.type as string;

  // Sanitize stored text widget content to prevent XSS
  if (type === 'text') {
    const config = widget.config as TextConfig;
    if (config.content) {
      return {
        ...widget,
        config: {
          ...config,
          content: sanitizeHtml(config.content),
        } as TextConfig,
      };
    }
  }

  // Schedule Widget Migration: Ensure all items have a unique ID
  if (type === 'schedule') {
    const config = widget.config as ScheduleConfig;
    if (config.items && Array.isArray(config.items)) {
      const migratedItems = config.items.map((item) => {
        if (!item.id) {
          return { ...item, id: crypto.randomUUID() };
        }
        return item;
      });
      return {
        ...widget,
        config: {
          ...config,
          items: migratedItems,
        } as ScheduleConfig,
      };
    }
  }

  if (type === 'timer' || type === 'stopwatch') {
    const isTimer = type === 'timer';
    const oldConfig = widget.config as LegacyConfig;

    return {
      ...widget,
      type: 'time-tool',
      config: {
        mode: isTimer ? 'timer' : 'stopwatch',
        visualType: 'digital',
        theme: 'light',
        duration: isTimer ? (oldConfig.duration ?? 600) : 0,
        elapsedTime: isTimer ? (oldConfig.duration ?? 600) : 0,
        isRunning: false,
        selectedSound: 'Gong',
      } as TimeToolConfig,
    };
  }
  return widget;
};

export const migrateLocalStorageToFirestore = async (
  userId: string,
  saveDashboard: (dashboard: Dashboard) => Promise<void>
): Promise<number> => {
  const localData = localStorage.getItem('classroom_dashboards');
  if (!localData) return 0;

  try {
    const dashboards = JSON.parse(localData) as Dashboard[];

    for (const dashboard of dashboards) {
      await saveDashboard(dashboard);
    }

    // Clear localStorage after successful migration
    localStorage.removeItem('classroom_dashboards');

    return dashboards.length;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
