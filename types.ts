import {
  Clock,
  Timer,
  TrafficCone,
  Type,
  CheckSquare,
  Users,
  Dices,
  Mic,
  Pencil,
  QrCode,
  Globe,
  BarChart2,
  Video,
  Trophy,
  AlertCircle,
  CloudSun,
  Calendar,
  TimerReset,
  Utensils,
} from 'lucide-react';

export type WidgetType =
  | 'clock'
  | 'timer'
  | 'stopwatch'
  | 'traffic'
  | 'text'
  | 'checklist'
  | 'random'
  | 'dice'
  | 'sound'
  | 'drawing'
  | 'qr'
  | 'embed'
  | 'poll'
  | 'webcam'
  | 'scoreboard'
  | 'workSymbols'
  | 'weather'
  | 'schedule'
  | 'calendar'
  | 'lunchCount';

export interface WidgetData {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  flipped: boolean;
  minimized?: boolean;
  config: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  background: string;
  widgets: WidgetData[];
  createdAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ToolMetadata {
  type: WidgetType;
  icon: any;
  label: string;
  color: string;
}

export const TOOLS: ToolMetadata[] = [
  { type: 'clock', icon: Clock, label: 'Clock', color: 'bg-blue-500' },
  { type: 'timer', icon: Timer, label: 'Timer', color: 'bg-red-500' },
  {
    type: 'stopwatch',
    icon: TimerReset,
    label: 'Stop',
    color: 'bg-orange-600',
  },
  {
    type: 'traffic',
    icon: TrafficCone,
    label: 'Traffic',
    color: 'bg-amber-500',
  },
  { type: 'text', icon: Type, label: 'Note', color: 'bg-yellow-400' },
  {
    type: 'checklist',
    icon: CheckSquare,
    label: 'Tasks',
    color: 'bg-green-500',
  },
  { type: 'random', icon: Users, label: 'Random', color: 'bg-indigo-500' },
  { type: 'dice', icon: Dices, label: 'Dice', color: 'bg-purple-500' },
  { type: 'sound', icon: Mic, label: 'Noise', color: 'bg-pink-500' },
  { type: 'drawing', icon: Pencil, label: 'Draw', color: 'bg-cyan-500' },
  { type: 'qr', icon: QrCode, label: 'QR', color: 'bg-slate-700' },
  { type: 'embed', icon: Globe, label: 'Embed', color: 'bg-sky-600' },
  { type: 'poll', icon: BarChart2, label: 'Poll', color: 'bg-orange-500' },
  { type: 'webcam', icon: Video, label: 'Camera', color: 'bg-gray-800' },
  { type: 'scoreboard', icon: Trophy, label: 'Scores', color: 'bg-yellow-600' },
  {
    type: 'workSymbols',
    icon: AlertCircle,
    label: 'Expects',
    color: 'bg-emerald-600',
  },
  { type: 'weather', icon: CloudSun, label: 'Weather', color: 'bg-sky-400' },
  { type: 'schedule', icon: Calendar, label: 'Schedule', color: 'bg-teal-600' },
  { type: 'calendar', icon: Calendar, label: 'Events', color: 'bg-rose-500' },
  {
    type: 'lunchCount',
    icon: Utensils,
    label: 'Lunch',
    color: 'bg-orange-600',
  },
];

export type AccessLevel = 'admin' | 'beta' | 'public';

export interface FeaturePermission {
  widgetType: WidgetType;
  accessLevel: AccessLevel;
  betaUsers: string[]; // Array of email addresses
  enabled: boolean;
}
