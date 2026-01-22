import { WidgetData } from '../types';
import { STICKY_NOTE_COLORS } from './colors';

export const WIDGET_DEFAULTS: Record<string, Partial<WidgetData>> = {
  clock: { w: 280, h: 140, config: { format24: true, showSeconds: true } },
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
      bgColor: STICKY_NOTE_COLORS.yellow,
      fontSize: 18,
    },
  },
  checklist: {
    w: 280,
    h: 300,
    config: {
      items: [],
      mode: 'manual',
      firstNames: '',
      lastNames: '',
      completedNames: [],
      scaleMultiplier: 1,
    },
  },
  random: {
    w: 300,
    h: 320,
    config: {
      firstNames: '',
      lastNames: '',
      mode: 'single',
      rosterMode: 'class',
    },
  },
  dice: { w: 240, h: 240, config: { count: 1 } },
  sound: {
    w: 300,
    h: 300,
    config: { sensitivity: 1, visual: 'thermometer' },
  },
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
    w: 320,
    h: 350,
    config: { voiceLevel: null, workMode: null },
  },
  weather: {
    w: 250,
    h: 280,
    config: { temp: 72, condition: 'sunny', isAuto: true },
  },
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
      rosterMode: 'class',
    },
  },
  classes: {
    w: 600,
    h: 500,
    config: {},
  },
  instructionalRoutines: {
    w: 400,
    h: 480,
    config: {
      selectedRoutineId: null,
      customSteps: [],
      favorites: [],
      scaleMultiplier: 1,
    },
  },
  miniApp: {
    w: 500,
    h: 600,
    config: { activeApp: null },
  },
  materials: {
    w: 340,
    h: 340,
    config: { selectedItems: [], activeItems: [] },
  },
  stickers: {
    w: 600,
    h: 500,
    config: { uploadedUrls: [] },
  },
  sticker: {
    w: 200,
    h: 200,
    config: { url: '', rotation: 0, size: 150 },
  },
  'seating-chart': {
    w: 600,
    h: 500,
    config: {
      furniture: [],
      assignments: {},
      gridSize: 20,
      rosterMode: 'class',
    },
  },
  catalyst: {
    w: 320,
    h: 400,
    config: { activeTab: 'attention' },
  },
  'catalyst-instruction': {
    w: 280,
    h: 350,
    config: { routineId: '', stepIndex: 0 },
  },
  'catalyst-visual': {
    w: 600,
    h: 400,
    config: { routineId: '', stepIndex: 0 },
  },
};
