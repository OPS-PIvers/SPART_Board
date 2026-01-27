import React, { useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { useLiveSession } from '../../hooks/useLiveSession';
import { Sidebar } from './sidebar/Sidebar';
import { Dock } from './Dock';
import { HorizonCommandPalette } from '../common/HorizonCommandPalette';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { DEFAULT_GLOBAL_STYLE, LiveStudent } from '../../types';

const EMPTY_STUDENTS: LiveStudent[] = [];

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useDashboard();
  return (
    <div className="fixed top-6 right-6 z-[10000] space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border pointer-events-auto cursor-pointer animate-in slide-in-from-right duration-300 ${
            toast.type === 'success'
              ? 'bg-green-50/90 border-green-200 text-green-800'
              : toast.type === 'error'
                ? 'bg-red-50/90 border-red-200 text-red-800'
                : 'bg-white/90 border-slate-200 text-slate-800'
          }`}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const {
    activeDashboard,
    dashboards,
    addWidget,
    updateWidget,
    removeWidget,
    duplicateWidget,
    bringToFront,
    addToast,
    loadDashboard,
  } = useDashboard();

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

  const [prevIndex, setPrevIndex] = React.useState<number>(-1);
  const [animationClass, setAnimationClass] =
    React.useState<string>('animate-fade-in');
  const [isMinimized, setIsMinimized] = React.useState(false);

  // Gesture Tracking
  const gestureStart = React.useRef<{ x: number; y: number } | null>(null);
  const gestureCurrent = React.useRef<{ x: number; y: number } | null>(null);
  const isFourFingerGesture = React.useRef(false);
  const MIN_SWIPE_DISTANCE_PX = 100;

  const currentIndex = useMemo(() => {
    if (!activeDashboard) return -1;
    return dashboards.findIndex((d) => d.id === activeDashboard.id);
  }, [activeDashboard, dashboards]);

  React.useEffect(() => {
    setIsMinimized(false);
  }, [activeDashboard?.id, currentIndex]);

  // Keyboard Navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + M: Toggle minimize
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setIsMinimized((prev) => !prev);
        return;
      }

      // Alt + Left/Right: Navigate boards
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentIndex > 0) {
          loadDashboard(dashboards[currentIndex - 1].id);
        }
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentIndex < dashboards.length - 1) {
          loadDashboard(dashboards[currentIndex + 1].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, dashboards, loadDashboard]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 4) {
      // e.preventDefault(); // Note: Calling preventDefault here might block scrolling/zooming if not careful, but for 4-finger gestures it's usually safe to claim.
      // However, React synthetic events might complain if we call it asynchronously or late.
      // For now, we just track.
      isFourFingerGesture.current = true;
      gestureStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      gestureCurrent.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else {
      isFourFingerGesture.current = false;
      gestureStart.current = null;
      gestureCurrent.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isFourFingerGesture.current && gestureStart.current) {
      // Verify we still have 4 fingers
      if (e.touches.length !== 4) {
        isFourFingerGesture.current = false;
        gestureStart.current = null;
        gestureCurrent.current = null;
        return;
      }

      e.preventDefault(); // Prevent native browser gestures (like back/forward) when using 4 fingers
      gestureCurrent.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = () => {
    if (
      isFourFingerGesture.current &&
      gestureStart.current &&
      gestureCurrent.current
    ) {
      const deltaX = gestureCurrent.current.x - gestureStart.current.x;
      const deltaY = gestureCurrent.current.y - gestureStart.current.y;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Determine dominant direction
      if (absY > absX && absY > MIN_SWIPE_DISTANCE_PX) {
        // Vertical Swipe
        if (deltaY > 0) {
          // Swipe Down -> Minimize
          setIsMinimized(true);
        } else {
          // Swipe Up -> Restore
          setIsMinimized(false);
        }
      } else if (absX > absY && absX > MIN_SWIPE_DISTANCE_PX) {
        // Horizontal Swipe
        if (deltaX < 0) {
          // Swipe Left -> Next Board
          if (currentIndex < dashboards.length - 1) {
            loadDashboard(dashboards[currentIndex + 1].id);
          }
        } else {
          // Swipe Right -> Prev Board
          if (currentIndex > 0) {
            loadDashboard(dashboards[currentIndex - 1].id);
          }
        }
      }

      // Reset
      isFourFingerGesture.current = false;
      gestureStart.current = null;
      gestureCurrent.current = null;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes('application/sticker') ||
      e.dataTransfer.types.includes('application/spart-sticker')
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    const stickerData = e.dataTransfer.getData('application/sticker');
    const spartStickerData = e.dataTransfer.getData(
      'application/spart-sticker'
    );

    if (spartStickerData) {
      e.preventDefault();
      try {
        const { icon, color, label } = JSON.parse(spartStickerData) as {
          icon: string;
          color: string;
          label?: string;
        };
        const w = 150;
        const h = 150;
        const x = e.clientX - w / 2;
        const y = e.clientY - h / 2;

        addWidget('sticker', {
          x,
          y,
          w,
          h,
          config: { icon, color, label, rotation: 0 },
        });
      } catch (err) {
        console.error('Failed to parse spart-sticker data', err);
      }
      return;
    }

    if (stickerData) {
      e.preventDefault();
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parsed = JSON.parse(stickerData);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const url = parsed.url as string;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const ratio = (parsed.ratio as number) || 1;

        const baseSize = 200;
        let w = baseSize;
        let h = baseSize;

        if (ratio > 1) {
          h = baseSize / ratio;
        } else {
          w = baseSize * ratio;
        }

        const x = e.clientX - w / 2;
        const y = e.clientY - h / 2;

        addWidget('sticker', {
          x,
          y,
          w,
          h,
          config: { url, rotation: 0 },
        });
      } catch (err) {
        console.error('Failed to parse sticker data', err);
      }
    }
  };

  React.useEffect(() => {
    if (currentIndex !== -1 && prevIndex !== -1 && currentIndex !== prevIndex) {
      if (currentIndex > prevIndex) {
        setAnimationClass('animate-slide-left-in');
      } else {
        setAnimationClass('animate-slide-right-in');
      }
    } else {
      setAnimationClass('animate-fade-in');
    }
    setPrevIndex(currentIndex);
  }, [currentIndex, prevIndex]);

  const backgroundStyles = useMemo(() => {
    if (!activeDashboard) return {};
    const bg = activeDashboard.background;

    // Check if it's a URL or Base64 image
    if (bg.startsWith('http') || bg.startsWith('data:')) {
      return {
        backgroundImage: `url("${bg}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    return {};
  }, [activeDashboard]);

  const backgroundClasses = useMemo(() => {
    if (!activeDashboard) return '';
    const bg = activeDashboard.background;
    // If it's a URL, don't apply the class
    if (bg.startsWith('http') || bg.startsWith('data:')) return '';
    return bg;
  }, [activeDashboard]);

  if (!activeDashboard) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-black uppercase tracking-[0.3em] text-xs">
            Waking up Classroom...
          </span>
        </div>
      </div>
    );
  }

  const globalStyle = activeDashboard.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const fontClass = `font-${globalStyle.fontFamily} font-bold`;

  return (
    <div
      id="dashboard-root"
      className={`relative h-screen w-screen overflow-hidden transition-all duration-1000 ${backgroundClasses} ${fontClass}`}
      style={backgroundStyles}
      onClick={(e) => e.stopPropagation()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Overlay for Depth (especially for images) */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Dynamic Widget Surface */}
      <div
        key={activeDashboard.id}
        className={`relative w-full h-full ${animationClass} transition-all duration-500 ease-in-out`}
        style={{
          transform: isMinimized ? 'translateY(80vh)' : 'none',
          transformOrigin: 'bottom center',
          opacity: isMinimized ? 0 : 1,
          pointerEvents: isMinimized ? 'none' : 'auto',
        }}
      >
        {activeDashboard.widgets.map((widget) => {
          const isLive =
            session?.isActive && session?.activeWidgetId === widget.id;
          return (
            <WidgetRenderer
              key={widget.id}
              widget={widget}
              isStudentView={false}
              session={session}
              isLive={isLive ?? false}
              students={isLive ? students : EMPTY_STUDENTS}
              updateSessionConfig={updateSessionConfig}
              updateSessionBackground={updateSessionBackground}
              startSession={startSession}
              endSession={endSession}
              removeStudent={removeStudent}
              toggleFreezeStudent={toggleFreezeStudent}
              toggleGlobalFreeze={toggleGlobalFreeze}
              updateWidget={updateWidget}
              removeWidget={removeWidget}
              duplicateWidget={duplicateWidget}
              bringToFront={bringToFront}
              addToast={addToast}
              globalStyle={globalStyle}
              dashboardBackground={activeDashboard.background}
            />
          );
        })}
      </div>

      <Sidebar />
      <Dock />
      <ToastContainer />
      <HorizonCommandPalette />
    </div>
  );
};
