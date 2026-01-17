import React from 'react';
import { WidgetData, DrawingConfig, WidgetConfig } from '@/types';
import { DraggableWindow } from '../common/DraggableWindow';
import { useAuth } from '@/context/useAuth';
import { useDashboard } from '@/context/useDashboard';
import { useLiveSession } from '@/hooks/useLiveSession';
import { LiveControl } from './LiveControl';
import { StickerItemWidget } from './stickers/StickerItemWidget';
import { getTitle } from '@/utils/widgetHelpers';
import { getJoinUrl } from '@/utils/urlHelpers';
import { ScalableWidget } from '../common/ScalableWidget';
import { useWindowSize } from '@/hooks/useWindowSize';
import {
  WIDGET_COMPONENTS,
  WIDGET_SETTINGS_COMPONENTS,
} from './WidgetRegistry';

const LIVE_SESSION_UPDATE_DEBOUNCE_MS = 800; // Balance between real-time updates and reducing Firestore write costs

// Define base dimensions for scalable widgets
const WIDGET_BASE_DIMENSIONS: Record<string, { w: number; h: number }> = {
  weather: { w: 250, h: 280 },
  lunchCount: { w: 500, h: 400 },
  'time-tool': { w: 420, h: 400 },
  traffic: { w: 120, h: 320 },
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

  if (widget.type === 'sticker') {
    return <StickerItemWidget widget={widget} />;
  }

  const WidgetComponent = WIDGET_COMPONENTS[widget.type];
  const SettingsComponent = WIDGET_SETTINGS_COMPONENTS[widget.type];

  const getWidgetContent = () => {
    if (WidgetComponent) {
      return <WidgetComponent widget={widget} isStudentView={isStudentView} />;
    }
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        Widget under construction
      </div>
    );
  };

  const getWidgetSettings = () => {
    if (SettingsComponent) {
      return <SettingsComponent widget={widget} />;
    }
    return (
      <div className="text-slate-500 italic text-sm">
        Standard settings available.
      </div>
    );
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
  const effectiveWidth = widget.maximized ? windowSize.width : widget.w;
  const effectiveHeight = widget.maximized ? windowSize.height : widget.h;

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
