import { WidgetData } from '../types';

export const getTitle = (widget: WidgetData): string => {
  if (widget.customTitle) return widget.customTitle;
  if (widget.type === 'sound') return 'Noise Meter';
  if (widget.type === 'checklist') return 'Task List';
  if (widget.type === 'random') return 'Selector';
  if (widget.type === 'workSymbols') return 'Expectations';
  if (widget.type === 'calendar') return 'Class Events';
  if (widget.type === 'lunchCount') return 'Lunch Orders';
  return widget.type.charAt(0).toUpperCase() + widget.type.slice(1);
};
