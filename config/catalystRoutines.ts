import { WidgetType, WidgetConfig } from '../types';

export type RoutineCategory = 'Get Attention' | 'Engage' | 'Set Up' | 'Support';

export interface CatalystRoutine {
  id: string;
  title: string;
  category: RoutineCategory;
  icon: string; // Lucide icon name
  shortDesc: string;
  instructions: string; // The guide for the teacher
  associatedWidgets?: { type: WidgetType; config?: WidgetConfig }[]; // What opens in "Go Mode"
}

export const CATALYST_ROUTINES: CatalystRoutine[] = [
  {
    id: 'signal-silence',
    title: 'Signal for Silence',
    category: 'Get Attention',
    icon: 'Hand',
    shortDesc: 'Standard hand-raise protocol',
    instructions: `1. Raise your hand.\n2. Wait for 100% compliance.\n3. Do not speak until the room is silent.\n4. Praise the first students who noticed.`,
    associatedWidgets: [{ type: 'traffic', config: { active: 'red' } }],
  },
  {
    id: 'call-response',
    title: 'Call & Response',
    category: 'Get Attention',
    icon: 'Megaphone',
    shortDesc: '"Class Class" -> "Yes Yes"',
    instructions: `1. Teacher says: "Class Class!" (vary tone)\n2. Students reply: "Yes Yes!" (matching tone)\n3. Hands fold, eyes on teacher.`,
    associatedWidgets: [],
  },
  {
    id: 'think-pair-share',
    title: 'Think Pair Share',
    category: 'Engage',
    icon: 'Users',
    shortDesc: 'Rapid peer discussion',
    instructions: `1. **Think:** Give students 30s of silence to process.\n2. **Pair:** Turn to elbow partner.\n3. **Share:** Partner A speaks first (30s), then Partner B.`,
    associatedWidgets: [
      {
        type: 'time-tool',
        config: { mode: 'timer', duration: 60, isRunning: true },
      },
    ],
  },
  {
    id: 'todo-list',
    title: 'Create To-Do List',
    category: 'Set Up',
    icon: 'ListTodo',
    shortDesc: 'Set expectations for work time',
    instructions: `1. Define the "Must Do" items.\n2. Define the "May Do" items.\n3. ask students to repeat the first step.`,
    associatedWidgets: [{ type: 'checklist' }],
  },
  {
    id: 'brain-break',
    title: 'Brain Break',
    category: 'Support',
    icon: 'Zap',
    shortDesc: 'Quick energy reset',
    instructions: `1. Stand up.\n2. Cross-crawl (touch opposite elbow to knee).\n3. 10 repetitions.\n4. Deep breath. Sit down.`,
    associatedWidgets: [
      { type: 'sound', config: { sensitivity: 50, visual: 'balls' } },
    ],
  },
];
