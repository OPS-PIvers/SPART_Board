/**
 * Widget Registry
 *
 * This file serves as the central directory for all widgets in the application.
 * It maps widget types (enums) to their respective React components for both
 * the main widget view and the settings panel.
 *
 * The Registry Pattern is used here to:
 * 1. Decouple the WidgetRenderer from specific widget implementations.
 * 2. Adhere to the Open/Closed Principle - adding a new widget only requires
 *    registering it here, not modifying the renderer logic.
 * 3. Provide a single source of truth for available widgets.
 *
 * HOW TO ADD A NEW WIDGET:
 * 1. Import your WidgetComponent and SettingsComponent.
 * 2. Add the mapping to WIDGET_COMPONENTS using the WidgetType enum key.
 * 3. Add the mapping to WIDGET_SETTINGS_COMPONENTS.
 *
 * NOTE: If your widget does not have a custom settings panel, use one of the
 * fallback components from './FallbackSettings' (e.g., DefaultSettings).
 */

import React from 'react';
import { WidgetData, WidgetType } from '@/types';

// Component type definitions to ensure type safety
type WidgetComponent = React.ComponentType<{
  widget: WidgetData;
  isStudentView?: boolean;
}>;

type SettingsComponent = React.ComponentType<{
  widget: WidgetData;
}>;

// Helper to lazy load named exports
function lazyNamed<T extends React.ComponentType<unknown>>(
  factory: () => Promise<Record<string, unknown>>,
  name: string
) {
  return React.lazy(() =>
    factory().then((module) => ({
      default: module[name] as T,
    }))
  );
}

// Lazy loaded components
const ClockWidget = lazyNamed<WidgetComponent>(
  () => import('./ClockWidget'),
  'ClockWidget'
);
const ClockSettings = lazyNamed<SettingsComponent>(
  () => import('./ClockWidget'),
  'ClockSettings'
);

const TimeToolWidget = lazyNamed<WidgetComponent>(
  () => import('./TimeToolWidget'),
  'TimeToolWidget'
);
const TimeToolSettings = lazyNamed<SettingsComponent>(
  () => import('./TimeToolWidget'),
  'TimeToolSettings'
);

const TrafficLightWidget = lazyNamed<WidgetComponent>(
  () => import('./TrafficLightWidget'),
  'TrafficLightWidget'
);

const TextWidget = lazyNamed<WidgetComponent>(
  () => import('./TextWidget'),
  'TextWidget'
);
const TextSettings = lazyNamed<SettingsComponent>(
  () => import('./TextWidget'),
  'TextSettings'
);

const SoundWidget = lazyNamed<WidgetComponent>(
  () => import('./SoundWidget'),
  'SoundWidget'
);
const SoundSettings = lazyNamed<SettingsComponent>(
  () => import('./SoundWidget'),
  'SoundSettings'
);

const WebcamWidget = lazyNamed<WidgetComponent>(
  () => import('./WebcamWidget'),
  'WebcamWidget'
);
const WebcamSettings = lazyNamed<SettingsComponent>(
  () => import('./WebcamWidget'),
  'WebcamSettings'
);

const EmbedWidget = lazyNamed<WidgetComponent>(
  () => import('./EmbedWidget'),
  'EmbedWidget'
);
const EmbedSettings = lazyNamed<SettingsComponent>(
  () => import('./EmbedWidget'),
  'EmbedSettings'
);

const ChecklistWidget = lazyNamed<WidgetComponent>(
  () => import('./ChecklistWidget'),
  'ChecklistWidget'
);
const ChecklistSettings = lazyNamed<SettingsComponent>(
  () => import('./ChecklistWidget'),
  'ChecklistSettings'
);

const RandomWidget = lazyNamed<WidgetComponent>(
  () => import('./random/RandomWidget'),
  'RandomWidget'
);
const RandomSettings = lazyNamed<SettingsComponent>(
  () => import('./random/RandomSettings'),
  'RandomSettings'
);

const DiceWidget = lazyNamed<WidgetComponent>(
  () => import('./DiceWidget'),
  'DiceWidget'
);
const DiceSettings = lazyNamed<SettingsComponent>(
  () => import('./DiceWidget'),
  'DiceSettings'
);

const DrawingWidget = lazyNamed<WidgetComponent>(
  () => import('./DrawingWidget'),
  'DrawingWidget'
);
const DrawingSettings = lazyNamed<SettingsComponent>(
  () => import('./DrawingWidget'),
  'DrawingSettings'
);

const QRWidget = lazyNamed<WidgetComponent>(
  () => import('./QRWidget'),
  'QRWidget'
);
const QRSettings = lazyNamed<SettingsComponent>(
  () => import('./QRWidget'),
  'QRSettings'
);

const ScoreboardWidget = lazyNamed<WidgetComponent>(
  () => import('./ScoreboardWidget'),
  'ScoreboardWidget'
);
const ScoreboardSettings = lazyNamed<SettingsComponent>(
  () => import('./ScoreboardWidget'),
  'ScoreboardSettings'
);

const WorkSymbolsWidget = lazyNamed<WidgetComponent>(
  () => import('./WorkSymbolsWidget'),
  'WorkSymbolsWidget'
);

const PollWidget = lazyNamed<WidgetComponent>(
  () => import('./PollWidget'),
  'PollWidget'
);
const PollSettings = lazyNamed<SettingsComponent>(
  () => import('./PollWidget'),
  'PollSettings'
);

const WeatherWidget = lazyNamed<WidgetComponent>(
  () => import('./WeatherWidget'),
  'WeatherWidget'
);
const WeatherSettings = lazyNamed<SettingsComponent>(
  () => import('./WeatherWidget'),
  'WeatherSettings'
);

const ScheduleWidget = lazyNamed<WidgetComponent>(
  () => import('./ScheduleWidget'),
  'ScheduleWidget'
);

const CalendarWidget = lazyNamed<WidgetComponent>(
  () => import('./CalendarWidget'),
  'CalendarWidget'
);
const CalendarSettings = lazyNamed<SettingsComponent>(
  () => import('./CalendarWidget'),
  'CalendarSettings'
);

const LunchCountWidget = lazyNamed<WidgetComponent>(
  () => import('./LunchCountWidget'),
  'LunchCountWidget'
);
const LunchCountSettings = lazyNamed<SettingsComponent>(
  () => import('./LunchCountWidget'),
  'LunchCountSettings'
);

// ClassesWidget is a default export
const ClassesWidget = React.lazy(() => import('./ClassesWidget'));

const InstructionalRoutinesWidget = lazyNamed<WidgetComponent>(
  () => import('./InstructionalRoutinesWidget'),
  'InstructionalRoutinesWidget'
);
const InstructionalRoutinesSettings = lazyNamed<SettingsComponent>(
  () => import('./InstructionalRoutinesWidget'),
  'InstructionalRoutinesSettings'
);

const MiniAppWidget = lazyNamed<WidgetComponent>(
  () => import('./MiniAppWidget'),
  'MiniAppWidget'
);

const MaterialsWidget = lazyNamed<WidgetComponent>(
  () => import('./MaterialsWidget'),
  'MaterialsWidget'
);
const MaterialsSettings = lazyNamed<SettingsComponent>(
  () => import('./MaterialsWidget'),
  'MaterialsSettings'
);

const StickerBookWidget = lazyNamed<WidgetComponent>(
  () => import('./stickers/StickerBookWidget'),
  'StickerBookWidget'
);

const StickerLibraryWidget = lazyNamed<WidgetComponent>(
  () => import('./StickerLibraryWidget'),
  'StickerLibraryWidget'
);

const SeatingChartWidget = lazyNamed<WidgetComponent>(
  () => import('./SeatingChartWidget'),
  'SeatingChartWidget'
);
const SeatingChartSettings = lazyNamed<SettingsComponent>(
  () => import('./SeatingChartSettings'),
  'SeatingChartSettings'
);

// Fallback Settings
const DefaultSettings = lazyNamed<SettingsComponent>(
  () => import('./FallbackSettings'),
  'DefaultSettings'
);
const MiniAppSettings = lazyNamed<SettingsComponent>(
  () => import('./FallbackSettings'),
  'MiniAppSettings'
);
const StickerSettings = lazyNamed<SettingsComponent>(
  () => import('./FallbackSettings'),
  'StickerSettings'
);
const StickerLibrarySettings = lazyNamed<SettingsComponent>(
  () => import('./FallbackSettings'),
  'StickerLibrarySettings'
);

export const WIDGET_COMPONENTS: Partial<Record<WidgetType, WidgetComponent>> = {
  clock: ClockWidget,
  'time-tool': TimeToolWidget,
  traffic: TrafficLightWidget,
  text: TextWidget,
  checklist: ChecklistWidget,
  random: RandomWidget,
  dice: DiceWidget,
  sound: SoundWidget,
  webcam: WebcamWidget,
  embed: EmbedWidget,
  drawing: DrawingWidget,
  qr: QRWidget,
  scoreboard: ScoreboardWidget,
  workSymbols: WorkSymbolsWidget,
  poll: PollWidget,
  weather: WeatherWidget,
  schedule: ScheduleWidget,
  calendar: CalendarWidget,
  lunchCount: LunchCountWidget,
  classes: ClassesWidget,
  instructionalRoutines: InstructionalRoutinesWidget,
  miniApp: MiniAppWidget,
  materials: MaterialsWidget,
  stickers: StickerBookWidget,
  'sticker-library': StickerLibraryWidget,
  'seating-chart': SeatingChartWidget,
};

export const WIDGET_SETTINGS_COMPONENTS: Partial<
  Record<WidgetType, SettingsComponent>
> = {
  clock: ClockSettings,
  text: TextSettings,
  checklist: ChecklistSettings,
  random: RandomSettings,
  dice: DiceSettings,
  sound: SoundSettings,
  embed: EmbedSettings,
  drawing: DrawingSettings,
  qr: QRSettings,
  scoreboard: ScoreboardSettings,
  webcam: WebcamSettings,
  calendar: CalendarSettings,
  weather: WeatherSettings,
  lunchCount: LunchCountSettings,
  poll: PollSettings,
  instructionalRoutines: InstructionalRoutinesSettings,
  materials: MaterialsSettings,
  miniApp: MiniAppSettings,
  stickers: StickerSettings,
  'sticker-library': StickerLibrarySettings,
  'time-tool': TimeToolSettings,
  'seating-chart': SeatingChartSettings,
  traffic: DefaultSettings,
  workSymbols: DefaultSettings,
  schedule: DefaultSettings,
  classes: DefaultSettings,
};
