import React from 'react';
import { WidgetData } from '@/types';
import { ClockWidget, ClockSettings } from './ClockWidget';
import { TimeToolWidget } from './TimeToolWidget';
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
import { PollWidget } from './PollWidget';
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

export const WIDGET_COMPONENTS: Record<string, WidgetComponent> = {
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
};

export const WIDGET_SETTINGS_COMPONENTS: Record<string, SettingsComponent> = {
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
  instructionalRoutines: InstructionalRoutinesSettings,
  materials: MaterialsSettings,
  miniApp: MiniAppSettings,
  stickers: StickerSettings,
  'sticker-library': StickerLibrarySettings,
  'time-tool': DefaultSettings, // TimeTool doesn't seem to have settings exported in the switch
  traffic: DefaultSettings,
  poll: DefaultSettings,
  workSymbols: DefaultSettings,
  schedule: DefaultSettings,
  classes: DefaultSettings,
};
