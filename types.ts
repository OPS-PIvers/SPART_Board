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
  | 'lunchCount'
  | 'classes';

// --- ROSTER SYSTEM TYPES ---

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ClassRoster {
  id: string;
  name: string;
  students: Student[];
  createdAt: number;
}

// --- LIVE SESSION TYPES ---

export interface LiveSession {
  id: string; // Usually the Teacher's User ID
  isActive: boolean;
  activeWidgetId: string | null;
  activeWidgetType: WidgetType | null;
  activeWidgetConfig?: WidgetConfig; // Config for the active widget
  code: string; // A short 4-6 digit join code
  frozen: boolean; // Global freeze state
  createdAt: number;
}

export interface LiveStudent {
  id: string; // Unique ID for this session
  name: string;
  status: 'active' | 'frozen' | 'disconnected';
  joinedAt: number;
  lastActive: number;
  authUid?: string; // Firebase auth UID for the student (for security rules)
}

// Supporting types for widget configs
export interface Point {
  x: number;
  y: number;
}

export interface Path {
  points: Point[];
  color: string;
  width: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface PollOption {
  label: string;
  votes: number;
}

export interface ScheduleItem {
  time: string;
  task: string;
  done?: boolean;
}

export interface CalendarEvent {
  date: string;
  title: string;
}

// Widget-specific config types
export interface ClockConfig {
  format24: boolean;
  showSeconds: boolean;
  themeColor?: string;
  fontFamily?: string;
  clockStyle?: string;
  glow?: boolean;
}

export interface TimerConfig {
  duration: number;
  sound: boolean;
}

export interface StopwatchConfig {
  themeColor?: string;
  fontFamily?: string;
  showLaps?: boolean;
  scaleMultiplier?: number;
}

export interface TrafficConfig {
  active?: string;
}

export interface TextConfig {
  content: string;
  bgColor: string;
  fontSize: number;
}

export interface ChecklistConfig {
  items: ChecklistItem[];
  scaleMultiplier?: number;
}

export interface RandomConfig {
  firstNames: string;
  lastNames: string;
  mode: string;
  visualStyle?: string;
  groupSize?: number;
  lastResult?: string | string[] | string[][] | null;
  soundEnabled?: boolean;
  remainingStudents?: string[];
}

export interface DiceConfig {
  count: number;
}

export interface SoundConfig {
  sensitivity: number;
  orientation?: 'horizontal' | 'vertical';
  style?: 'bar' | 'line';
}

export interface DrawingConfig {
  mode: 'window' | 'overlay';
  paths: Path[];
  color?: string;
  width?: number;
}

export interface QRConfig {
  url: string;
}

export interface EmbedConfig {
  url: string;
  mode?: string;
  html?: string;
}

export interface PollConfig {
  question: string;
  options: PollOption[];
}

export interface WebcamConfig {
  // Record<string, never> ensures an empty object
  _dummy?: never;
}

export interface ScoreboardConfig {
  scoreA: number;
  scoreB: number;
  teamA: string;
  teamB: string;
}

export interface WorkSymbolsConfig {
  voice: string;
  routine: string;
}

export interface WeatherConfig {
  temp: number;
  condition: string;
  isAuto?: boolean;
  locationName?: string;
  lastSync?: number | null;
  city?: string;
}

export interface ScheduleConfig {
  items: ScheduleItem[];
}

export interface CalendarConfig {
  events: CalendarEvent[];
}

export interface LunchCountConfig {
  firstNames: string;
  lastNames: string;
  assignments: Record<string, string>;
  recipient: string;
}

export type ClassesConfig = Record<string, never>;

// Union of all widget configs
export type WidgetConfig =
  | ClockConfig
  | TimerConfig
  | StopwatchConfig
  | TrafficConfig
  | TextConfig
  | ChecklistConfig
  | RandomConfig
  | DiceConfig
  | SoundConfig
  | DrawingConfig
  | QRConfig
  | EmbedConfig
  | PollConfig
  | WebcamConfig
  | ScoreboardConfig
  | WorkSymbolsConfig
  | WeatherConfig
  | ScheduleConfig
  | CalendarConfig
  | LunchCountConfig
  | ClassesConfig;

// Helper type to get config type for a specific widget
export type ConfigForWidget<T extends WidgetType> = T extends 'clock'
  ? ClockConfig
  : T extends 'timer'
    ? TimerConfig
    : T extends 'stopwatch'
      ? StopwatchConfig
      : T extends 'traffic'
        ? TrafficConfig
        : T extends 'text'
          ? TextConfig
          : T extends 'checklist'
            ? ChecklistConfig
            : T extends 'random'
              ? RandomConfig
              : T extends 'dice'
                ? DiceConfig
                : T extends 'sound'
                  ? SoundConfig
                  : T extends 'drawing'
                    ? DrawingConfig
                    : T extends 'qr'
                      ? QRConfig
                      : T extends 'embed'
                        ? EmbedConfig
                        : T extends 'poll'
                          ? PollConfig
                          : T extends 'webcam'
                            ? WebcamConfig
                            : T extends 'scoreboard'
                              ? ScoreboardConfig
                              : T extends 'workSymbols'
                                ? WorkSymbolsConfig
                                : T extends 'weather'
                                  ? WeatherConfig
                                  : T extends 'schedule'
                                    ? ScheduleConfig
                                    : T extends 'calendar'
                                      ? CalendarConfig
                                      : T extends 'lunchCount'
                                        ? LunchCountConfig
                                        : T extends 'classes'
                                          ? ClassesConfig
                                          : never;

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
  customTitle?: string;
  isLive?: boolean;
  config: WidgetConfig;
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
  icon: React.ComponentType<{ className?: string }>;
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
  {
    type: 'classes',
    icon: Users,
    label: 'Class',
    color: 'bg-indigo-600',
  },
];

export type AccessLevel = 'admin' | 'beta' | 'public';

/**
 * Grade level categories for widget relevance filtering.
 * Used to help teachers discover age-appropriate widgets without restricting access.
 *
 * Granular ranges (internal values → UI labels):
 * - 'k-2'  → "K-2": Kindergarten through 2nd grade
 * - '3-5'  → "3-5": 3rd through 5th grade
 * - '6-8'  → "6-8": 6th through 8th grade (middle school)
 * - '9-12' → "9-12": 9th through 12th grade (high school)
 * - 'universal' → "Universal": Appropriate for all grades
 *
 * Together with the 'all' option in {@link GradeFilter}, this corresponds to the
 * UI/metadata filter options: "K-2, 3-5, 6-8, 9-12, Universal, All".
 */
export type GradeLevel = 'k-2' | '3-5' | '6-8' | '9-12';

/**
 * Grade filter values including the 'all' ("All") option used in the UI.
 * Combined with {@link GradeLevel}, this yields: "K-2, 3-5, 6-8, 9-12, All".
 * Used for filtering widgets in the sidebar.
 */
export type GradeFilter = GradeLevel | 'all';

/**
 * Feature permission settings for controlling widget access across different user groups.
 *
 * @remarks
 * - If no permission record exists for a widget, it defaults to public access (all authenticated users)
 * - When `enabled` is false, the widget is completely disabled for all users including admins
 * - Access levels:
 *   - 'admin': Only administrators can access (alpha testing)
 *   - 'beta': Only users in the betaUsers email list can access (beta testing)
 *   - 'public': All authenticated users can access (general availability)
 */
export interface FeaturePermission {
  /** The type of widget this permission applies to */
  widgetType: WidgetType;
  /** The access level determining who can use this widget */
  accessLevel: AccessLevel;
  /** Array of email addresses for beta testing access (only used when accessLevel is 'beta') */
  betaUsers: string[];
  /** When false, disables the widget for everyone including admins */
  enabled: boolean;
  /** Optional override for grade levels. If set, this takes precedence over the static configuration. */
  gradeLevels?: GradeLevel[];
  /** Optional override for the widget's display name. */
  displayName?: string;
}

export interface BackgroundPreset {
  id: string;
  url: string;
  label: string;
  active: boolean; // Whether it shows up for users
  accessLevel: AccessLevel; // Who can see it
  betaUsers: string[]; // Specific users if beta
  createdAt: number;
}
