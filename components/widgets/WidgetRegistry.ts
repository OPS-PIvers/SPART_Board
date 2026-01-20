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
import { ClockWidget, ClockSettings } from './ClockWidget';
import { TimeToolWidget, TimeToolSettings } from './TimeToolWidget';
import { TrafficLightWidget } from './TrafficLightWidget';
import { TextWidget, TextSettings } from './TextWidget';
import { SoundWidget, SoundSettings } from './SoundWidget';
import { WebcamWidget, WebcamSettings } from './WebcamWidget';
import { EmbedWidget, EmbedSettings } from './EmbedWidget';
import { ChecklistWidget, ChecklistSettings } from './ChecklistWidget';
import { RandomWidget } from './random/RandomWidget';
import { RandomSettings } from './random/RandomSettings';
import { DiceWidget, DiceSettings } from './DiceWidget';
import { DrawingWidget, DrawingSettings } from './DrawingWidget';
import { QRWidget, QRSettings } from './QRWidget';
import { ScoreboardWidget, ScoreboardSettings } from './ScoreboardWidget';
import { WorkSymbolsWidget } from './WorkSymbolsWidget';
import { PollWidget, PollSettings } from './PollWidget';
import { WeatherWidget, WeatherSettings } from './WeatherWidget';
import { ScheduleWidget } from './ScheduleWidget';
import { CalendarWidget, CalendarSettings } from './CalendarWidget';
import { LunchCountWidget, LunchCountSettings } from './LunchCountWidget';
import ClassesWidget from './ClassesWidget';
import {
  InstructionalRoutinesWidget,
  InstructionalRoutinesSettings,
} from './InstructionalRoutinesWidget';
import { MiniAppWidget } from './MiniAppWidget';
import { MaterialsWidget, MaterialsSettings } from './MaterialsWidget';
import { StickerBookWidget } from './stickers/StickerBookWidget';
import { StickerLibraryWidget } from './StickerLibraryWidget';
import { SeatingChartWidget } from './SeatingChartWidget';
import { SeatingChartSettings } from './SeatingChartSettings';
import {
  DefaultSettings,
  MiniAppSettings,
  StickerSettings,
  StickerLibrarySettings,
} from './FallbackSettings';

// Component type definitions to ensure type safety
type WidgetComponent = React.ComponentType<{
  widget: WidgetData;
  isStudentView?: boolean;
}>;

type SettingsComponent = React.ComponentType<{
  widget: WidgetData;
}>;

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
