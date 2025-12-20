import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  Palette,
  Type,
  Layout,
} from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData } from '../../types';

export const StopwatchWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const [time, setTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const requestRef = useRef<number>(null);
  const startTimeRef = useRef<number>(0);

  const {
    themeColor = '#1e293b',
    fontFamily = 'font-mono',
    showLaps = true,
    scaleMultiplier = 1,
  } = (widget.config || {}) as {
    themeColor?: string;
    fontFamily?: string;
    showLaps?: boolean;
    scaleMultiplier?: number;
  };

  const update = (now: number) => {
    if (isActive) {
      setTime(now - startTimeRef.current);
      requestRef.current = requestAnimationFrame(update);
    }
  };

  useEffect(() => {
    if (isActive) {
      startTimeRef.current = performance.now() - time;
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  const formatTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  const reset = () => {
    setIsActive(false);
    setTime(0);
    setLaps([]);
  };

  const dynamicFontSize = useMemo(() => {
    const baseSize = Math.min(widget.w / 6, widget.h / 3);
    return baseSize * scaleMultiplier;
  }, [widget.w, widget.h, scaleMultiplier]);

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 gap-4 overflow-hidden">
      <div
        className={`${fontFamily} font-bold leading-none tabular-nums transition-all`}
        style={{ fontSize: `${dynamicFontSize}px`, color: themeColor }}
      >
        {formatTime(time)}
      </div>

      <div className="flex gap-3 shrink-0">
        <button
          onClick={() => setIsActive(!isActive)}
          className="p-3 rounded-full text-white shadow-lg transition-all hover:scale-110 active:scale-95"
          style={{ backgroundColor: isActive ? '#f59e0b' : '#22c55e' }}
        >
          {isActive ? <Pause /> : <Play />}
        </button>
        <button
          onClick={() => setLaps([time, ...laps])}
          disabled={!isActive}
          className="p-3 bg-blue-500 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
        >
          <Flag />
        </button>
        <button
          onClick={reset}
          className="p-3 bg-slate-200 text-slate-600 rounded-full shadow-md transition-all hover:bg-slate-300 active:scale-95"
        >
          <RotateCcw />
        </button>
      </div>

      {showLaps && laps.length > 0 && (
        <div className="w-full max-h-32 overflow-y-auto border-t border-slate-100 pt-3 custom-scrollbar">
          {laps.map((l, i) => (
            <div
              key={i}
              className="flex justify-between text-xs font-mono py-1 px-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span className="font-black text-slate-300 uppercase tracking-tighter">
                Lap {laps.length - i}
              </span>
              <span className="font-bold text-slate-600">{formatTime(l)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const StopwatchSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as {
    themeColor?: string;
    fontFamily?: string;
    showLaps?: boolean;
    scaleMultiplier?: number;
  };

  const fonts = [
    { id: 'font-mono', label: 'Digital' },
    { id: 'font-sans', label: 'Modern' },
    { id: 'font-handwritten', label: 'Cursive' },
  ];

  const colors = [
    '#1e293b', // Slate
    '#ef4444', // Red
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Palette className="w-3 h-3" /> Color Theme
        </label>
        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, themeColor: c },
                })
              }
              className={`w-8 h-8 rounded-full border-2 transition-all ${config.themeColor === c ? 'border-indigo-600 scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Type className="w-3 h-3" /> Typography
        </label>
        <div className="grid grid-cols-3 gap-2">
          {fonts.map((f) => (
            <button
              key={f.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, fontFamily: f.id },
                })
              }
              className={`py-2 px-1 rounded-lg border-2 text-[9px] font-black uppercase transition-all ${config.fontFamily === f.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Layout className="w-3 h-3" /> Display Options
        </label>
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
          <span className="text-[10px] font-black text-slate-700 uppercase">
            Show Laps
          </span>
          <button
            onClick={() =>
              updateWidget(widget.id, {
                config: { ...config, showLaps: !config.showLaps },
              })
            }
            className={`w-10 h-5 rounded-full relative transition-colors ${config.showLaps ? 'bg-indigo-600' : 'bg-slate-300'}`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${config.showLaps ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Size Multiplier
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={config.scaleMultiplier || 1}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  scaleMultiplier: parseFloat(e.target.value),
                },
              })
            }
            className="flex-1 accent-indigo-600"
          />
          <span className="w-8 text-center font-mono font-bold text-slate-700 text-xs">
            {config.scaleMultiplier || 1}x
          </span>
        </div>
      </div>
    </div>
  );
};
