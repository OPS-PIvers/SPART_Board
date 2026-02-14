import React, { useState, useCallback } from 'react';
import { TimeToolConfig, WidgetData } from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { useTimeToolActions } from './useTimeTool';
import { TimeToolDisplay } from './TimeToolDisplay';
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
import { FloatingPanel } from '../../common/FloatingPanel';

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRESETS = [60, 180, 300] as const;
const SOUNDS = ['Chime', 'Blip', 'Gong', 'Alert'] as const;

const presetLabel = (s: number) => (s >= 60 ? `${s / 60}m` : `${s}s`);

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

  const handlePreset = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    setEditValues({
      min: mins.toString().padStart(3, '0'),
      sec: secs.toString().padStart(2, '0'),
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

  const presetBtnColor = isDark
    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    : isGlass
      ? 'bg-white/5 text-white/80 hover:bg-white/15'
      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-brand-blue-primary shadow-sm';

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full animate-in fade-in zoom-in-95 duration-200"
      style={{ padding: 'min(16px, 3cqmin)', gap: 'min(12px, 2.5cqmin)' }}
    >
      {/* Close button */}
      <button
        onClick={onCancel}
        className="self-end text-slate-400 hover:text-brand-red-primary transition-all"
        style={{ fontSize: 'min(20px, 5cqmin)' }}
        aria-label="Close keypad"
      >
        ×
      </button>

      {/* Selected time display */}
      <div
        className="flex items-center font-mono font-black tabular-nums"
        style={{ fontSize: 'min(48px, 15cqmin)', gap: 'min(8px, 2cqmin)' }}
      >
        <button
          onClick={() => setActiveField('min')}
          className={`rounded-xl border-2 transition-all ${
            activeField === 'min'
              ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary scale-105 shadow-lg'
              : 'border-transparent text-slate-400 opacity-40 hover:opacity-100'
          }`}
          style={{ padding: 'min(8px, 2cqmin) min(12px, 3cqmin)' }}
        >
          {editValues.min}
        </button>
        <span className="text-slate-300">:</span>
        <button
          onClick={() => setActiveField('sec')}
          className={`rounded-xl border-2 transition-all ${
            activeField === 'sec'
              ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary scale-105 shadow-lg'
              : 'border-transparent text-slate-400 opacity-40 hover:opacity-100'
          }`}
          style={{ padding: 'min(8px, 2cqmin) min(12px, 3cqmin)' }}
        >
          {editValues.sec}
        </button>
      </div>

      {/* Preset buttons row */}
      <div
        className="grid grid-cols-3 w-full"
        style={{
          gap: 'min(8px, 2cqmin)',
          fontSize: 'min(14px, 4cqmin)',
        }}
      >
        {PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => handlePreset(s)}
            className={`rounded-xl font-black transition-all active:scale-90 ${presetBtnColor}`}
            style={{ padding: 'min(12px, 3cqmin)' }}
          >
            {presetLabel(s)}
          </button>
        ))}
      </div>

      {/* Numpad grid */}
      <div
        className="grid grid-cols-3 w-full flex-1"
        style={{
          gap: 'min(8px, 2cqmin)',
          fontSize: 'min(20px, 6cqmin)',
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
    </div>
  );
};

// ─── Main Widget ────────────────────────────────────────────────────────────

export const TimeToolWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const {
    isRunning,
    config,
    handleStart,
    handleStop,
    handleReset,
    setTime,
  } = useTimeToolActions(widget);

  const [isEditing, setIsEditing] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

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

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div
      className={`h-full w-full flex flex-col overflow-hidden ${themeClasses}`}
    >
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
          <TimeToolDisplay
            widget={widget}
            onStop={handleStop}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </div>

      {/* ─── Footer (controls) ──────────────────────────────────── */}
      {!isEditing && (
        <div
          className="shrink-0 flex flex-col"
          style={{
            padding:
              'min(8px, 1.5cqmin) min(16px, 3.5cqmin) min(16px, 3.5cqmin)',
            gap: 'min(12px, 2.5cqmin)',
          }}
        >
          {/* Play/Pause + Reset */}
          <div className="flex" style={{ gap: 'min(12px, 2.5cqmin)' }}>
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
                height: 'min(80px, 12cqmin)',
                fontSize: 'min(20px, 3.5cqmin)',
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
              style={{ height: 'min(80px, 12cqmin)' }}
              aria-label="Reset"
            >
              <RotateCcw
                style={{
                  width: 'min(24px, 6cqmin)',
                  height: 'min(24px, 6cqmin)',
                }}
              />
            </button>
          </div>

          {/* Sound picker + version label */}
          <div className="flex justify-between items-center px-0.5">
            <div className="relative">
              <button
                onClick={() => setShowSoundPicker((v) => !v)}
                className={`flex items-center rounded-full transition-all border shadow-sm ${
                  config.theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-brand-blue-primary hover:bg-slate-700'
                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-brand-blue-primary hover:bg-slate-100'
                }`}
                style={{
                  gap: 'min(8px, 2cqmin)',
                  paddingLeft: 'min(16px, 4cqmin)',
                  paddingRight: 'min(16px, 4cqmin)',
                  paddingTop: 'min(8px, 2cqmin)',
                  paddingBottom: 'min(8px, 2cqmin)',
                }}
              >
                <Bell
                  className={
                    isRunning ? 'animate-pulse text-brand-blue-primary' : ''
                  }
                  style={{
                    width: 'min(16px, 4cqmin)',
                    height: 'min(16px, 4cqmin)',
                  }}
                />
                <span
                  className="font-black uppercase tracking-widest"
                  style={{ fontSize: 'min(12px, 3cqmin)' }}
                >
                  {config.selectedSound}
                </span>
              </button>

              {showSoundPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSoundPicker(false)}
                  />
                  <FloatingPanel
                    padding="sm"
                    className="absolute bottom-full left-0 mb-3 w-48 origin-bottom-left"
                  >
                    {SOUNDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          updateConfig({ selectedSound: s });
                          setShowSoundPicker(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-xxs font-black uppercase tracking-widest transition-all ${
                          config.selectedSound === s
                            ? 'bg-brand-blue-primary text-white shadow-md'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-brand-blue-primary'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </FloatingPanel>
                </>
              )}
            </div>

            <div
              className="flex items-center opacity-30 select-none"
              style={{ gap: 'min(4px, 1cqmin)' }}
            >
              <div
                className="rounded-full bg-brand-blue-primary"
                style={{
                  width: 'min(6px, 1.5cqmin)',
                  height: 'min(6px, 1.5cqmin)',
                }}
              />
              <span
                className="font-black text-slate-400 uppercase tracking-tighter"
                style={{ fontSize: 'min(14px, 4cqmin)' }}
              >
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
      {/* Mode Selection */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <label className="flex items-center gap-2 text-xxs font-black text-brand-blue-primary uppercase tracking-widest mb-3">
          <TimerIcon size={14} />
          Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['timer', 'stopwatch'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                if (m === 'timer') {
                  updateWidget(widget.id, {
                    config: {
                      ...config,
                      mode: 'timer',
                      duration: 600,
                      elapsedTime: 600,
                      isRunning: false,
                      startTime: null,
                    },
                  });
                } else {
                  updateWidget(widget.id, {
                    config: {
                      ...config,
                      mode: 'stopwatch',
                      elapsedTime: 0,
                      isRunning: false,
                      startTime: null,
                    },
                  });
                }
              }}
              className={`p-3 rounded-xl text-xxs font-black uppercase transition-all border-2 flex items-center justify-center gap-2 ${
                config.mode === m
                  ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary shadow-sm'
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-200'
              }`}
            >
              {m === 'timer' ? (
                <TimerIcon size={14} />
              ) : (
                <ClockIcon size={14} />
              )}
              {m === 'timer' ? 'Timer' : 'Stopwatch'}
            </button>
          ))}
        </div>
      </div>

      {/* Display Style */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <label className="flex items-center gap-2 text-xxs font-black text-brand-blue-primary uppercase tracking-widest mb-3">
          Display Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(['digital', 'visual'] as const).map((v) => (
            <button
              key={v}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, visualType: v },
                })
              }
              className={`p-3 rounded-xl text-xxs font-black uppercase transition-all border-2 ${
                config.visualType === v
                  ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary shadow-sm'
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-200'
              }`}
            >
              {v === 'digital' ? 'Digital' : 'Visual Ring'}
            </button>
          ))}
        </div>
      </div>

      {/* Theme */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
        <label className="flex items-center gap-2 text-xxs font-black text-brand-blue-primary uppercase tracking-widest mb-3">
          <Palette size={14} />
          Theme
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'glass'] as const).map((t) => (
            <button
              key={t}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, theme: t },
                })
              }
              className={`p-3 rounded-xl text-xxs font-black uppercase transition-all border-2 flex items-center justify-center gap-2 ${
                config.theme === t
                  ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary shadow-sm'
                  : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-200'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${t === 'light' ? 'bg-white border border-slate-200' : t === 'dark' ? 'bg-slate-900' : 'bg-slate-300'}`}
              />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

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
