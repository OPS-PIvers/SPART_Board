import {
  WidgetType,
  WidgetConfig,
  TimeToolConfig,
  SoundConfig,
  TrafficConfig,
  RandomConfig,
  PollConfig,
} from '../../../types';
import { WIDGET_DEFAULTS } from '../../../config/widgetDefaults';

export const QUICK_TOOLS: {
  label: string;
  type: WidgetType | 'none';
  config?: WidgetConfig;
}[] = [
  { label: 'None', type: 'none' },
  {
    label: 'Timer (1 min)',
    type: 'time-tool',
    config: {
      ...(WIDGET_DEFAULTS['time-tool'].config as TimeToolConfig),
      mode: 'timer',
      duration: 60,
      isRunning: true,
    },
  },
  {
    label: 'Timer (2 min)',
    type: 'time-tool',
    config: {
      ...(WIDGET_DEFAULTS['time-tool'].config as TimeToolConfig),
      mode: 'timer',
      duration: 120,
      isRunning: true,
    },
  },
  {
    label: 'Timer (5 min)',
    type: 'time-tool',
    config: {
      ...(WIDGET_DEFAULTS['time-tool'].config as TimeToolConfig),
      mode: 'timer',
      duration: 300,
      isRunning: true,
    },
  },
  {
    label: 'Stopwatch',
    type: 'time-tool',
    config: {
      ...(WIDGET_DEFAULTS['time-tool'].config as TimeToolConfig),
      mode: 'stopwatch',
      isRunning: true,
    },
  },
  {
    label: 'Noise Meter',
    type: 'sound',
    config: {
      ...(WIDGET_DEFAULTS['sound'].config as SoundConfig),
      sensitivity: 50,
      visual: 'balls',
    },
  },
  {
    label: 'Traffic Light',
    type: 'traffic',
    config: {
      ...(WIDGET_DEFAULTS['traffic'].config as TrafficConfig),
      active: 'red',
    },
  },
  {
    label: 'Random Picker',
    type: 'random',
    config: {
      ...(WIDGET_DEFAULTS['random'].config as RandomConfig),
      mode: 'spinner',
    },
  },
  {
    label: 'Poll',
    type: 'poll',
    config: {
      ...(WIDGET_DEFAULTS['poll'].config as PollConfig),
      question: '',
      options: [],
    },
  },
];
