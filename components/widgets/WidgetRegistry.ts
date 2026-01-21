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

// Helper for named exports

function lazyNamed(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importFactory: () => Promise<any>,
  importName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): React.LazyExoticComponent<React.ComponentType<any>> {
  return React.lazy(
    () =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      importFactory().then((module) => ({ default: module[importName] }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as React.LazyExoticComponent<React.ComponentType<any>>;
}

// Widget Imports
const ClockWidget = lazyNamed(() => import('./ClockWidget'), 'ClockWidget');
const ClockSettings = lazyNamed(() => import('./ClockWidget'), 'ClockSettings');

const TimeToolWidget = lazyNamed(
  () => import('./TimeToolWidget'),
  'TimeToolWidget'
);
const TimeToolSettings = lazyNamed(
  () => import('./TimeToolWidget'),
  'TimeToolSettings'
);

const TrafficLightWidget = lazyNamed(
  () => import('./TrafficLightWidget'),
  'TrafficLightWidget'
);

const TextWidget = lazyNamed(() => import('./TextWidget'), 'TextWidget');
const TextSettings = lazyNamed(() => import('./TextWidget'), 'TextSettings');

const SoundWidget = lazyNamed(() => import('./SoundWidget'), 'SoundWidget');
const SoundSettings = lazyNamed(() => import('./SoundWidget'), 'SoundSettings');

const WebcamWidget = lazyNamed(() => import('./WebcamWidget'), 'WebcamWidget');
const WebcamSettings = lazyNamed(
  () => import('./WebcamWidget'),
  'WebcamSettings'
);

const EmbedWidget = lazyNamed(() => import('./EmbedWidget'), 'EmbedWidget');
const EmbedSettings = lazyNamed(() => import('./EmbedWidget'), 'EmbedSettings');

const ChecklistWidget = lazyNamed(
  () => import('./ChecklistWidget'),
  'ChecklistWidget'
);
const ChecklistSettings = lazyNamed(
  () => import('./ChecklistWidget'),
  'ChecklistSettings'
);

const RandomWidget = lazyNamed(
  () => import('./random/RandomWidget'),
  'RandomWidget'
);
const RandomSettings = lazyNamed(
  () => import('./random/RandomSettings'),
  'RandomSettings'
);

const DiceWidget = lazyNamed(() => import('./DiceWidget'), 'DiceWidget');
const DiceSettings = lazyNamed(() => import('./DiceWidget'), 'DiceSettings');

const DrawingWidget = lazyNamed(
  () => import('./DrawingWidget'),
  'DrawingWidget'
);
const DrawingSettings = lazyNamed(
  () => import('./DrawingWidget'),
  'DrawingSettings'
);

const QRWidget = lazyNamed(() => import('./QRWidget'), 'QRWidget');
const QRSettings = lazyNamed(() => import('./QRWidget'), 'QRSettings');

const ScoreboardWidget = lazyNamed(
  () => import('./ScoreboardWidget'),
  'ScoreboardWidget'
);
const ScoreboardSettings = lazyNamed(
  () => import('./ScoreboardWidget'),
  'ScoreboardSettings'
);

const WorkSymbolsWidget = lazyNamed(
  () => import('./WorkSymbolsWidget'),
  'WorkSymbolsWidget'
);

const PollWidget = lazyNamed(() => import('./PollWidget'), 'PollWidget');
const PollSettings = lazyNamed(() => import('./PollWidget'), 'PollSettings');

const WeatherWidget = lazyNamed(
  () => import('./WeatherWidget'),
  'WeatherWidget'
);
const WeatherSettings = lazyNamed(
  () => import('./WeatherWidget'),
  'WeatherSettings'
);

const ScheduleWidget = lazyNamed(
  () => import('./ScheduleWidget'),
  'ScheduleWidget'
);

const CalendarWidget = lazyNamed(
  () => import('./CalendarWidget'),
  'CalendarWidget'
);
const CalendarSettings = lazyNamed(
  () => import('./CalendarWidget'),
  'CalendarSettings'
);

const LunchCountWidget = lazyNamed(
  () => import('./LunchCountWidget'),
  'LunchCountWidget'
);
const LunchCountSettings = lazyNamed(
  () => import('./LunchCountWidget'),
  'LunchCountSettings'
);

const ClassesWidget = React.lazy(() => import('./ClassesWidget'));

const InstructionalRoutinesWidget = lazyNamed(
  () => import('./InstructionalRoutinesWidget'),
  'InstructionalRoutinesWidget'
);
const InstructionalRoutinesSettings = lazyNamed(
  () => import('./InstructionalRoutinesWidget'),
  'InstructionalRoutinesSettings'
);

const MiniAppWidget = lazyNamed(
  () => import('./MiniAppWidget'),
  'MiniAppWidget'
);

const MaterialsWidget = lazyNamed(
  () => import('./MaterialsWidget'),
  'MaterialsWidget'
);
const MaterialsSettings = lazyNamed(
  () => import('./MaterialsWidget'),
  'MaterialsSettings'
);

const StickerBookWidget = lazyNamed(
  () => import('./stickers/StickerBookWidget'),
  'StickerBookWidget'
);

const StickerLibraryWidget = lazyNamed(
  () => import('./StickerLibraryWidget'),
  'StickerLibraryWidget'
);

const SeatingChartWidget = lazyNamed(
  () => import('./SeatingChartWidget'),
  'SeatingChartWidget'
);
const SeatingChartSettings = lazyNamed(
  () => import('./SeatingChartSettings'),
  'SeatingChartSettings'
);

// Fallback Settings
const DefaultSettings = lazyNamed(
  () => import('./FallbackSettings'),
  'DefaultSettings'
);
const MiniAppSettings = lazyNamed(
  () => import('./FallbackSettings'),
  'MiniAppSettings'
);
const StickerSettings = lazyNamed(
  () => import('./FallbackSettings'),
  'StickerSettings'
);
const StickerLibrarySettings = lazyNamed(
  () => import('./FallbackSettings'),
  'StickerLibrarySettings'
);

// Component type definitions to ensure type safety
type WidgetComponent = React.ComponentType<{
  widget: WidgetData;
  isStudentView?: boolean;
}>;

type SettingsComponent = React.ComponentType<{
  widget: WidgetData;
}>;

// We cast the lazy components to WidgetComponent because LazyExoticComponent
// is compatible with ComponentType in usage.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asWidget = (C: any): WidgetComponent => C as WidgetComponent;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asSettings = (C: any): SettingsComponent => C as SettingsComponent;

export const WIDGET_COMPONENTS: Partial<Record<WidgetType, WidgetComponent>> = {
  clock: asWidget(ClockWidget),
  'time-tool': asWidget(TimeToolWidget),
  traffic: asWidget(TrafficLightWidget),
  text: asWidget(TextWidget),
  checklist: asWidget(ChecklistWidget),
  random: asWidget(RandomWidget),
  dice: asWidget(DiceWidget),
  sound: asWidget(SoundWidget),
  webcam: asWidget(WebcamWidget),
  embed: asWidget(EmbedWidget),
  drawing: asWidget(DrawingWidget),
  qr: asWidget(QRWidget),
  scoreboard: asWidget(ScoreboardWidget),
  workSymbols: asWidget(WorkSymbolsWidget),
  poll: asWidget(PollWidget),
  weather: asWidget(WeatherWidget),
  schedule: asWidget(ScheduleWidget),
  calendar: asWidget(CalendarWidget),
  lunchCount: asWidget(LunchCountWidget),
  classes: asWidget(ClassesWidget),
  instructionalRoutines: asWidget(InstructionalRoutinesWidget),
  miniApp: asWidget(MiniAppWidget),
  materials: asWidget(MaterialsWidget),
  stickers: asWidget(StickerBookWidget),
  'sticker-library': asWidget(StickerLibraryWidget),
  'seating-chart': asWidget(SeatingChartWidget),
};

export const WIDGET_SETTINGS_COMPONENTS: Partial<
  Record<WidgetType, SettingsComponent>
> = {
  clock: asSettings(ClockSettings),
  text: asSettings(TextSettings),
  checklist: asSettings(ChecklistSettings),
  random: asSettings(RandomSettings),
  dice: asSettings(DiceSettings),
  sound: asSettings(SoundSettings),
  embed: asSettings(EmbedSettings),
  drawing: asSettings(DrawingSettings),
  qr: asSettings(QRSettings),
  scoreboard: asSettings(ScoreboardSettings),
  webcam: asSettings(WebcamSettings),
  calendar: asSettings(CalendarSettings),
  weather: asSettings(WeatherSettings),
  lunchCount: asSettings(LunchCountSettings),
  poll: asSettings(PollSettings),
  instructionalRoutines: asSettings(InstructionalRoutinesSettings),
  materials: asSettings(MaterialsSettings),
  miniApp: asSettings(MiniAppSettings),
  stickers: asSettings(StickerSettings),
  'sticker-library': asSettings(StickerLibrarySettings),
  'time-tool': asSettings(TimeToolSettings),
  'seating-chart': asSettings(SeatingChartSettings),
  traffic: asSettings(DefaultSettings),
  workSymbols: asSettings(DefaultSettings),
  schedule: asSettings(DefaultSettings),
  classes: asSettings(DefaultSettings),
};
