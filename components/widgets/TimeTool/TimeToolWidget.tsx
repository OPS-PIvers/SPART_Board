import React, { useState, useCallback } from 'react';
import { TimeToolConfig, WidgetData } from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { useTimeTool } from './useTimeTool';
import {
  Play,
  Pause,
  RotateCcw,
  Bell,
  Check,
  Delete,
  Timer as TimerIcon,
  Clock as ClockIcon,
  Palette,
} from 'lucide-react';
import { STANDARD_COLORS } from '../../../config/colors';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatTimer = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatStopwatch = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
};

const PRESETS = [60, 300, 600, 900, 1800] as const;
const SOUNDS = ['Chime', 'Blip', 'Gong', 'Alert'] as const;

const presetLabel = (s: number) => (s >= 60 ? `${s / 60}m` : `${s}s`);

// ─── Progress Ring ──────────────────────────────────────────────────────────

const ProgressRing: React.FC<{
  progress: number; // 0 to 1
  time: number;
  ringColor: string;
}> = ({ progress, ringColor }) => {
  const CIRCUMFERENCE = 2 * Math.PI * 95;
  const offset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 220 220"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle
        className="opacity-5"
        stroke="currentColor"
        strokeWidth="12"
        fill="transparent"
        r="95"
        cx="110"
        cy="110"
      />
      <circle
        className="transition-all duration-100 ease-linear"
        stroke={ringColor}
        strokeWidth="12"
        strokeLinecap="round"
        fill="transparent"
        r="95"
        cx="110"
        cy="110"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
    </svg>
  );
};

// ─── Keypad ─────────────────────────────────────────────────────────────────

const Keypad: React.FC<{
  onConfirm: (totalSeconds: number) => void;
  onCancel: () => void;
  initialSeconds: number;
  theme: 'light' | 'dark' | 'glass';
}> = ({ onConfirm, onCancel, initialSeconds, theme }) => {
  const [activeField, setActiveField] = useState<'min' | 'sec'>('min');
  const [editValues, setEditValues] = useState({
    min: Math.floor(initialSeconds / 60)
      .toString()
      .padStart(3, '0'),
    sec: Math.floor(initialSeconds % 60)
      .toString()
      .padStart(2, '0'),
  });

  const handleInput = (num: string) => {
    setEditValues((prev) => {
      const current = prev[activeField];
      const limit = activeField === 'min' ? 3 : 2;
      let next = (current + num).slice(-limit).padStart(limit, '0');
      if (activeField === 'sec' && parseInt(next) > 59) next = '59';
      return { ...prev, [activeField]: next };
    });
  };

  const handleBackspace = () => {
    setEditValues((prev) => {
      const limit = activeField === 'min' ? 3 : 2;
      return {
        ...prev,
        [activeField]: prev[activeField].slice(0, -1).padStart(limit, '0'),
      };
    });
  };

  const isDark = theme === 'dark';
  const isGlass = theme === 'glass';

  const btnBase =
    'aspect-square flex items-center justify-center rounded-2xl font-black transition-all active:scale-90';
  const btnColor = isDark
    ? 'bg-slate-800 text-white hover:bg-slate-700'
    : isGlass
      ? 'bg-white/10 text-white hover:bg-white/20'
      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-brand-blue-primary shadow-sm';

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 gap-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Time display row */}
      <div
        className="flex items-center gap-3 font-mono font-black tabular-nums"
        style={{ fontSize: 'clamp(1.5rem, 8cqw, 3rem)' }}
      >
        <button
          onClick={() => setActiveField('min')}
          className={`px-4 py-2 rounded-xl border-3 transition-all ${
            activeField === 'min'
              ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary scale-105 shadow-lg'
              : 'border-transparent text-slate-300 opacity-40 hover:opacity-100'
          }`}
        >
          {editValues.min}
        </button>
        <span className="text-slate-300">:</span>
        <button
          onClick={() => setActiveField('sec')}
          className={`px-4 py-2 rounded-xl border-3 transition-all ${
            activeField === 'sec'
              ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary scale-105 shadow-lg'
              : 'border-transparent text-slate-400 opacity-40 hover:opacity-100'
          }`}
        >
          {editValues.sec}
        </button>
      </div>

      {/* Numpad grid */}
      <div
        className="grid grid-cols-3 gap-2 w-full"
        style={{
          maxWidth: 'min(280px, 80cqw)',
          fontSize: 'clamp(0.875rem, 3cqw, 1.25rem)',
        }}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleInput(n.toString())}
            className={`${btnBase} ${btnColor}`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className={`${btnBase} ${btnColor}`}
          aria-label="Backspace"
        >
          <Delete className="w-[1.2em] h-[1.2em]" />
        </button>
        <button
          onClick={() => handleInput('0')}
          className={`${btnBase} ${btnColor}`}
        >
          0
        </button>
        <button
          onClick={() =>
            onConfirm(parseInt(editValues.min) * 60 + parseInt(editValues.sec))
          }
          className={`${btnBase} bg-brand-blue-primary text-white shadow-xl hover:bg-brand-blue-light`}
          aria-label="Confirm time"
        >
          <Check className="w-[1.4em] h-[1.4em]" strokeWidth={4} />
        </button>
      </div>

      <button
        onClick={onCancel}
        className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-red-primary hover:bg-brand-red-lighter/20 transition-all"
        aria-label="Close keypad"
      >
        Cancel
      </button>
    </div>
  );
};

// ─── Main Widget ────────────────────────────────────────────────────────────

export const TimeToolWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const {
    displayTime,
    isRunning,
    mode,
    config,
    handleStart,
    handleStop,
    handleReset,
    setTime,
  } = useTimeTool(widget);

  const [isEditing, setIsEditing] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  const isVisual = config.visualType === 'visual';

  const updateConfig = useCallback(
    (patch: Partial<TimeToolConfig>) => {
      updateWidget(widget.id, { config: { ...config, ...patch } });
    },
    [updateWidget, widget.id, config]
  );

  // ─── Derived styles ──────────────────────────────────────────────

  const themeClasses =
    config.theme === 'dark'
      ? 'bg-slate-900 text-white'
      : config.theme === 'glass'
        ? 'bg-white/10 backdrop-blur-xl text-white'
        : 'bg-white text-slate-900';

  const getTimeColor = () => {
    if (mode !== 'timer') return 'text-brand-blue-primary';
    if (displayTime <= 60) return 'text-brand-red-primary';
    if (displayTime / config.duration <= 0.25) return 'text-amber-500';
    return config.theme === 'light' ? 'text-slate-900' : 'text-white';
  };

  const getRingColor = () => {
    if (displayTime <= 60) return STANDARD_COLORS.red;
    if (displayTime / config.duration <= 0.25) return STANDARD_COLORS.amber;
    return STANDARD_COLORS.blue;
  };

  const progress =
    mode === 'timer' && config.duration > 0 ? displayTime / config.duration : 1;

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div
      className={`h-full w-full flex flex-col overflow-hidden ${themeClasses}`}
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div
        className={`shrink-0 flex items-center justify-between px-3 py-2 border-b ${
          config.theme === 'dark'
            ? 'border-slate-800'
            : config.theme === 'glass'
              ? 'border-white/10'
              : 'border-slate-100'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0 p-1.5 bg-brand-blue-primary text-white rounded-lg">
            {mode === 'timer' ? (
              <TimerIcon size={14} />
            ) : (
              <ClockIcon size={14} />
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">
              {mode === 'timer' ? 'Countdown' : 'Elapsed'}
            </span>
            <span className="text-[11px] font-black uppercase tracking-tight leading-none mt-0.5">
              {mode === 'timer' ? 'Timer' : 'Stopwatch'}
            </span>
          </div>
        </div>

        {/* Mode + theme toggles */}
        <div className="flex items-center gap-1">
          {/* Mode toggle */}
          <button
            onClick={() => {
              if (mode === 'timer') {
                updateConfig({
                  mode: 'stopwatch',
                  elapsedTime: 0,
                  isRunning: false,
                  startTime: null,
                });
              } else {
                updateConfig({
                  mode: 'timer',
                  duration: 600,
                  elapsedTime: 600,
                  isRunning: false,
                  startTime: null,
                });
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-blue-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={mode === 'timer' ? 'Switch to Stopwatch' : 'Switch to Timer'}
          >
            {mode === 'timer' ? (
              <ClockIcon size={14} />
            ) : (
              <TimerIcon size={14} />
            )}
          </button>

          {/* Visual toggle */}
          <button
            onClick={() =>
              updateConfig({ visualType: isVisual ? 'digital' : 'visual' })
            }
            className={`p-1.5 rounded-lg transition-colors ${
              isVisual
                ? 'text-brand-blue-primary bg-brand-blue-lighter'
                : 'text-slate-400 hover:text-brand-blue-primary hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isVisual ? 'Switch to Digital' : 'Switch to Visual Ring'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </button>

          {/* Theme dots */}
          <div className="flex items-center gap-1 ml-1">
            {(['light', 'dark', 'glass'] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateConfig({ theme: t })}
                className={`w-4 h-4 rounded-full border-2 transition-all hover:scale-110 ${
                  config.theme === t
                    ? 'border-brand-blue-primary scale-110'
                    : 'border-slate-200 opacity-40 hover:opacity-100'
                } ${t === 'light' ? 'bg-white' : t === 'dark' ? 'bg-slate-900' : 'bg-slate-300'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Content ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative">
        {isEditing ? (
          <Keypad
            initialSeconds={config.elapsedTime}
            theme={config.theme}
            onConfirm={(s) => {
              setTime(s);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center px-4 py-2">
            {/* Time display area */}
            <div className="flex-1 min-h-0 w-full flex items-center justify-center">
              <div
                className="relative flex items-center justify-center"
                style={{
                  width: isVisual ? 'min(90%, 90cqh)' : 'auto',
                  aspectRatio: isVisual ? '1' : undefined,
                }}
              >
                {isVisual && (
                  <ProgressRing
                    progress={progress}
                    time={displayTime}
                    ringColor={getRingColor()}
                  />
                )}
                <button
                  onClick={() => {
                    if (!isRunning && mode === 'timer') setIsEditing(true);
                  }}
                  disabled={isRunning || mode !== 'timer'}
                  className={`relative z-10 tabular-nums select-none font-black font-sans leading-none transition-transform ${getTimeColor()} ${
                    !isRunning && mode === 'timer'
                      ? 'cursor-pointer hover:scale-105 active:scale-95'
                      : 'cursor-default'
                  }`}
                  style={{
                    fontSize: isVisual
                      ? 'clamp(1.5rem, min(18cqw, 20cqh), 8rem)'
                      : 'clamp(2rem, min(28cqw, 32cqh), 12rem)',
                  }}
                >
                  {mode === 'stopwatch'
                    ? formatStopwatch(displayTime)
                    : formatTimer(displayTime)}
                </button>
              </div>
            </div>

            {/* Presets row — only in digital timer mode when stopped */}
            {!isVisual && mode === 'timer' && !isRunning && (
              <div className="shrink-0 flex flex-wrap justify-center gap-1.5 pb-2">
                {PRESETS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setTime(s)}
                    className={`px-3 py-1.5 rounded-lg font-black transition-all hover:scale-105 active:scale-95 ${
                      config.elapsedTime === s
                        ? 'bg-brand-blue-primary text-white shadow-md'
                        : config.theme === 'dark'
                          ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-brand-blue-primary'
                          : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-brand-blue-primary shadow-sm'
                    }`}
                    style={{ fontSize: 'clamp(0.5rem, 2.5cqw, 0.75rem)' }}
                  >
                    {presetLabel(s)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Footer (controls) ──────────────────────────────────── */}
      {!isEditing && (
        <div className="shrink-0 px-3 pb-3 pt-1 flex flex-col gap-2">
          {/* Play/Pause + Reset */}
          <div className="flex gap-2">
            <button
              onClick={
                isRunning ? () => handleStop() : () => void handleStart()
              }
              className={`flex-[3] flex items-center justify-center gap-2 rounded-lg font-black uppercase tracking-widest transition-all active:scale-[0.97] ${
                isRunning
                  ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  : 'bg-brand-blue-primary text-white shadow-lg shadow-brand-blue-primary/30 hover:bg-brand-blue-dark hover:-translate-y-0.5'
              }`}
              style={{
                height: 'clamp(2.5rem, 10cqh, 4rem)',
                fontSize: 'clamp(0.625rem, 2.5cqw, 0.8rem)',
              }}
            >
              {isRunning ? (
                <Pause className="w-[1.2em] h-[1.2em]" fill="currentColor" />
              ) : (
                <Play className="w-[1.2em] h-[1.2em]" fill="currentColor" />
              )}
              {isRunning ? 'PAUSE' : 'START'}
            </button>
            <button
              onClick={handleReset}
              className="aspect-square flex items-center justify-center rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-brand-blue-primary transition-all active:scale-95"
              style={{ height: 'clamp(2.5rem, 10cqh, 4rem)' }}
              aria-label="Reset"
            >
              <RotateCcw
                className="w-[1.2em] h-[1.2em]"
                style={{ fontSize: 'clamp(1rem, 3cqw, 1.5rem)' }}
              />
            </button>
          </div>

          {/* Sound picker + version label */}
          <div className="flex justify-between items-center px-0.5">
            <div className="relative">
              <button
                onClick={() => setShowSoundPicker((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border shadow-sm ${
                  config.theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-brand-blue-primary hover:bg-slate-700'
                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-brand-blue-primary hover:bg-slate-100'
                }`}
              >
                <Bell
                  size={12}
                  className={
                    isRunning ? 'animate-pulse text-brand-blue-primary' : ''
                  }
                />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {config.selectedSound}
                </span>
              </button>

              {showSoundPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSoundPicker(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-2 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 p-1.5 z-50 animate-in slide-in-from-bottom-2 zoom-in-95 duration-200">
                    {SOUNDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          updateConfig({ selectedSound: s });
                          setShowSoundPicker(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          config.selectedSound === s
                            ? 'bg-brand-blue-primary text-white shadow-md'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-brand-blue-primary'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-30 select-none">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-blue-primary" />
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">
                Timer v3
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Settings Panel ─────────────────────────────────────────────────────────

export const TimeToolSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as TimeToolConfig;
  const { timerEndVoiceLevel } = config;

  const hasExpectations = activeDashboard?.widgets.some(
    (w) => w.type === 'expectations'
  );

  return (
    <div className="space-y-6 p-1">
      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <label className="flex items-center gap-2 text-xxs font-black text-brand-blue-primary uppercase tracking-widest mb-5">
          <Palette size={14} />
          Timer End Action
        </label>

        {!hasExpectations ? (
          <div className="text-xs text-brand-red-primary bg-brand-red-lighter/20 p-4 rounded-2xl border border-brand-red-lighter/30 flex items-start gap-3">
            <span className="text-xl mt-0.5">&#128161;</span>
            <p className="font-bold leading-snug">
              Add an &quot;Expectations&quot; widget to enable automatic voice
              level changes when the timer hits zero!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
              Switch to Voice Level when finished:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() =>
                  updateWidget(widget.id, {
                    config: { ...config, timerEndVoiceLevel: null },
                  })
                }
                className={`p-3 rounded-xl text-xxs font-black uppercase transition-all border-2 ${
                  timerEndVoiceLevel == null
                    ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary shadow-sm'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-200'
                }`}
              >
                Off
              </button>
              {[0, 1, 2, 3, 4].map((level) => (
                <button
                  key={level}
                  onClick={() =>
                    updateWidget(widget.id, {
                      config: { ...config, timerEndVoiceLevel: level },
                    })
                  }
                  className={`p-3 rounded-xl text-xxs font-black uppercase transition-all border-2 ${
                    timerEndVoiceLevel === level
                      ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary shadow-sm'
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  Lvl {level}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
