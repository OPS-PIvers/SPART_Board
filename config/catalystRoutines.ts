import { WidgetType, WidgetConfig } from '../types';

export interface CatalystAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  category: 'attention' | 'engage' | 'setup' | 'support';
  teacherInstructions: string[];
  actionWidget?: {
    type: WidgetType;
    config: Partial<WidgetConfig>;
  };
  associatedTools?: {
    type: WidgetType;
    config?: Partial<WidgetConfig>;
  }[];
}

export interface CatalystRoutine {
  id: string;
  name: string;
  actions: CatalystAction[];
}

export const CATALYST_ACTIONS: CatalystAction[] = [
  // --- GET ATTENTION ---
  {
    id: 'chimes',
    label: 'Chimes',
    icon: 'Music',
    color: 'blue',
    category: 'attention',
    teacherInstructions: [
      'Wait for a natural pause in activity.',
      'Ring the chimes once clearly.',
      'Wait for eyes on you before speaking.',
    ],
    associatedTools: [
      { type: 'sound', config: { sensitivity: 50, visual: 'balls' } },
    ],
  },
  {
    id: 'countdown',
    label: 'Countdown',
    icon: 'Timer',
    color: 'amber',
    category: 'attention',
    teacherInstructions: [
      'Raise a hand with 5 fingers.',
      'Count down slowly: 5... 4... 3... 2... 1...',
      'Maintain silence once you reach zero.',
    ],
    actionWidget: {
      type: 'time-tool',
      config: { mode: 'timer', duration: 5, isRunning: true },
    },
  },

  // --- ENGAGE ---
  {
    id: 'think-pair-share',
    label: 'Think-Pair-Share',
    icon: 'Brain',
    color: 'indigo',
    category: 'engage',
    teacherInstructions: [
      'Pose a high-level question.',
      'Think: 30 seconds of silent wait time.',
      'Pair: Turn to a neighbor.',
      'Share: Randomly call on 3 pairs.',
    ],
    associatedTools: [{ type: 'random', config: { mode: 'spinner' } }],
  },
  {
    id: 'quick-poll',
    label: 'Quick Poll',
    icon: 'BarChart3',
    color: 'green',
    category: 'engage',
    teacherInstructions: [
      'State the question clearly.',
      'Give 10 seconds to decide.',
      'Open the poll for responses.',
    ],
    actionWidget: {
      type: 'poll',
      config: {
        question: 'Check for understanding?',
        options: [
          { label: 'Got it!', votes: 0 },
          { label: 'Need help', votes: 0 },
        ],
      },
    },
  },

  // --- SET UP ---
  {
    id: 'materials-ready',
    label: 'Materials Ready',
    icon: 'Package',
    color: 'slate',
    category: 'setup',
    teacherInstructions: [
      'List required materials on the board.',
      'Set a 2-minute timer for collection.',
      'Scan the room for readiness.',
    ],
    associatedTools: [
      { type: 'materials' },
      { type: 'time-tool', config: { mode: 'timer', duration: 120 } },
    ],
  },

  // --- SUPPORT ---
  {
    id: 'voice-levels',
    label: 'Voice Levels',
    icon: 'Volume2',
    color: 'purple',
    category: 'support',
    teacherInstructions: [
      'Refer to the Voice Level chart.',
      'Model the expected level.',
      'Start the noise meter to monitor.',
    ],
    associatedTools: [
      { type: 'workSymbols', config: { voiceLevel: 1 } },
      { type: 'sound', config: { sensitivity: 40, visual: 'thermometer' } },
    ],
  },
];
