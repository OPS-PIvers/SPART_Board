import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, DrawingConfig, Point, Path } from '../../types';
import {
  Pencil,
  Eraser,
  Trash2,
  Maximize,
  Minimize,
  Palette,
  Undo2,
  MousePointer2,
  CornerUpLeft,
  Camera,
  Wifi,
} from 'lucide-react';
import { useScreenshot } from '../../hooks/useScreenshot';
import { useAuth } from '../../context/useAuth';
import { useLiveSession } from '../../hooks/useLiveSession';

export const DrawingWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const { user } = useAuth();
  const { session, startSession, endSession } = useLiveSession(
    user?.uid,
    'teacher'
  );

  const isLive = session?.isActive && session?.activeWidgetId === widget.id;

  const handleToggleLive = async () => {
    try {
      if (isLive) {
        await endSession();
      } else {
        await startSession(widget.id, widget.type, widget.config);
      }
    } catch (error) {
      console.error('Failed to toggle live session:', error);
    }
  };

  const config = widget.config as DrawingConfig;
  const {
    mode = 'window',
    color = '#1e293b',
    width = 4,
    paths = [],
    customColors = ['#1e293b', '#ef4444', '#3b82f6', '#22c55e', '#eab308'],
  } = config;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  const { takeScreenshot, isCapturing } = useScreenshot(
    {
      get current() {
        return document.getElementById('dashboard-root');
      },
    } as React.RefObject<HTMLElement | null>,
    `Classroom-Annotation-${new Date().toISOString().split('T')[0]}`
  );

  // Draw paths on the canvas whenever they change
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, allPaths: Path[], current: Point[]) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const renderPath = (p: Path) => {
        if (p.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width;
        ctx.moveTo(p.points[0].x, p.points[0].y);
        for (let i = 1; i < p.points.length; i++) {
          ctx.lineTo(p.points[i].x, p.points[i].y);
        }
        ctx.stroke();
      };

      allPaths.forEach(renderPath);
      if (current.length > 1) {
        renderPath({ points: current, color, width });
      }
    },
    [color, width]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set internal resolution
    if (mode === 'window') {
      canvas.width = widget.w;
      canvas.height = widget.h - 40; // Subtract header
    } else {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    draw(ctx, paths, currentPath);
  }, [paths, currentPath, mode, widget.w, widget.h, draw]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getPos(e);
    setCurrentPath([pos]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    setCurrentPath((prev) => [...prev, pos]);
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      const newPath: Path = { points: currentPath, color, width };
      updateWidget(widget.id, {
        config: {
          ...config,
          paths: [...paths, newPath],
        } as DrawingConfig,
      });
    }
    setCurrentPath([]);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const clear = () => {
    updateWidget(widget.id, {
      config: {
        ...config,
        paths: [],
      } as DrawingConfig,
    });
  };

  const undo = () => {
    updateWidget(widget.id, {
      config: {
        ...config,
        paths: paths.slice(0, -1),
      } as DrawingConfig,
    });
  };

  const PaletteUI = (
    <div className="flex flex-wrap items-center gap-2 p-2">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        {customColors.map((c) => (
          <button
            key={c}
            onClick={() =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  color: c,
                } as DrawingConfig,
              })
            }
            className={`w-6 h-6 rounded-md transition-all ${color === c ? 'scale-110 shadow-sm ring-2 ring-indigo-500' : 'hover:scale-105'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: {
                ...config,
                color: '#ffffff',
              } as DrawingConfig,
            })
          }
          className={`w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center transition-all ${color === '#ffffff' ? 'ring-2 ring-indigo-500' : ''}`}
        >
          <Eraser className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      <div className="h-6 w-px bg-slate-200 mx-1" />

      <button
        onClick={undo}
        title="Undo"
        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={clear}
        title="Clear All"
        className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="h-6 w-px bg-slate-200 mx-1" />

      {mode === 'overlay' && (
        <>
          <button
            onClick={() => void handleToggleLive()}
            className={`p-2 rounded-lg transition-colors ${
              isLive
                ? 'bg-red-50 text-red-600 animate-pulse'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
            title={isLive ? 'End Live Session' : 'Go Live'}
          >
            <Wifi className="w-4 h-4" />
          </button>
          <button
            onClick={() => void takeScreenshot()}
            disabled={isCapturing}
            className="p-2 hover:bg-indigo-50 rounded-lg text-indigo-600 transition-colors disabled:opacity-50"
            title="Capture Full Screen"
          >
            <Camera className="w-4 h-4" />
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1" />
        </>
      )}

      <button
        onClick={() =>
          updateWidget(widget.id, {
            config: {
              ...config,
              mode: mode === 'window' ? 'overlay' : 'window',
            } as DrawingConfig,
          })
        }
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
          mode === 'overlay'
            ? 'bg-indigo-600 text-white shadow-lg'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {mode === 'overlay' ? (
          <CornerUpLeft className="w-3 h-3" />
        ) : (
          <Maximize className="w-3 h-3" />
        )}
        {mode === 'overlay' ? (
          <span>EXIT</span>
        ) : (
          widget.w > 250 && <span>ANNOTATE</span>
        )}
      </button>
    </div>
  );

  if (mode === 'overlay') {
    const portalTarget = document.getElementById('dashboard-root');
    return (
      <>
        {portalTarget &&
          createPortal(
            <div className="fixed inset-0 z-[9990] pointer-events-none overflow-hidden">
              {/* Darken background slightly to indicate annotation mode */}
              <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
              <canvas
                ref={canvasRef}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                className="absolute inset-0 pointer-events-auto cursor-crosshair"
              />
              {/* Floating Toolbar at the Top */}
              <div
                data-screenshot="exclude"
                className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-1 flex items-center gap-1 animate-in slide-in-from-top duration-300"
              >
                <div className="px-3 flex items-center gap-2 border-r border-slate-100 mr-1">
                  <MousePointer2 className="w-4 h-4 text-indigo-600 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                    Annotating
                  </span>
                </div>
                {PaletteUI}
              </div>
            </div>,
            portalTarget
          )}
      </>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg overflow-hidden">
      <div className="flex-1 relative bg-slate-50 overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="absolute inset-0"
        />
        {paths.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300">
            <Pencil className="w-8 h-8 opacity-20" />
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-slate-100 bg-white">
        {PaletteUI}
      </div>
    </div>
  );
};

export const DrawingSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as DrawingConfig;
  const width = config.width ?? 4;
  const customColors = config.customColors ?? [
    '#1e293b',
    '#ef4444',
    '#3b82f6',
    '#22c55e',
    '#eab308',
  ];

  const handleColorChange = (index: number, newColor: string) => {
    const nextColors = [...customColors];
    nextColors[index] = newColor;
    updateWidget(widget.id, {
      config: {
        ...config,
        customColors: nextColors,
      } as DrawingConfig,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
          <Palette className="w-3 h-3" /> Color Presets
        </label>
        <div className="flex gap-2 px-2">
          {customColors.map((c, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-lg border-2 border-white shadow-sm ring-1 ring-slate-200 relative overflow-hidden transition-transform hover:scale-110"
              style={{ backgroundColor: c }}
            >
              <input
                type="color"
                value={c}
                onChange={(e) => handleColorChange(i, e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="Change preset color"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
          <Pencil className="w-3 h-3" /> Brush Thickness
        </label>
        <div className="flex items-center gap-4 px-2">
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={width}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  width: parseInt(e.target.value, 10),
                } as DrawingConfig,
              })
            }
            className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="w-10 text-center font-mono font-bold text-slate-700 text-sm">
            {width}px
          </span>
        </div>
      </div>

      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
        <h4 className="text-[10px] font-black text-indigo-700 uppercase mb-2">
          Modes Guide
        </h4>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center shadow-sm shrink-0">
              <Minimize className="w-3 h-3 text-indigo-600" />
            </div>
            <p className="text-[9px] text-indigo-600 font-medium">
              <b>Window:</b> Standard canvas inside the widget box. Best for
              quick sketches and notes.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center shadow-sm shrink-0">
              <Maximize className="w-3 h-3 text-white" />
            </div>
            <p className="text-[9px] text-indigo-600 font-medium">
              <b>Annotate:</b> Hides the window and moves the toolbar to the top
              of your screen. Perfect for drawing over other content!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
