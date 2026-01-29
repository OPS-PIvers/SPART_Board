import React, { memo, Suspense, useMemo, useCallback } from 'react';
import {
  WidgetData,
  DrawingConfig,
  WidgetConfig,
  LiveSession,
  LiveStudent,
  GlobalStyle,
  WidgetType,
  DashboardSettings,
} from '@/types';
import { DraggableWindow } from '../common/DraggableWindow';
import { LiveControl } from './LiveControl';
import { StickerItemWidget } from './stickers/StickerItemWidget';
import { getTitle } from '@/utils/widgetHelpers';
import { getJoinUrl } from '@/utils/urlHelpers';
import { ScalableWidget } from '../common/ScalableWidget';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useAuth } from '@/context/useAuth';
import { UI_CONSTANTS } from '@/config/layout';
import {
  WIDGET_COMPONENTS,
  WIDGET_SETTINGS_COMPONENTS,
  WIDGET_SCALING_CONFIG,
} from './WidgetRegistry';

const LIVE_SESSION_UPDATE_DEBOUNCE_MS = 800; // Balance between real-time updates and reducing Firestore write costs

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full w-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

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
  dashboardSettings?: DashboardSettings;
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
  dashboardSettings,
}) => {
  const windowSize = useWindowSize();
  const { canAccessFeature } = useAuth();

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
  // OPTIMIZATION: Only serialize when config reference changes to avoid expensive JSON.stringify on every drag/render
  const configJson = useMemo(
    () => JSON.stringify(widget.config),
    [widget.config]
  );
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

  const WidgetComponent = WIDGET_COMPONENTS[widget.type];
  const SettingsComponent = WIDGET_SETTINGS_COMPONENTS[widget.type];

  const getWidgetSettings = () => {
    if (SettingsComponent) {
      return (
        <Suspense fallback={<LoadingFallback />}>
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

  const scaling = WIDGET_SCALING_CONFIG[widget.type];
  const effectiveWidth = widget.maximized ? windowSize.width : widget.w;
  const effectiveHeight = widget.maximized ? windowSize.height : widget.h;

  // Header height and padding constants
  const HEADER_HEIGHT = UI_CONSTANTS.WIDGET_HEADER_HEIGHT;
  const PADDING = UI_CONSTANTS.WIDGET_PADDING;

  const getWidgetContentInternal = useCallback(
    (w: number, h: number) => {
      if (WidgetComponent) {
        return (
          <Suspense fallback={<LoadingFallback />}>
            <WidgetComponent
              widget={{ ...widget, w, h }}
              isStudentView={isStudentView}
            />
          </Suspense>
        );
      }
      return (
        <div className="p-4 text-center text-slate-400 text-sm">
          Widget under construction
        </div>
      );
    },
    [WidgetComponent, widget, isStudentView]
  );

  if (widget.type === 'sticker') {
    return <StickerItemWidget widget={widget} />;
  }

  const finalContent =
    scaling && !scaling.skipScaling ? (
      <ScalableWidget
        width={effectiveWidth}
        height={effectiveHeight}
        baseWidth={scaling.baseWidth}
        baseHeight={scaling.baseHeight}
        canSpread={scaling.canSpread}
        headerHeight={HEADER_HEIGHT}
        padding={PADDING}
      >
        {({ internalW, internalH }) =>
          getWidgetContentInternal(internalW, internalH)
        }
      </ScalableWidget>
    ) : (
      getWidgetContentInternal(effectiveWidth, effectiveHeight)
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
      skipCloseConfirmation={
        widget.type === 'classes' || dashboardSettings?.disableCloseConfirmation
      }
      updateWidget={updateWidget}
      removeWidget={removeWidget}
      duplicateWidget={duplicateWidget}
      bringToFront={bringToFront}
      addToast={addToast}
      globalStyle={globalStyle}
      headerActions={
        (isLive || canAccessFeature('live-session')) && (
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
        )
      }
    >
      {finalContent}
    </DraggableWindow>
  );
};

export const WidgetRenderer = memo(WidgetRendererComponent);