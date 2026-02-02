import React, { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Delete,
  Check,
  Edit2,
  Plus,
} from 'lucide-react';
import { useDashboard } from '@/context/useDashboard';
import { WidgetData, TimerConfig } from '@/types';
import { useScaledFont } from '@/hooks/useScaledFont';

// Global reference for Timer AudioContext
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
  const { updateWidget } = useDashboard();
  const config = widget.config as TimerConfig;

  // States
  const [sessionDuration, setSessionDuration] = useState(
    config.duration ?? 300
  );
  const [timeLeft, setTimeLeft] = useState(config.duration ?? 300);
  const [isActive, setIsActive] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Editing state
  const [activeField, setActiveField] = useState<'min' | 'sec'>('min');
  const [editValues, setEditValues] = useState({ min: '00', sec: '00' });

  const soundEnabled = config.sound;

  const playAlarm = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getTimerAudioCtx();
    if (ctx.state !== 'suspended') {
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
    }
  }, [soundEnabled]);

  // Sync with config if the permanent setting changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionDuration(config.duration);

    setTimeLeft(config.duration);
  }, [config.duration]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            setIsActive(false);
            setIsDone(true);
            playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, playAlarm]);

  const toggle = async () => {
    const ctx = getTimerAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    if (isDone) reset();
    setIsActive(!isActive);
  };

  const reset = () => {
    setIsActive(false);
    setIsDone(false);
    setIsEditing(false);
    setTimeLeft(sessionDuration);
  };

  const addTime = (seconds: number) => {
    setTimeLeft((prev) => prev + seconds);
    setIsDone(false);
  };

  const startEditing = () => {
    setIsActive(false); // Auto-pause
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    setEditValues({
      min: m.toString().padStart(2, '0'),
      sec: s.toString().padStart(2, '0'),
    });
    setIsEditing(true);
  };

  const handleKeypadInput = (num: string) => {
    setEditValues((prev) => {
      const current = prev[activeField];
      // Shift digits left (e.g., "05" + "2" becomes "52")
      let next = (current + num).slice(-2);

      // Validation Caps
      if (activeField === 'sec' && parseInt(next) > 59) next = '59';
      if (activeField === 'min' && parseInt(next) > 99) next = '99';

      return { ...prev, [activeField]: next };
    });
  };

  const handleBackspace = () => {
    setEditValues((prev) => ({
      ...prev,
      [activeField]: '0' + prev[activeField].slice(0, 1),
    }));
  };

  const confirmEdit = () => {
    const totalSeconds =
      parseInt(editValues.min) * 60 + parseInt(editValues.sec);
    setSessionDuration(totalSeconds);
    setTimeLeft(totalSeconds);
    setIsEditing(false);
    setIsDone(false);

    // Sync to global state
    updateWidget(widget.id, {
      config: {
        ...config,
        duration: totalSeconds,
      } as TimerConfig,
    });
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Critical state: Red and pulsing/scaling when <= 10 seconds
  const isCritical = !isDone && timeLeft <= 10 && timeLeft > 0;

  const timerFontSize = useScaledFont(widget.w, widget.h, 4.0, {
    minSize: 48,
    maxSize: 300,
  });
  const buttonSize = useScaledFont(widget.w, widget.h, 0.4, {
    minSize: 32,
    maxSize: 64,
  });
  const iconSize = buttonSize * 0.5;

  return (
    <div
      className={`flex flex-col items-center justify-center h-full transition-colors duration-500 rounded-xl ${
        isDone ? 'bg-red-500/20' : ''
      }`}
    >
      {!isEditing ? (
        <>
          <div
            onClick={startEditing}
            className={`font-mono font-bold leading-none select-none transition-all cursor-pointer tabular-nums hover:text-blue-500 ${
              isDone
                ? 'text-red-600 scale-110 animate-pulse'
                : isCritical
                  ? 'text-red-500 scale-105'
                  : 'text-slate-800'
            }`}
            style={{ fontSize: `${timerFontSize}px` }}
          >
            {minutes.toString().padStart(2, '0')}:
            {seconds.toString().padStart(2, '0')}
          </div>

          <div className="flex gap-2 mb-6 mt-4">
            <button
              onClick={() => addTime(60)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> 1m
            </button>
            <button
              onClick={() => addTime(300)}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" /> 5m
            </button>
          </div>

          <div className="flex gap-6">
            <button
              onClick={toggle}
              style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
              className={`flex items-center justify-center rounded-full transition-all shadow-lg ${
                isActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isActive ? (
                <Pause style={{ width: iconSize, height: iconSize }} />
              ) : (
                <Play
                  style={{
                    width: iconSize,
                    height: iconSize,
                    marginLeft: iconSize * 0.15,
                  }}
                />
              )}
            </button>
            <button
              onClick={reset}
              style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
              className="flex items-center justify-center bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-all shadow-md"
            >
              <RotateCcw style={{ width: iconSize, height: iconSize }} />
            </button>
            <button
              onClick={startEditing}
              style={{ width: `${buttonSize}px`, height: `${buttonSize}px` }}
              className="flex items-center justify-center bg-slate-200 text-slate-600 rounded-full hover:bg-slate-300 transition-all shadow-md"
            >
              <Edit2 style={{ width: iconSize, height: iconSize }} />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center w-full max-w-[240px] animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-2 mb-4 font-mono text-4xl font-bold tabular-nums">
            <button
              onClick={() => setActiveField('min')}
              className={`px-3 py-1 rounded-lg border-2 transition-colors ${
                activeField === 'min'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-transparent text-slate-400'
              }`}
            >
              {editValues.min}
            </button>
            <span className="text-slate-300">:</span>
            <button
              onClick={() => setActiveField('sec')}
              className={`px-3 py-1 rounded-lg border-2 transition-colors ${
                activeField === 'sec'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-transparent text-slate-400'
              }`}
            >
              {editValues.sec}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => handleKeypadInput(n.toString())}
                className="py-2 bg-white border border-slate-200 rounded-lg shadow-sm active:bg-slate-100 font-bold text-slate-700 transition-colors"
              >
                {n}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              className="py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-lg flex items-center justify-center active:bg-slate-100"
            >
              <Delete className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleKeypadInput('0')}
              className="py-2 bg-white border border-slate-200 rounded-lg shadow-sm active:bg-slate-100 font-bold text-slate-700"
            >
              0
            </button>
            <button
              onClick={confirmEdit}
              className="py-2 bg-blue-600 text-white rounded-lg shadow-md flex items-center justify-center active:bg-blue-700 transition-colors"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const TimerSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as TimerConfig;
  const duration = config.duration ?? 300;
  const minutes = Math.floor(duration / 60);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
          Default Duration (Minutes)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="60"
            value={minutes}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  duration: parseInt(e.target.value) * 60,
                } as TimerConfig,
              })
            }
            className="flex-1 accent-blue-600"
          />
          <span className="w-12 text-center font-mono font-bold text-slate-700">
            {minutes}m
          </span>
        </div>
      </div>
      <label className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-slate-200 cursor-pointer">
        <span className="text-sm font-medium text-slate-700">
          Sound on completion
        </span>
        <input
          type="checkbox"
          checked={config.sound}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, sound: e.target.checked } as TimerConfig,
            })
          }
          className="w-5 h-5 accent-blue-600"
        />
      </label>
    </div>
  );
};
