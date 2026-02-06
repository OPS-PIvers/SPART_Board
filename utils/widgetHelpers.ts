import React from 'react';
import {
  WidgetData,
  WidgetType,
  WidgetConfig,
  CatalystInstructionConfig,
  CatalystVisualConfig,
  WidgetOutput,
  WidgetLayout,
} from '../types';
import { STICKY_NOTE_COLORS } from '../config/colors';

export const isWidgetLayout = (
  output: WidgetOutput
): output is WidgetLayout => {
  return (
    typeof output === 'object' &&
    output !== null &&
    'content' in output &&
    !React.isValidElement(output)
  );
};

export const getTitle = (widget: WidgetData): string => {
  if (widget.customTitle) return widget.customTitle;
  if (widget.type === 'sound') return 'Noise Meter';
  if (widget.type === 'checklist') return 'Task List';
  if (widget.type === 'random') return 'Selector';
  if (widget.type === 'expectations') return 'Expectations';
  if (widget.type === 'calendar') return 'Class Events';
  if (widget.type === 'lunchCount') return 'Lunch Orders';
  if (widget.type === 'classes') return 'Class Roster';
  if (widget.type === 'time-tool') return 'Timer';
  if (widget.type === 'miniApp') return 'App Manager';
  if (widget.type === 'sticker') return 'Sticker';
  if (widget.type === 'seating-chart') return 'Seating Chart';
  if (widget.type === 'smartNotebook') return 'Notebook Viewer';
  if (widget.type === 'catalyst-instruction') {
    const cfg = widget.config as CatalystInstructionConfig;
    return `Guide: ${cfg.title ?? 'Instruction Guide'}`;
  }
  if (widget.type === 'catalyst-visual') {
    const cfg = widget.config as CatalystVisualConfig;
    return cfg.title ?? 'Visual Anchor';
  }
  return widget.type.charAt(0).toUpperCase() + widget.type.slice(1);
};

/**
 * Get the default configuration for a widget type.
 * Returns an empty object for widgets that don't require configuration.
 */
export const getDefaultWidgetConfig = (type: WidgetType): WidgetConfig => {
  const defaults: Record<WidgetType, WidgetConfig> = {
    clock: { format24: true, showSeconds: true },
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
      content: 'Click to edit...',
      bgColor: STICKY_NOTE_COLORS.yellow,
      fontSize: 18,
    },
    checklist: { items: [] },
    random: { firstNames: '', lastNames: '', mode: 'single' },
    dice: { count: 1 },
    sound: { sensitivity: 1, visual: 'thermometer' },
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
    expectations: { voiceLevel: null, workMode: null, interactionMode: null },
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
    materials: {
      selectedItems: [],
      activeItems: [],
    },
    stickers: { uploadedUrls: [] },
    sticker: { url: '', rotation: 0, size: 150 },
    'seating-chart': {
      furniture: [],
      assignments: {},
      gridSize: 20,
    },
    catalyst: { activeTab: 'attention' },
    'catalyst-instruction': { routineId: '', stepIndex: 0 },
    'catalyst-visual': { routineId: '', stepIndex: 0 },
    smartNotebook: { activeNotebookId: null },
    recessGear: { linkedWeatherWidgetId: null, useFeelsLike: true },
  };

  return defaults[type];
};
