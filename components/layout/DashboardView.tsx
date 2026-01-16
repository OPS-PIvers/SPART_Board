import React, { useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { Sidebar } from './Sidebar';
import { Dock } from './Dock';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

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
  const { activeDashboard, dashboards, addWidget } = useDashboard();
  const [prevIndex, setPrevIndex] = React.useState<number>(-1);
  const [animationClass, setAnimationClass] =
    React.useState<string>('animate-fade-in');

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
        const { icon, color } = JSON.parse(spartStickerData) as {
          icon: string;
          color: string;
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
          config: { icon, color },
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

        addWidget('sticker', { url, rotation: 0 }, { x, y, w, h });
      } catch (err) {
        console.error('Failed to parse sticker data', err);
      }
    }
  };

  const currentIndex = useMemo(() => {
    if (!activeDashboard) return -1;
    return dashboards.findIndex((d) => d.id === activeDashboard.id);
  }, [activeDashboard, dashboards]);

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

  return (
    <div
      id="dashboard-root"
      className={`relative h-screen w-screen overflow-hidden transition-all duration-1000 ${backgroundClasses}`}
      style={backgroundStyles}
      onClick={(e) => e.stopPropagation()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Background Overlay for Depth (especially for images) */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Dynamic Widget Surface */}
      <div
        key={activeDashboard.id}
        className={`relative w-full h-full ${animationClass}`}
      >
        {activeDashboard.widgets.map((widget) => (
          <WidgetRenderer key={widget.id} widget={widget} />
        ))}
      </div>

      <Sidebar />
      <Dock />
      <ToastContainer />
    </div>
  );
};
