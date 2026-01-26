/**
 * Widget Registry
 *
 * This file serves as the central directory for all widgets in the application.
 * It maps widget types (enums) to their respective React components for both
 * the main widget view and the settings panel.
 */

import React, { lazy } from 'react';
import { WidgetData, WidgetType } from '@/types';

// Component type definitions to ensure type safety
type WidgetComponentProps = {
  widget: WidgetData;
  isStudentView?: boolean;
};

type SettingsComponentProps = {
  widget: WidgetData;
};

type WidgetComponent =
  | React.ComponentType<WidgetComponentProps>
  | React.LazyExoticComponent<React.ComponentType<WidgetComponentProps>>;
type SettingsComponent =
  | React.ComponentType<SettingsComponentProps>
  | React.LazyExoticComponent<React.ComponentType<SettingsComponentProps>>;

// Lazy load helper for named exports
const lazyNamed = (
  importFactory: () => Promise<Record<string, unknown>>,
  name: string
) => {
  return lazy(() =>
    importFactory().then((module) => ({
      default: module[name] as React.ComponentType<unknown>,
    }))
  );
};

// Fallback Settings (lazy loading for consistency)
const DefaultSettings = lazyNamed(
  () => import('./FallbackSettings'),
  'DefaultSettings'
);
const MiniAppSettings = lazyNamed(
  () => import('./FallbackSettings'),
  'MiniAppSettings'
);

export const WIDGET_COMPONENTS: Partial<Record<WidgetType, WidgetComponent>> = {
  clock: lazyNamed(() => import('./ClockWidget'), 'ClockWidget'),
  'time-tool': lazyNamed(() => import('./TimeToolWidget'), 'TimeToolWidget'),
  traffic: lazyNamed(
    () => import('./TrafficLightWidget'),
    'TrafficLightWidget'
  ),
  text: lazyNamed(() => import('./TextWidget'), 'TextWidget'),
  checklist: lazyNamed(() => import('./ChecklistWidget'), 'ChecklistWidget'),
  random: lazyNamed(() => import('./random/RandomWidget'), 'RandomWidget'),
  dice: lazyNamed(() => import('./DiceWidget'), 'DiceWidget'),
  sound: lazyNamed(() => import('./SoundWidget'), 'SoundWidget'),
  webcam: lazyNamed(() => import('./WebcamWidget'), 'WebcamWidget'),
  embed: lazyNamed(() => import('./EmbedWidget'), 'EmbedWidget'),
  drawing: lazyNamed(() => import('./DrawingWidget'), 'DrawingWidget'),
  qr: lazyNamed(() => import('./QRWidget'), 'QRWidget'),
  scoreboard: lazyNamed(() => import('./ScoreboardWidget'), 'ScoreboardWidget'),
  workSymbols: lazyNamed(
    () => import('./WorkSymbolsWidget'),
    'WorkSymbolsWidget'
  ),
  poll: lazyNamed(() => import('./PollWidget'), 'PollWidget'),
  weather: lazyNamed(() => import('./WeatherWidget'), 'WeatherWidget'),
  schedule: lazyNamed(() => import('./ScheduleWidget'), 'ScheduleWidget'),
  calendar: lazyNamed(() => import('./CalendarWidget'), 'CalendarWidget'),
  lunchCount: lazyNamed(() => import('./LunchCountWidget'), 'LunchCountWidget'),
  classes: lazy(() => import('./ClassesWidget')), // Default export
  instructionalRoutines: lazyNamed(
    () => import('./instructional-routines'),
    'InstructionalRoutinesWidget'
  ),
  miniApp: lazyNamed(() => import('./MiniAppWidget'), 'MiniAppWidget'),
  materials: lazyNamed(() => import('./MaterialsWidget'), 'MaterialsWidget'),
  stickers: lazyNamed(
    () => import('./stickers/StickerBookWidget'),
    'StickerBookWidget'
  ),
  'seating-chart': lazyNamed(
    () => import('./SeatingChartWidget'),
    'SeatingChartWidget'
  ),
  catalyst: lazyNamed(() => import('./CatalystWidget'), 'CatalystWidget'),
  'catalyst-instruction': lazyNamed(
    () => import('./CatalystInstructionWidget'),
    'CatalystInstructionWidget'
  ),
  'catalyst-visual': lazyNamed(
    () => import('./CatalystVisualWidget'),
    'CatalystVisualWidget'
  ),
};

export const WIDGET_SETTINGS_COMPONENTS: Partial<
  Record<WidgetType, SettingsComponent>
> = {
  clock: lazyNamed(() => import('./ClockWidget'), 'ClockSettings'),
  text: lazyNamed(() => import('./TextWidget'), 'TextSettings'),
  checklist: lazyNamed(() => import('./ChecklistWidget'), 'ChecklistSettings'),
  random: lazyNamed(() => import('./random/RandomSettings'), 'RandomSettings'),
  dice: lazyNamed(() => import('./DiceWidget'), 'DiceSettings'),
  sound: lazyNamed(() => import('./SoundWidget'), 'SoundSettings'),
  embed: lazyNamed(() => import('./EmbedWidget'), 'EmbedSettings'),
  drawing: lazyNamed(() => import('./DrawingWidget'), 'DrawingSettings'),
  qr: lazyNamed(() => import('./QRWidget'), 'QRSettings'),
  scoreboard: lazyNamed(
    () => import('./ScoreboardWidget'),
    'ScoreboardSettings'
  ),
  webcam: lazyNamed(() => import('./WebcamWidget'), 'WebcamSettings'),
  calendar: lazyNamed(() => import('./CalendarWidget'), 'CalendarSettings'),
  weather: lazyNamed(() => import('./WeatherWidget'), 'WeatherSettings'),
  lunchCount: lazyNamed(
    () => import('./LunchCountWidget'),
    'LunchCountSettings'
  ),
  poll: lazyNamed(() => import('./PollWidget'), 'PollSettings'),
  instructionalRoutines: lazyNamed(
    () => import('./instructional-routines'),
    'InstructionalRoutinesSettings'
  ),
  materials: lazyNamed(() => import('./MaterialsWidget'), 'MaterialsSettings'),
  miniApp: MiniAppSettings,
  'time-tool': lazyNamed(() => import('./TimeToolWidget'), 'TimeToolSettings'),
  'seating-chart': lazyNamed(
    () => import('./SeatingChartSettings'),
    'SeatingChartSettings'
  ),
  catalyst: lazyNamed(() => import('./CatalystWidget'), 'CatalystSettings'),
  'catalyst-instruction': lazyNamed(
    () => import('./CatalystInstructionWidget'),
    'CatalystInstructionSettings'
  ),
  'catalyst-visual': lazyNamed(
    () => import('./CatalystVisualWidget'),
    'CatalystVisualSettings'
  ),
  traffic: DefaultSettings,
  workSymbols: DefaultSettings,
  schedule: lazyNamed(() => import('./ScheduleWidget'), 'ScheduleSettings'),
  classes: DefaultSettings,
};
