import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetData } from '../../types';
import {
  Pencil,
  Eraser,
  Trash2,
  Maximize,
  Minimize,
  Palette,
  Undo2,
  MousePointer2,
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Path {
  points: Point[];
  color: string;
  width: number;
}

export const DrawingWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as {
    mode?: string;
    color?: string;
    width?: number;
    paths?: Path[];
  };

  const {
    mode = 'window',
    color = '#1e293b',
    width = 4,
    paths = [] as Path[],
  } = config;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

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
        config: { ...widget.config, paths: [...paths, newPath] },
      });
    }
    setCurrentPath([]);
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const clear = () => {
    updateWidget(widget.id, { config: { ...widget.config, paths: [] } });
  };

  const undo = () => {
    updateWidget(widget.id, {
      config: { ...widget.config, paths: paths.slice(0, -1) },
    });
  };

  const PaletteUI = (
    <div className="flex flex-wrap items-center gap-2 p-2">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        {['#1e293b', '#ef4444', '#3b82f6', '#22c55e', '#eab308'].map((c) => (
          <button
            key={c}
            onClick={() =>
              updateWidget(widget.id, {
                config: { ...widget.config, color: c },
              })
            }
            className={`w-6 h-6 rounded-md transition-all ${color === c ? 'scale-110 shadow-sm ring-2 ring-indigo-500' : 'hover:scale-105'}`}
            style={{ backgroundColor: c }}
          />
        ))}
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...widget.config, color: '#ffffff' },
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

      <button
        onClick={() =>
          updateWidget(widget.id, {
            config: {
              ...widget.config,
              mode: mode === 'window' ? 'overlay' : 'window',
            },
          })
        }
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
          mode === 'overlay'
            ? 'bg-indigo-600 text-white shadow-lg'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {mode === 'overlay' ? (
          <Minimize className="w-3 h-3" />
        ) : (
          <Maximize className="w-3 h-3" />
        )}
        {mode === 'overlay' ? 'Exit Overlay' : 'Screen Overlay'}
      </button>
    </div>
  );

  if (mode === 'overlay') {
    return (
      <div className="h-full flex flex-col bg-white rounded-lg">
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center animate-bounce">
            <Pencil className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-800">
              Annotation Active
            </p>
            <p className="text-[10px] text-slate-500 mt-1">
              Drawing on the entire screen.
              <br />
              Use the controls below.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-100">{PaletteUI}</div>
        {createPortal(
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
            {/* Floating Hint */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-white/20">
              <MousePointer2 className="w-4 h-4 animate-pulse" />
              Annotation Mode Active
            </div>
          </div>,
          document.body
        )}
      </div>
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

  const width = widget.config.width ?? 4;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
          <Palette className="w-3 h-3" /> Brush Thickness
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
                config: { ...widget.config, width: parseInt(e.target.value) },
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
              quick sketches.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center shadow-sm shrink-0">
              <Maximize className="w-3 h-3 text-white" />
            </div>
            <p className="text-[9px] text-indigo-600 font-medium">
              <b>Overlay:</b> Annotate on top of all other widgets. Perfect for
              highlighting specific dashboard content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
