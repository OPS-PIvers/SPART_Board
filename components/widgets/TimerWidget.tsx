import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TimerConfig } from '../../types';

// Global reference for Timer Chime AudioContext
let timerAudioCtx: AudioContext | null = null;

interface CustomWindow extends Window {
  webkitAudioContext: typeof AudioContext;
}

const getTimerAudioCtx = () => {
  if (!timerAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as CustomWindow).webkitAudioContext;
    timerAudioCtx = new AudioContextClass();
  }
  return timerAudioCtx;
};

export const TimerWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const config = widget.config as TimerConfig;
  const [timeLeft, setTimeLeft] = useState(config.duration ?? 300);
  const [isActive, setIsActive] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const playChime = React.useCallback(() => {
    if (!config.sound) return;
    const ctx = getTimerAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  }, [config.sound]);

  const handleCompletion = React.useCallback(() => {
    setIsActive(false);
    setIsDone(true);
    playChime();
  }, [playChime]);

  // Countdown Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            handleCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, handleCompletion]);

  const toggle = async () => {
    const ctx = getTimerAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    if (isDone) reset();
    setIsActive(!isActive);
  };

  const reset = () => {
    setIsActive(false);
    setIsDone(false);
    setTimeLeft(config.duration);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div
      className={`flex flex-col items-center justify-center h-full transition-colors duration-500 ${isDone ? 'bg-red-500/20' : ''}`}
    >
      <div
        className={`font-mono font-bold leading-none select-none transition-all ${isDone ? 'text-red-600 scale-110 animate-pulse' : 'text-slate-800'}`}
        style={{ fontSize: 'clamp(3rem, 12vw, 5rem)' }}
      >
        {minutes.toString().padStart(2, '0')}:
        {seconds.toString().padStart(2, '0')}
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={toggle}
          className={`p-3 rounded-full transition-all shadow-md ${isActive ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}
        >
          {isActive ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-1" />
          )}
        </button>
        <button
          onClick={reset}
          className="p-3 bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-all shadow-sm"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export const TimerSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as TimerConfig;

  return (
    <div className="space-y-6">
      {/* Duration Slider */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Duration (Minutes)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="60"
            value={Math.floor(config.duration / 60)}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, duration: parseInt(e.target.value) * 60 },
              })
            }
            className="flex-1 accent-blue-600"
          />
          <span className="w-12 text-center font-mono font-bold text-slate-700">
            {Math.floor(config.duration / 60)}m
          </span>
        </div>
      </div>

      {/* Completion Sound Toggle */}
      <label className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer">
        <span className="text-xs font-bold text-slate-700 uppercase">
          Completion Chime
        </span>
        <input
          type="checkbox"
          checked={config.sound}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, sound: e.target.checked },
            })
          }
          className="w-5 h-5 accent-blue-600"
        />
      </label>
    </div>
  );
};
