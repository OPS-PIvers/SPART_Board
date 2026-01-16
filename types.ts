export type WidgetType =
  | 'clock'
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
  | 'classes'
  | 'instructionalRoutines'
  | 'time-tool'
  | 'miniApp'
  | 'materials'
  | 'stickers'
  | 'sticker'
  | 'sticker-library';

// --- ROSTER SYSTEM TYPES ---

export interface ClassLinkClass {
  sourcedId: string;
  title: string;
  classCode?: string;
  subject?: string;
}

export interface ClassLinkStudent {
  sourcedId: string;
  givenName: string;
  familyName: string;
  email: string;
}

export interface ClassLinkData {
  classes: ClassLinkClass[];
  studentsByClass: Record<string, ClassLinkStudent[]>;
}

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
  background?: string; // Teacher's current dashboard background
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

export interface RoutineStep {
  id: string;
  text: string;
  icon?: string;
  color?: string;
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
  sound: boolean; // This is the completion sound toggle
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
  mode: 'manual' | 'roster';
  rosterMode?: 'class' | 'custom';
  firstNames?: string;
  lastNames?: string;
  completedNames?: string[]; // Tracks IDs or Names checked in roster mode
}

export interface RandomGroup {
  names: string[];
}

export interface RandomConfig {
  firstNames: string;
  lastNames: string;
  mode: string;
  visualStyle?: string;
  groupSize?: number;
  lastResult?: string | string[] | RandomGroup[] | null;
  soundEnabled?: boolean;
  remainingStudents?: string[];
  rosterMode?: 'class' | 'custom';
}

export interface DiceConfig {
  count: number;
}

export interface SoundConfig {
  sensitivity: number;
  visual: 'thermometer' | 'speedometer' | 'line' | 'balls';
}

export interface DrawingConfig {
  mode: 'window' | 'overlay';
  paths: Path[];
  color?: string;
  width?: number;
  customColors?: string[];
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
  deviceId?: string;
  zoomLevel?: number;
  isMirrored?: boolean;
}

export interface ScoreboardConfig {
  scoreA: number;
  scoreB: number;
  teamA: string;
  teamB: string;
}

export interface WorkSymbolsConfig {
  voiceLevel: number | null; // 0, 1, 2, 3, or 4
  workMode: 'individual' | 'partner' | 'group' | null;
  instructionalRoutine?: string; // Legacy/K-8
  activeRoutines?: string[]; // New: 9-12 Multi-select
}

export interface WeatherConfig {
  temp: number;
  condition: string;
  isAuto?: boolean;
  locationName?: string;
  lastSync?: number | null;
  city?: string;
  source?: 'openweather' | 'earth_networks';
}

export interface ScheduleConfig {
  items: ScheduleItem[];
}

export interface CalendarConfig {
  events: CalendarEvent[];
}

export interface LunchMenuDay {
  hotLunch: string;
  bentoBox: string;
  date: string; // ISO String
}

export interface LunchCountConfig {
  schoolSite: 'schumann-elementary' | 'orono-intermediate-school';
  cachedMenu?: LunchMenuDay | null;
  lastSyncDate?: string | null;
  isManualMode: boolean;
  manualHotLunch: string;
  manualBentoBox: string;
  roster: string[]; // List of student names
  assignments: Record<string, 'hot' | 'bento' | 'home' | null>;
  recipient?: string;
  syncError?: string | null; // To display E-SYNC-404 etc.
  rosterMode?: 'class' | 'custom';
}

export type ClassesConfig = Record<string, never>;

export interface InstructionalRoutinesConfig {
  selectedRoutineId: string | null;
  customSteps: RoutineStep[];
  favorites: string[];
  scaleMultiplier: number;
}

export interface TimeToolConfig {
  mode: 'timer' | 'stopwatch';
  visualType: 'digital' | 'visual';
  theme: 'light' | 'dark' | 'glass';
  duration: number; // in seconds
  elapsedTime: number; // in seconds
  isRunning: boolean;
  startTime?: number | null; // timestamp when last started (Date.now())
  selectedSound: 'Chime' | 'Blip' | 'Gong' | 'Alert';
}

// 1. Define the Data Model for a Mini App
export interface MiniAppItem {
  id: string;
  title: string;
  html: string;
  createdAt: number;
}

// 2. Define the Widget Configuration
export interface MiniAppConfig {
  activeApp: MiniAppItem | null;
}

export interface MaterialsConfig {
  selectedItems: string[];
  activeItems: string[];
}

export interface StickerConfig {
  url?: string;
  icon?: string;
  color?: string;
  rotation?: number;
}

export type StickerLibraryConfig = {
  uploadedUrls?: string[];
};

export type StickerBookConfig = Record<string, never>;

// Union of all widget configs
export type WidgetConfig =
  | ClockConfig
  | TimerConfig
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
  | ClassesConfig
  | InstructionalRoutinesConfig
  | TimeToolConfig
  | MiniAppConfig
  | MaterialsConfig
  | StickerBookConfig
  | StickerConfig
  | StickerLibraryConfig;

// Helper type to get config type for a specific widget
export type ConfigForWidget<T extends WidgetType> = T extends 'clock'
  ? ClockConfig
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
                                      : T extends 'instructionalRoutines'
                                        ? InstructionalRoutinesConfig
                                        : T extends 'time-tool'
                                          ? TimeToolConfig
                                          : T extends 'miniApp'
                                            ? MiniAppConfig
                                            : T extends 'materials'
                                              ? MaterialsConfig
                                              : T extends 'stickers'
                                                ? StickerBookConfig
                                                : T extends 'sticker'
                                                  ? StickerConfig
                                                  : T extends 'sticker-library'
                                                    ? StickerLibraryConfig
                                                    : never;

export interface WidgetData {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  /** Width in grid units (dashboard) or pixels (student view) */
  w: number;
  /** Height in grid units (dashboard) or pixels (student view) */
  h: number;
  z: number;
  flipped: boolean;
  minimized?: boolean;
  maximized?: boolean;
  customTitle?: string | null;
  isLive?: boolean;
  transparency?: number;
  config: WidgetConfig;
}

export interface DockFolder {
  id: string;
  name: string;
  items: WidgetType[];
}

export type DockItem =
  | { type: 'tool'; toolType: WidgetType }
  | { type: 'folder'; folder: DockFolder };

export interface Dashboard {
  id: string;
  name: string;
  background: string;
  thumbnailUrl?: string;
  widgets: WidgetData[];
  createdAt: number;
  isDefault?: boolean;
  order?: number;
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
  /** Optional global configuration for the widget (e.g., API keys, target IDs). */
  config?: Record<string, unknown>;
}

export interface LunchCountGlobalConfig {
  googleSheetId?: string;
  submissionUrl?: string;
}

export interface BackgroundPreset {
  id: string;
  url: string;
  thumbnailUrl?: string;
  label: string;
  active: boolean; // Whether it shows up for users
  accessLevel: AccessLevel; // Who can see it
  betaUsers: string[]; // Specific users if beta
  createdAt: number;
}
