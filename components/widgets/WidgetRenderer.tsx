import React from 'react';
import { WidgetData } from '../../types';
import { DraggableWindow } from '../common/DraggableWindow';
import { ClockWidget, ClockSettings } from './ClockWidget';
import { TimerWidget, TimerSettings } from './TimerWidget';
import { StopwatchWidget, StopwatchSettings } from './StopwatchWidget';
import { TrafficLightWidget } from './TrafficLightWidget';
import { TextWidget, TextSettings } from './TextWidget';
import { SoundWidget, SoundSettings } from './SoundWidget';
import { WebcamWidget } from './WebcamWidget';
import { EmbedWidget, EmbedSettings } from './EmbedWidget';
import { ChecklistWidget, ChecklistSettings } from './ChecklistWidget';
import { RandomWidget, RandomSettings } from './RandomWidget';
import { DiceWidget, DiceSettings } from './DiceWidget';
import { DrawingWidget, DrawingSettings } from './DrawingWidget';
import { QRWidget, QRSettings } from './QRWidget';
import { ScoreboardWidget } from './ScoreboardWidget';
import { WorkSymbolsWidget } from './WorkSymbolsWidget';
import { PollWidget } from './PollWidget';
import { WeatherWidget, WeatherSettings } from './WeatherWidget';
import { ScheduleWidget } from './ScheduleWidget';
import { CalendarWidget, CalendarSettings } from './CalendarWidget';
import { LunchCountWidget, LunchCountSettings } from './LunchCountWidget';

export const WidgetRenderer: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const getWidgetContent = () => {
    switch (widget.type) {
      case 'clock':
        return <ClockWidget widget={widget} />;
      case 'timer':
        return <TimerWidget widget={widget} />;
      case 'stopwatch':
        return <StopwatchWidget widget={widget} />;
      case 'traffic':
        return <TrafficLightWidget widget={widget} />;
      case 'text':
        return <TextWidget widget={widget} />;
      case 'checklist':
        return <ChecklistWidget widget={widget} />;
      case 'random':
        return <RandomWidget widget={widget} />;
      case 'dice':
        return <DiceWidget widget={widget} />;
      case 'sound':
        return <SoundWidget widget={widget} />;
      case 'webcam':
        return <WebcamWidget widget={widget} />;
      case 'embed':
        return <EmbedWidget widget={widget} />;
      case 'drawing':
        return <DrawingWidget widget={widget} />;
      case 'qr':
        return <QRWidget widget={widget} />;
      case 'scoreboard':
        return <ScoreboardWidget widget={widget} />;
      case 'workSymbols':
        return <WorkSymbolsWidget widget={widget} />;
      case 'poll':
        return <PollWidget widget={widget} />;
      case 'weather':
        return <WeatherWidget widget={widget} />;
      case 'schedule':
        return <ScheduleWidget widget={widget} />;
      case 'calendar':
        return <CalendarWidget widget={widget} />;
      case 'lunchCount':
        return <LunchCountWidget widget={widget} />;
      default:
        return (
          <div className="p-4 text-center text-slate-400 text-sm">
            Widget under construction
          </div>
        );
    }
  };

  const getWidgetSettings = () => {
    switch (widget.type) {
      case 'clock':
        return <ClockSettings widget={widget} />;
      case 'timer':
        return <TimerSettings widget={widget} />;
      case 'stopwatch':
        return <StopwatchSettings widget={widget} />;
      case 'text':
        return <TextSettings widget={widget} />;
      case 'checklist':
        return <ChecklistSettings widget={widget} />;
      case 'random':
        return <RandomSettings widget={widget} />;
      case 'dice':
        return <DiceSettings widget={widget} />;
      case 'sound':
        return <SoundSettings widget={widget} />;
      case 'embed':
        return <EmbedSettings widget={widget} />;
      case 'drawing':
        return <DrawingSettings widget={widget} />;
      case 'qr':
        return <QRSettings widget={widget} />;
      case 'calendar':
        return <CalendarSettings widget={widget} />;
      case 'weather':
        return <WeatherSettings widget={widget} />;
      case 'lunchCount':
        return <LunchCountSettings widget={widget} />;
      default:
        return (
          <div className="text-slate-500 italic text-sm">
            Standard settings available.
          </div>
        );
    }
  };

  const getTitle = () => {
    if (widget.type === 'sound') return 'Noise Meter';
    if (widget.type === 'checklist') return 'Task List';
    if (widget.type === 'random') return 'Selector';
    if (widget.type === 'workSymbols') return 'Expectations';
    if (widget.type === 'calendar') return 'Class Events';
    if (widget.type === 'lunchCount') return 'Lunch Orders';
    return widget.type.charAt(0).toUpperCase() + widget.type.slice(1);
  };

  const isDrawingOverlay =
    widget.type === 'drawing' && widget.config.mode === 'overlay';
  const customStyle: React.CSSProperties = isDrawingOverlay
    ? { zIndex: 9995 }
    : {};

  return (
    <DraggableWindow
      widget={widget}
      title={getTitle()}
      settings={getWidgetSettings()}
      style={customStyle}
    >
      {getWidgetContent()}
    </DraggableWindow>
  );
};
