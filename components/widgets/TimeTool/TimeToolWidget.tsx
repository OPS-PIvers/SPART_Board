import React, { useState, useCallback, useMemo } from 'react';
import {
  TimeToolConfig,
  WidgetData,
  DEFAULT_GLOBAL_STYLE,
} from '../../../types';
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
  Type,
  Palette,
  Sun,
  Sparkles,
} from 'lucide-react';
import { WIDGET_PALETTE, STANDARD_COLORS } from '../../../config/colors';
import { FloatingPanel } from '../../common/FloatingPanel';
import { WidgetLayout } from '../WidgetLayout';
import { SettingsLabel } from '../../common/SettingsLabel';

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRESETS = [60, 180, 300] as const;
const SOUNDS = ['Chime', 'Blip', 'Gong', 'Alert'] as const;

const presetLabel = (s: number) => (s >= 60 ? `${s / 60}m` : `${s}s`);

// ─── Progress Ring ──────────────────────────────────────────────────────────

const ProgressRing: React.FC<{
  progress: number; // 0 to 1
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
}> = ({ onConfirm, onCancel, initialSeconds }) => {
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

  const btnBase =
    'aspect-square flex items-center justify-center rounded-2xl font-black transition-all active:scale-90';
  const btnColor =
    'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';
  const presetBtnColor =
    'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600';

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
  const { updateWidget, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
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

  const {
    themeColor = STANDARD_COLORS.slate,
    glow = false,
    fontFamily = 'global',
    clockStyle = 'modern',
  } = config;

  const updateConfig = useCallback(
    (patch: Partial<TimeToolConfig>) => {
      updateWidget(widget.id, { config: { ...config, ...patch } });
    },
    [updateWidget, widget.id, config]
  );

  // ─── Parse time into parts ───────────────────────────────────────

  const timeParts = useMemo(() => {
    const mins = Math.floor(displayTime / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor(displayTime % 60)
      .toString()
      .padStart(2, '0');
    const tenths = Math.floor((displayTime % 1) * 10).toString();
    return { mins, secs, tenths };
  }, [displayTime]);

  // ─── Derived styles ──────────────────────────────────────────────

  const getTimeColor = () => {
    if (mode === 'timer') {
      if (displayTime <= 60) return STANDARD_COLORS.red;
      if (displayTime / config.duration <= 0.25) return STANDARD_COLORS.amber;
    }
    return themeColor;
  };

  const getRingColor = () => {
    if (mode === 'timer') {
      if (displayTime <= 60) return STANDARD_COLORS.red;
      if (config.duration > 0 && displayTime / config.duration <= 0.25) {
        return STANDARD_COLORS.amber;
      }
    }
    return themeColor;
  };

  const getStyleClasses = () => {
    switch (clockStyle) {
      case 'lcd':
        return 'tracking-widest opacity-90';
      case 'minimal':
        return 'tracking-tighter';
      default:
        return '';
    }
  };

  const getFontClass = () => {
    if (fontFamily === 'global') {
      return `font-${globalStyle.fontFamily}`;
    }
    return fontFamily;
  };

  const progress =
    mode === 'timer' && config.duration > 0 ? displayTime / config.duration : 1;

  const timeColor = getTimeColor();

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div
          className={`h-full w-full flex flex-col items-center justify-center transition-all duration-500 ${
            clockStyle === 'lcd' ? 'bg-black/5' : ''
          }`}
          style={{ padding: 'min(4px, 1cqmin)' }}
        >
          {isEditing ? (
            <Keypad
              initialSeconds={config.elapsedTime}
              onConfirm={(s) => {
                setTime(s);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              {/* Time display - matches Clock structure */}
              <div className="flex-1 min-h-0 w-full flex items-center justify-center">
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    width: isVisual ? 'min(90%, 90cqmin)' : 'auto',
                    aspectRatio: isVisual ? '1' : undefined,
                  }}
                >
                  {isVisual && (
                    <ProgressRing
                      progress={progress}
                      ringColor={getRingColor()}
                    />
                  )}

                  <button
                    onClick={() => {
                      if (!isRunning && mode === 'timer') setIsEditing(true);
                    }}
                    disabled={isRunning || mode !== 'timer'}
                    className={`relative z-10 flex items-baseline leading-none transition-all ${getFontClass()} ${getStyleClasses()} ${
                      !isRunning && mode === 'timer'
                        ? 'cursor-pointer hover:scale-105 active:scale-95'
                        : 'cursor-default'
                    }`}
                    style={{
                      fontSize: isVisual
                        ? '28cqmin'
                        : mode === 'stopwatch'
                          ? '40cqmin'
                          : '45cqmin',
                      color: timeColor,
                      textShadow: glow
                        ? `0 0 0.1em ${timeColor}, 0 0 0.25em ${timeColor}66`
                        : 'none',
                    }}
                  >
                    {clockStyle === 'lcd' && !isVisual && (
                      <div
                        className="absolute opacity-5 pointer-events-none select-none flex"
                        aria-hidden="true"
                        role="presentation"
                      >
                        <span>88</span>
                        <span className="mx-[0.25em]">:</span>
                        <span>88</span>
                        {mode === 'stopwatch' && (
                          <>
                            <span className="opacity-30 mx-[0.05em]">.</span>
                            <span>8</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Minutes and colon (shared between timer/stopwatch) */}
                    <span>{timeParts.mins}</span>
                    <span
                      className={`${clockStyle === 'minimal' ? '' : 'animate-pulse'} mx-[0.1em] opacity-30`}
                    >
                      :
                    </span>
                    <span>{timeParts.secs}</span>
                    {/* Tenths digit (stopwatch only) */}
                    {mode === 'stopwatch' && (
                      <>
                        <span
                          className="opacity-30 mx-[0.05em]"
                          style={{ fontSize: '0.5em' }}
                        >
                          .
                        </span>
                        <span
                          className="opacity-60"
                          style={{ fontSize: '0.5em' }}
                        >
                          {timeParts.tenths}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Controls footer - compact, transparent */}
              <div
                className="shrink-0 w-full flex flex-col"
                style={{
                  padding: '0 min(12px, 2.5cqmin) min(8px, 1.5cqmin)',
                  gap: 'min(6px, 1.5cqmin)',
                }}
              >
                {/* Play/Pause + Reset */}
                <div className="flex" style={{ gap: 'min(6px, 1.5cqmin)' }}>
                  <button
                    onClick={
                      isRunning ? () => handleStop() : () => void handleStart()
                    }
                    className={`flex-[3] flex items-center justify-center rounded-lg font-black uppercase tracking-widest transition-all active:scale-[0.97] ${
                      isRunning
                        ? 'bg-slate-200/60 text-slate-500 hover:bg-slate-300/70'
                        : 'bg-brand-blue-primary text-white shadow-lg shadow-brand-blue-primary/30 hover:bg-brand-blue-dark hover:-translate-y-0.5'
                    }`}
                    style={{
                      height: 'min(44px, 10cqmin)',
                      fontSize: 'min(12px, 3cqmin)',
                      gap: 'min(6px, 1.5cqmin)',
                    }}
                  >
                    {isRunning ? (
                      <Pause
                        className="w-[1.2em] h-[1.2em]"
                        fill="currentColor"
                      />
                    ) : (
                      <Play
                        className="w-[1.2em] h-[1.2em]"
                        fill="currentColor"
                      />
                    )}
                    {isRunning ? 'PAUSE' : 'START'}
                  </button>
                  <button
                    onClick={handleReset}
                    className="aspect-square flex items-center justify-center rounded-lg bg-slate-200/60 text-slate-400 hover:bg-slate-300/70 hover:text-brand-blue-primary transition-all active:scale-95"
                    style={{ height: 'min(44px, 10cqmin)' }}
                    aria-label="Reset"
                  >
                    <RotateCcw
                      style={{
                        width: 'min(16px, 4cqmin)',
                        height: 'min(16px, 4cqmin)',
                      }}
                    />
                  </button>
                </div>

                {/* Sound picker row */}
                <div className="flex justify-between items-center">
                  <div className="relative">
                    <button
                      onClick={() => setShowSoundPicker((v) => !v)}
                      className="flex items-center rounded-full transition-all text-slate-400 hover:text-brand-blue-primary"
                      style={{
                        gap: 'min(4px, 1cqmin)',
                        paddingLeft: 'min(8px, 2cqmin)',
                        paddingRight: 'min(8px, 2cqmin)',
                        paddingTop: 'min(4px, 1cqmin)',
                        paddingBottom: 'min(4px, 1cqmin)',
                      }}
                    >
                      <Bell
                        className={
                          isRunning
                            ? 'animate-pulse text-brand-blue-primary'
                            : ''
                        }
                        style={{
                          width: 'min(12px, 3cqmin)',
                          height: 'min(12px, 3cqmin)',
                        }}
                      />
                      <span
                        className="font-black uppercase tracking-widest"
                        style={{ fontSize: 'min(10px, 2.5cqmin)' }}
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

                  {/* Mode indicator */}
                  <div
                    className="flex items-center opacity-30 select-none"
                    style={{ gap: 'min(4px, 1cqmin)' }}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        width: 'min(5px, 1.2cqmin)',
                        height: 'min(5px, 1.2cqmin)',
                        backgroundColor: themeColor,
                      }}
                    />
                    <span
                      className="font-black text-slate-400 uppercase tracking-tighter"
                      style={{ fontSize: 'min(10px, 2.5cqmin)' }}
                    >
                      {mode === 'timer' ? 'Timer' : 'Stopwatch'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};

// ─── Settings Panel ─────────────────────────────────────────────────────────

export const TimeToolSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as TimeToolConfig;
  const {
    timerEndVoiceLevel,
    fontFamily = 'global',
    clockStyle = 'modern',
    themeColor = STANDARD_COLORS.slate,
  } = config;

  const hasExpectations = activeDashboard?.widgets.some(
    (w) => w.type === 'expectations'
  );

  const fonts = [
    { id: 'global', label: 'Inherit', icon: 'G' },
    { id: 'font-mono', label: 'Digital', icon: '01' },
    { id: 'font-sans', label: 'Modern', icon: 'Aa' },
    { id: 'font-handwritten', label: 'School', icon: '\u270F\uFE0F' },
  ];

  const styles = [
    { id: 'modern', label: 'Default' },
    { id: 'lcd', label: 'LCD Panel' },
    { id: 'minimal', label: 'Minimal' },
  ];

  const colors = WIDGET_PALETTE;

  return (
    <div className="space-y-6 p-1">
      {/* Mode Selection */}
      <div>
        <SettingsLabel icon={TimerIcon}>Mode</SettingsLabel>
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
              className={`p-2 rounded-lg text-xxs font-black uppercase transition-all border-2 flex items-center justify-center gap-2 ${
                config.mode === m
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600'
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
      <div>
        <SettingsLabel icon={Sparkles}>Display Style</SettingsLabel>
        <div className="grid grid-cols-2 gap-2">
          {(['digital', 'visual'] as const).map((v) => (
            <button
              key={v}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, visualType: v },
                })
              }
              className={`p-2 rounded-lg text-xxs font-black uppercase transition-all border-2 ${
                config.visualType === v
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {v === 'digital' ? 'Digital' : 'Visual Ring'}
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div>
        <SettingsLabel icon={Type}>Typography</SettingsLabel>
        <div className="grid grid-cols-4 gap-2">
          {fonts.map((f) => (
            <button
              key={f.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, fontFamily: f.id },
                })
              }
              className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${fontFamily === f.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
            >
              <span
                className={`text-sm ${f.id === 'global' ? 'font-sans' : f.id} text-slate-900`}
              >
                {f.icon}
              </span>
              <span className="text-xxxs uppercase text-slate-600">
                {f.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Clock Style */}
      <div>
        <SettingsLabel icon={Sparkles}>Number Style</SettingsLabel>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {styles.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, clockStyle: s.id },
                })
              }
              className={`flex-1 py-1.5 text-xxs rounded-lg transition-all ${clockStyle === s.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {s.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Color & Glow */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <SettingsLabel icon={Palette}>Color Palette</SettingsLabel>
          <div className="flex gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() =>
                  updateWidget(widget.id, {
                    config: { ...config, themeColor: c },
                  })
                }
                className={`w-6 h-6 rounded-full border-2 transition-all ${themeColor === c ? 'border-slate-800 scale-125 shadow-md' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, glow: !config.glow },
            })
          }
          className={`p-2 rounded-lg border-2 flex items-center gap-2 transition-all ${config.glow ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
        >
          <Sun className={`w-4 h-4 ${config.glow ? 'fill-current' : ''}`} />
          <span className="text-xxs uppercase">Glow</span>
        </button>
      </div>

      {/* Timer End Action */}
      <div>
        <SettingsLabel icon={Bell}>Timer End Action</SettingsLabel>

        {!hasExpectations ? (
          <div className="text-xs text-brand-red-primary bg-brand-red-lighter/20 p-4 rounded-2xl border border-brand-red-lighter/30 flex items-start gap-3">
            <span className="text-xl mt-0.5">&#128161;</span>
            <p className="font-bold leading-snug">
              Add an &quot;Expectations&quot; widget to enable automatic voice
              level changes when the timer hits zero!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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
                className={`p-2 rounded-lg text-xxs font-black uppercase transition-all border-2 ${
                  timerEndVoiceLevel == null
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600'
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
                  className={`p-2 rounded-lg text-xxs font-black uppercase transition-all border-2 ${
                    timerEndVoiceLevel === level
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600'
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
