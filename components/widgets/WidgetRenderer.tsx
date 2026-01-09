import React from 'react';
import { WidgetData, DrawingConfig } from '../../types';
import { DraggableWindow } from '../common/DraggableWindow';
import { useAuth } from '../../context/useAuth';
import { useLiveSession } from '../../hooks/useLiveSession';
import { LiveControl } from './LiveControl';
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
import ClassesWidget from './ClassesWidget';
import { getTitle } from '../../utils/widgetHelpers';

export const WidgetRenderer: React.FC<{
  widget: WidgetData;
  isStudentView?: boolean;
}> = ({ widget, isStudentView = false }) => {
  const { user } = useAuth();

  // Initialize the hook (only active if user exists)
  const {
    session,
    students,
    startSession,
    endSession,
    toggleFreezeStudent,
    toggleGlobalFreeze,
  } = useLiveSession(user?.uid, 'teacher');

  // Logic to determine if THIS widget is the live one
  const isThisWidgetLive =
    session?.isActive && session?.activeWidgetId === widget.id;

  const handleToggleLive = () => {
    if (isThisWidgetLive) {
      void endSession();
    } else {
      void startSession(widget.id, widget.type);
    }
  };

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
      case 'classes':
        return <ClassesWidget widget={widget} />;
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

  const isDrawingOverlay =
    widget.type === 'drawing' &&
    (widget.config as DrawingConfig).mode === 'overlay';
  const customStyle: React.CSSProperties = isDrawingOverlay
    ? { zIndex: 9995 }
    : {};

  const content = getWidgetContent();

  if (isStudentView) {
    return (
      <div className="h-full w-full bg-white rounded-xl shadow-sm overflow-hidden relative">
        {content}
      </div>
    );
  }

  return (
    <DraggableWindow
      widget={widget}
      title={getTitle(widget)}
      settings={getWidgetSettings()}
      style={customStyle}
      skipCloseConfirmation={widget.type === 'classes'}
      headerActions={
        <LiveControl
          isLive={isThisWidgetLive ?? false}
          studentCount={students.length}
          students={students}
          onToggleLive={handleToggleLive}
          onFreezeStudent={(id, status) => {
            void toggleFreezeStudent(id, status);
          }}
          onFreezeAll={() => {
            void toggleGlobalFreeze(!session?.frozen);
          }}
        />
      }
    >
      {content}
    </DraggableWindow>
  );
};
