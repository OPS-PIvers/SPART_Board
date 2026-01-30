import { WidgetData, WidgetType, WidgetConfig } from '../types';
import { WIDGET_DEFAULTS } from '../config/widgetDefaults';

const WIDGET_TITLES: Partial<Record<WidgetType, string>> = {
  sound: 'Noise Meter',
  checklist: 'Task List',
  random: 'Selector',
  workSymbols: 'Work Symbols',
  calendar: 'Class Events',
  lunchCount: 'Lunch Orders',
  classes: 'Class Roster',
  'time-tool': 'Timer',
  miniApp: 'App Manager',
  sticker: 'Sticker',
  'seating-chart': 'Seating Chart',
  smartNotebook: 'Notebook Viewer',
};

export const getTitle = (widget: WidgetData): string => {
  if (widget.customTitle) return widget.customTitle;
  return (
    WIDGET_TITLES[widget.type] ??
    widget.type.charAt(0).toUpperCase() + widget.type.slice(1)
  );
};

/**
 * Get the default configuration for a widget type.
 * Returns an empty object for widgets that don't require configuration.
 */
export const getDefaultWidgetConfig = (type: WidgetType): WidgetConfig => {
  return (WIDGET_DEFAULTS[type]?.config as WidgetConfig) ?? {};
};
