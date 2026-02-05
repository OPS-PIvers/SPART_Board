/**
 * Widget Registry
 *
 * This file serves as the central directory for all widgets in the application.
 * It maps widget types (enums) to their respective React components for both
 * the main widget view and the settings panel.
 */

import React, { lazy } from 'react';
import {
  WidgetData,
  WidgetType,
  ScalingConfig,
  WidgetComponentProps,
} from '@/types';

// Component type definitions to ensure type safety
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
  lunchCount: lazyNamed(() => import('./LunchCount'), 'LunchCountWidget'),
  classes: lazy(() => import('./ClassesWidget')), // Default export
  instructionalRoutines: lazyNamed(
    () => import('./InstructionalRoutines/Widget'),
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
  smartNotebook: lazyNamed(
    () => import('./SmartNotebookWidget'),
    'SmartNotebookWidget'
  ),
  recessGear: lazyNamed(() => import('./RecessGearWidget'), 'RecessGearWidget'),
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
  lunchCount: lazyNamed(() => import('./LunchCount'), 'LunchCountSettings'),
  poll: lazyNamed(() => import('./PollWidget'), 'PollSettings'),
  instructionalRoutines: lazyNamed(
    () => import('./InstructionalRoutines/Settings'),
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
  smartNotebook: DefaultSettings,
  traffic: DefaultSettings,
  workSymbols: lazyNamed(
    () => import('./WorkSymbolsWidget'),
    'WorkSymbolsSettings'
  ),
  schedule: lazyNamed(() => import('./ScheduleWidget'), 'ScheduleSettings'),
  classes: DefaultSettings,
  recessGear: lazyNamed(
    () => import('./RecessGearWidget'),
    'RecessGearSettings'
  ),
};

export const DEFAULT_SCALING_CONFIG: ScalingConfig = {
  baseWidth: 300,
  baseHeight: 200,
  canSpread: true,
};

export const WIDGET_SCALING_CONFIG: Record<WidgetType, ScalingConfig> = {
  clock: {
    baseWidth: 280,
    baseHeight: 140,
    canSpread: true,
    skipScaling: true,
  },
  'time-tool': {
    baseWidth: 420,
    baseHeight: 400,
    canSpread: true,
    skipScaling: true,
  },
  traffic: {
    baseWidth: 120,
    baseHeight: 320,
    canSpread: false,
    skipScaling: true,
  },
  text: { baseWidth: 300, baseHeight: 250, canSpread: true, skipScaling: true },
  checklist: {
    baseWidth: 280,
    baseHeight: 300,
    canSpread: true,
  },
  random: {
    baseWidth: 300,
    baseHeight: 320,
    canSpread: true,
  },
  dice: {
    baseWidth: 240,
    baseHeight: 240,
    canSpread: true,
    skipScaling: true,
  },
  sound: {
    baseWidth: 300,
    baseHeight: 300,
    canSpread: true,
    skipScaling: true,
  },
  webcam: {
    baseWidth: 400,
    baseHeight: 300,
    canSpread: true,
    skipScaling: true,
  },
  embed: {
    baseWidth: 480,
    baseHeight: 350,
    canSpread: true,
    skipScaling: true,
  },
  drawing: {
    baseWidth: 400,
    baseHeight: 350,
    canSpread: true,
  },
  qr: { baseWidth: 200, baseHeight: 250, canSpread: true, skipScaling: true },
  scoreboard: {
    baseWidth: 320,
    baseHeight: 200,
    canSpread: true,
  },
  workSymbols: {
    baseWidth: 320,
    baseHeight: 350,
    canSpread: true,
  },
  poll: { baseWidth: 300, baseHeight: 250, canSpread: true },
  weather: {
    baseWidth: 250,
    baseHeight: 280,
    canSpread: true,
  },
  schedule: {
    baseWidth: 300,
    baseHeight: 350,
    canSpread: true,
  },
  calendar: {
    baseWidth: 300,
    baseHeight: 350,
    canSpread: true,
  },
  lunchCount: {
    baseWidth: 500,
    baseHeight: 400,
    canSpread: true,
  },
  classes: {
    baseWidth: 600,
    baseHeight: 500,
    canSpread: true,
  },
  instructionalRoutines: {
    baseWidth: 400,
    baseHeight: 480,
    canSpread: true,
  },
  miniApp: {
    baseWidth: 500,
    baseHeight: 600,
    canSpread: true,
  },
  materials: {
    baseWidth: 340,
    baseHeight: 340,
    canSpread: true,
  },
  stickers: {
    baseWidth: 600,
    baseHeight: 500,
    canSpread: true,
  },
  sticker: { baseWidth: 200, baseHeight: 200, canSpread: false },
  'seating-chart': {
    baseWidth: 600,
    baseHeight: 500,
    canSpread: true,
  },
  catalyst: {
    baseWidth: 320,
    baseHeight: 400,
    canSpread: true,
  },
  'catalyst-instruction': {
    baseWidth: 280,
    baseHeight: 350,
    canSpread: true,
  },
  'catalyst-visual': {
    baseWidth: 600,
    baseHeight: 400,
    canSpread: true,
  },
  smartNotebook: {
    baseWidth: 600,
    baseHeight: 500,
    canSpread: true,
  },
  recessGear: {
    baseWidth: 250,
    baseHeight: 280,
    canSpread: true,
    skipScaling: true,
  },
};
