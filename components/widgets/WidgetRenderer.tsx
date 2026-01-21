import React, { memo, Suspense } from 'react';
import {
  WidgetData,
  DrawingConfig,
  WidgetConfig,
  LiveSession,
  LiveStudent,
  GlobalStyle,
  WidgetType,
} from '@/types';
import { DraggableWindow } from '../common/DraggableWindow';
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

const LoadingFallback = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

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

interface WidgetRendererProps {
  widget: WidgetData;
  isStudentView?: boolean;
  // Session Props
  session: LiveSession | null;
  isLive: boolean;
  students: LiveStudent[];
  updateSessionConfig: (config: WidgetConfig) => Promise<void>;
  updateSessionBackground: (background: string) => Promise<void>;
  startSession: (
    widgetId: string,
    widgetType: WidgetType,
    config?: WidgetConfig,
    background?: string
  ) => Promise<void>;
  endSession: () => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;
  toggleFreezeStudent: (
    studentId: string,
    currentStatus: 'active' | 'frozen' | 'disconnected'
  ) => Promise<void>;
  toggleGlobalFreeze: (freeze: boolean) => Promise<void>;
  // Dashboard Actions
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
  removeWidget: (id: string) => void;
  duplicateWidget: (id: string) => void;
  bringToFront: (id: string) => void;
  addToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  globalStyle: GlobalStyle;
  dashboardBackground?: string;
}

const WidgetRendererComponent: React.FC<WidgetRendererProps> = ({
  widget,
  isStudentView = false,
  session,
  isLive,
  students,
  updateSessionConfig,
  updateSessionBackground,
  startSession,
  endSession,
  removeStudent,
  toggleFreezeStudent,
  toggleGlobalFreeze,
  updateWidget,
  removeWidget,
  duplicateWidget,
  bringToFront,
  addToast,
  globalStyle,
  dashboardBackground,
}) => {
  const windowSize = useWindowSize();

  const handleToggleLive = async () => {
    try {
      if (isLive) {
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
    if (!isLive) {
      return undefined;
    }

    const timer = setTimeout(() => {
      void (async () => {
        try {
          await updateSessionConfig(JSON.parse(configJson) as WidgetConfig);
        } catch (error) {
          console.error('Failed to update live session config', error);
        }
      })();
    }, LIVE_SESSION_UPDATE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [configJson, isLive, updateSessionConfig]);

  // Sync background changes to session when live
  React.useEffect(() => {
    if (!isLive || !dashboardBackground) {
      return;
    }
    void updateSessionBackground(dashboardBackground);
  }, [dashboardBackground, isLive, updateSessionBackground]);

  if (widget.type === 'sticker') {
    return <StickerItemWidget widget={widget} />;
  }

  const WidgetComponent = WIDGET_COMPONENTS[widget.type];
  const SettingsComponent = WIDGET_SETTINGS_COMPONENTS[widget.type];

  const getWidgetContent = () => {
    if (WidgetComponent) {
      return (
        <Suspense fallback={<LoadingFallback />}>
          <WidgetComponent widget={widget} isStudentView={isStudentView} />
        </Suspense>
      );
    }
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        Widget under construction
      </div>
    );
  };

  const getWidgetSettings = () => {
    if (SettingsComponent) {
      return (
        <Suspense fallback={<div className="p-4 text-center text-slate-400">Loading...</div>}>
          <SettingsComponent widget={widget} />
        </Suspense>
      );
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
      updateWidget={updateWidget}
      removeWidget={removeWidget}
      duplicateWidget={duplicateWidget}
      bringToFront={bringToFront}
      addToast={addToast}
      globalStyle={globalStyle}
      headerActions={
        <LiveControl
          isLive={isLive}
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

export const WidgetRenderer = memo(WidgetRendererComponent);
