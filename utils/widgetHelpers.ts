import { WidgetData, WidgetType, WidgetConfig } from '../types';

export const getTitle = (widget: WidgetData): string => {
  if (widget.customTitle) return widget.customTitle;
  if (widget.type === 'sound') return 'Noise Meter';
  if (widget.type === 'checklist') return 'Task List';
  if (widget.type === 'random') return 'Selector';
  if (widget.type === 'workSymbols') return 'Expectations';
  if (widget.type === 'calendar') return 'Class Events';
  if (widget.type === 'lunchCount') return 'Lunch Orders';
  if (widget.type === 'classes') return 'Class Roster';
  if (widget.type === 'time-tool') return 'Timer';
  if (widget.type === 'miniApp') return 'App Manager';
  return widget.type.charAt(0).toUpperCase() + widget.type.slice(1);
};

/**
 * Get the default configuration for a widget type.
 * Returns an empty object for widgets that don't require configuration.
 */
export const getDefaultWidgetConfig = (type: WidgetType): WidgetConfig => {
  const defaults: Record<WidgetType, WidgetConfig> = {
    clock: { format24: true, showSeconds: true },
    timer: {
      duration: 300,
      sound: true,
    },
    'time-tool': {
      mode: 'timer',
      visualType: 'digital',
      theme: 'light',
      duration: 600,
      elapsedTime: 600,
      isRunning: false,
      selectedSound: 'Gong',
    },
    traffic: {},
    text: {
      content: 'Double click to edit...',
      bgColor: '#fef9c3',
      fontSize: 18,
    },
    checklist: { items: [] },
    random: { firstNames: '', lastNames: '', mode: 'single' },
    dice: { count: 1 },
    sound: { sensitivity: 5 },
    drawing: { mode: 'window', paths: [] },
    qr: { url: 'https://google.com' },
    embed: { url: '' },
    poll: {
      question: 'Vote now!',
      options: [
        { label: 'Option A', votes: 0 },
        { label: 'Option B', votes: 0 },
      ],
    },
    webcam: {},
    scoreboard: { scoreA: 0, scoreB: 0, teamA: 'Team 1', teamB: 'Team 2' },
    workSymbols: { voiceLevel: null, workMode: null },
    weather: { temp: 72, condition: 'sunny' },
    schedule: { items: [] },
    calendar: { events: [] },
    lunchCount: {
      schoolSite: 'schumann-elementary',
      isManualMode: false,
      manualHotLunch: '',
      manualBentoBox: '',
      roster: [],
      assignments: {},
      recipient: '',
    },
    classes: {},
    instructionalRoutines: {
      selectedRoutineId: null,
      customSteps: [],
      favorites: [],
      scaleMultiplier: 1,
    },
    miniApp: {
      activeApp: null,
    },
  };

  return defaults[type];
};
