import React from 'react';
import { WidgetData, DrawingConfig, WidgetConfig } from '../../types';
import { DraggableWindow } from '../common/DraggableWindow';
import { useAuth } from '../../context/useAuth';
import { useDashboard } from '../../context/useDashboard';
import { useLiveSession } from '../../hooks/useLiveSession';
import { LiveControl } from './LiveControl';
import { ClockWidget, ClockSettings } from './ClockWidget';
import { TimeToolWidget } from './TimeToolWidget';
import { TrafficLightWidget } from './TrafficLightWidget';
import { TextWidget, TextSettings } from './TextWidget';
import { SoundWidget, SoundSettings } from './SoundWidget';
import { WebcamWidget, WebcamSettings } from './WebcamWidget';
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
import {
  InstructionalRoutinesWidget,
  InstructionalRoutinesSettings,
} from './InstructionalRoutinesWidget';
import { MiniAppWidget } from './MiniAppWidget';
import { MaterialsWidget, MaterialsSettings } from './MaterialsWidget';
import { getTitle } from '../../utils/widgetHelpers';
import { getJoinUrl } from '../../utils/urlHelpers';
import { ScalableWidget } from '../common/ScalableWidget';
import { useWindowSize } from '../../hooks/useWindowSize';

const LIVE_SESSION_UPDATE_DEBOUNCE_MS = 800; // Balance between real-time updates and reducing Firestore write costs

// Define base dimensions for scalable widgets
const WIDGET_BASE_DIMENSIONS: Record<string, { w: number; h: number }> = {
  weather: { w: 250, h: 280 },
  lunchCount: { w: 500, h: 400 },
  'time-tool': { w: 420, h: 400 },
  traffic: { w: 120, h: 320 },
  scoreboard: { w: 320, h: 200 },
  qr: { w: 200, h: 250 },
  dice: { w: 240, h: 240 },
  materials: { w: 340, h: 340 },
};

export const WidgetRenderer: React.FC<{
  widget: WidgetData;
  isStudentView?: boolean;
}> = ({ widget, isStudentView = false }) => {
  const { user } = useAuth();
  const { activeDashboard } = useDashboard();
  const windowSize = useWindowSize();

  // Initialize the hook (only active if user exists)
  const {
    session,
    students,
    startSession,
    updateSessionConfig,
    updateSessionBackground,
    endSession,
    removeStudent,
    toggleFreezeStudent,
    toggleGlobalFreeze,
  } = useLiveSession(user?.uid, 'teacher');

  const dashboardBackground = activeDashboard?.background;

  // Logic to determine if THIS widget is the live one
  const isThisWidgetLive =
    session?.isActive && session?.activeWidgetId === widget.id;

  const handleToggleLive = async () => {
    try {
      if (isThisWidgetLive) {
        await endSession();
      } else {
        await startSession(
          widget.id,
          widget.type,
          widget.config,
          dashboardBackground ?? undefined
        );
      }
    } catch (error) {
      console.error('Failed to toggle live session:', error);
    }
  };

  // Sync config changes to session when live
  const configJson = JSON.stringify(widget.config);
  React.useEffect(() => {
    if (!isThisWidgetLive) {
      return undefined;
    }

    const timer = setTimeout(() => {
      void (async () => {
        try {
          await updateSessionConfig(JSON.parse(configJson) as WidgetConfig);
        } catch (error) {
          // Log the error so failures are visible during development and debugging
          // while avoiding disruption to the UI.

          console.error('Failed to update live session config', error);
        }
      })();
    }, LIVE_SESSION_UPDATE_DEBOUNCE_MS); // Debounce updates to reduce write frequency under rapid changes

    return () => {
      clearTimeout(timer);
    };
  }, [configJson, isThisWidgetLive, updateSessionConfig]);

  // Sync background changes to session when live
  React.useEffect(() => {
    if (!isThisWidgetLive || !activeDashboard?.background) {
      return;
    }
    void updateSessionBackground(activeDashboard.background);
  }, [activeDashboard?.background, isThisWidgetLive, updateSessionBackground]);

  const getWidgetContent = () => {
    switch (widget.type) {
      case 'clock':
        return <ClockWidget widget={widget} />;
      case 'time-tool':
        return <TimeToolWidget widget={widget} />;
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
        return <DrawingWidget widget={widget} isStudentView={isStudentView} />;
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
      case 'instructionalRoutines':
        return <InstructionalRoutinesWidget widget={widget} />;
      case 'miniApp':
        return <MiniAppWidget widget={widget} />;
      case 'materials':
        return <MaterialsWidget widget={widget} />;
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
      case 'webcam':
        return <WebcamSettings widget={widget} />;
      case 'calendar':
        return <CalendarSettings widget={widget} />;
      case 'weather':
        return <WeatherSettings widget={widget} />;
      case 'lunchCount':
        return <LunchCountSettings widget={widget} />;
      case 'instructionalRoutines':
        return <InstructionalRoutinesSettings widget={widget} />;
      case 'materials':
        return <MaterialsSettings widget={widget} />;
      case 'miniApp':
        return (
          <div className="text-slate-500 italic text-sm">
            Manage apps in the main view.
          </div>
        );
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
    ? {
        display: 'none',
      }
    : {};

  const content = getWidgetContent();

  const baseDim = WIDGET_BASE_DIMENSIONS[widget.type];
  // Account for sidebar (top-6, left-6) and dock (bottom-6) spacing
  // Horizontal: 1.5rem left + 1.5rem right = 3rem total (48px)
  // Vertical: 4.5rem top (for sidebar and spacing) + 4.5rem bottom (for dock and spacing) = 9rem total (144px)
  const effectiveWidth = widget.maximized
    ? windowSize.width - 48 // 3rem = 48px
    : widget.w;
  const effectiveHeight = widget.maximized
    ? windowSize.height - 144 // 9rem = 144px (4.5rem top + 4.5rem bottom)
    : widget.h;

  const finalContent = baseDim ? (
    <ScalableWidget
      width={effectiveWidth}
      height={effectiveHeight}
      baseWidth={baseDim.w}
      baseHeight={baseDim.h}
    >
      {content}
    </ScalableWidget>
  ) : (
    content
  );

  if (isStudentView) {
    const isDrawing = widget.type === 'drawing';
    return (
      <div
        className={`h-full w-full rounded-xl overflow-hidden relative ${
          isDrawing ? 'bg-transparent' : 'bg-white shadow-sm'
        }`}
      >
        {finalContent}
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
          code={session?.code}
          joinUrl={getJoinUrl()}
          onToggleLive={handleToggleLive}
          onFreezeStudent={(id, status) => {
            void toggleFreezeStudent(id, status).catch((err) =>
              console.error('Failed to freeze student:', err)
            );
          }}
          onRemoveStudent={(id) => {
            void removeStudent(id).catch((err) =>
              console.error('Failed to remove student:', err)
            );
          }}
          onFreezeAll={() => {
            void toggleGlobalFreeze(!session?.frozen).catch((err) =>
              console.error('Failed to toggle global freeze:', err)
            );
          }}
        />
      }
    >
      {finalContent}
    </DraggableWindow>
  );
};
