import React, { useState } from 'react';
import { TimeToolConfig, WidgetData } from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { useTimeTool } from './useTimeTool';
import { Button } from '../../common/Button';
import {
  Play,
  Pause,
  RotateCcw,
  Bell,
  Check,
  Delete,
  Timer,
  Clock,
  Palette,
  CircleDot,
  Hash,
} from 'lucide-react';
import { STANDARD_COLORS } from '../../../config/colors';

// --- Sub-components ---

const TimeDisplay: React.FC<{
  time: number;
  mode: 'timer' | 'stopwatch';
  visualType: 'digital' | 'visual';
  isRunning: boolean;
  duration: number;
  onEdit: () => void;
  theme: 'light' | 'dark' | 'glass';
}> = ({ time, mode, visualType, isRunning, duration, onEdit, theme }) => {
  const isVisual = visualType === 'visual';

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    if (mode === 'stopwatch') {
      const ms = Math.floor((totalSeconds % 1) * 10);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (mode !== 'timer') return 'text-brand-blue-primary';
    const percent = time / duration;
    if (time <= 60) return 'text-brand-red-primary';
    if (percent <= 0.25) return 'text-amber-500';
    return theme === 'light' ? 'text-slate-900' : 'text-white';
  };

  const ringColor = () => {
    if (time <= 60) return STANDARD_COLORS.red;
    if (time / duration <= 0.25) return STANDARD_COLORS.amber;
    return STANDARD_COLORS.blue;
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      {isVisual && (
        <svg
          className="absolute inset-0 w-full h-full p-6"
          viewBox="0 0 220 220"
          preserveAspectRatio="xMidYMid meet"
        >
          <circle
            className="opacity-10"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            r="95"
            cx="110"
            cy="110"
          />
          <circle
            className="transition-all duration-75 ease-linear"
            stroke={ringColor()}
            strokeWidth="8"
            strokeLinecap="round"
            fill="transparent"
            r="95"
            cx="110"
            cy="110"
            strokeDasharray="597"
            strokeDashoffset={
              597 - (mode === 'timer' ? time / duration : 1) * 597
            }
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
      )}
      <button
        onClick={onEdit}
        disabled={isRunning || mode !== 'timer'}
        className={`transition-all duration-300 tabular-nums select-none font-black font-sans leading-none ${getStatusColor()} ${!isRunning && mode === 'timer' ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}`}
        style={{
          fontSize: isVisual ? 'min(22cqw, 30cqh)' : 'min(32cqw, 40cqh)',
          textShadow: theme === 'glass' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
        }}
      >
        {formatTime(time)}
      </button>
    </div>
  );
};

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

  const btnClass = `aspect-square flex items-center justify-center rounded-full text-lg font-black transition-all active:scale-90 ${
    theme === 'dark'
      ? 'bg-slate-800 text-white hover:bg-slate-700'
      : theme === 'glass'
        ? 'bg-white/10 text-white hover:bg-white/20'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
  }`;

  return (
    <div className="flex flex-col items-center w-full max-w-[320px] p-4 bg-inherit rounded-xl">
      <div className="flex items-center gap-2 mb-6 font-mono text-4xl font-black tabular-nums">
        <button
          onClick={() => setActiveField('min')}
          className={`px-4 py-2 rounded-xl border-2 transition-all ${
            activeField === 'min'
              ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary scale-110 shadow-md'
              : 'border-transparent text-slate-400 opacity-60'
          }`}
        >
          {editValues.min}
        </button>
        <span className="text-slate-300">:</span>
        <button
          onClick={() => setActiveField('sec')}
          className={`px-4 py-2 rounded-xl border-2 transition-all ${
            activeField === 'sec'
              ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary scale-110 shadow-md'
              : 'border-transparent text-slate-400 opacity-60'
          }`}
        >
          {editValues.sec}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleInput(n.toString())}
            className={btnClass}
          >
            {n}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className={btnClass}
          aria-label="Backspace"
        >
          <Delete size={20} />
        </button>
        <button onClick={() => handleInput('0')} className={btnClass}>
          0
        </button>
        <button
          onClick={() =>
            onConfirm(parseInt(editValues.min) * 60 + parseInt(editValues.sec))
          }
          className="aspect-square flex items-center justify-center rounded-full bg-brand-blue-primary text-white shadow-lg active:scale-90"
          aria-label="Confirm time"
        >
          <Check size={20} strokeWidth={3} />
        </button>
      </div>

      <button
        onClick={onCancel}
        className="mt-4 text-xxs font-black uppercase tracking-widest text-slate-400 hover:text-brand-red-primary transition-colors"
        aria-label="Close keypad"
      >
        Cancel
      </button>
    </div>
  );
};

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
  const themeClass =
    config.theme === 'dark'
      ? 'bg-slate-900 text-white'
      : config.theme === 'glass'
        ? 'bg-white/10 backdrop-blur-xl text-white'
        : 'bg-white text-slate-900';

  const updateConfig = (newConfig: Partial<TimeToolConfig>) => {
    updateWidget(widget.id, {
      config: { ...config, ...newConfig },
    });
  };

  return (
    <div
      className={`h-full w-full flex flex-col p-0 ${themeClass} rounded-xl overflow-hidden`}
    >
      {/* Header */}
      <div className="shrink-0 p-3 pb-0 flex flex-col gap-3">
        {/* Top Bar: Mode & Theme */}
        <div className="flex justify-between items-center">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
            <button
              onClick={() =>
                updateConfig({
                  mode: 'timer',
                  duration: 600,
                  elapsedTime: 600,
                  isRunning: false,
                  startTime: null,
                })
              }
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xxs font-black uppercase tracking-widest transition-all ${mode === 'timer' ? 'bg-white dark:bg-slate-700 text-brand-blue-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Timer size={12} />
              Timer
            </button>
            <button
              onClick={() =>
                updateConfig({
                  mode: 'stopwatch',
                  elapsedTime: 0,
                  isRunning: false,
                  startTime: null,
                })
              }
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xxs font-black uppercase tracking-widest transition-all ${mode === 'stopwatch' ? 'bg-white dark:bg-slate-700 text-brand-blue-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Clock size={12} />
              Stopwatch
            </button>
          </div>

          <div className="flex gap-1.5">
            {(['light', 'dark', 'glass'] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateConfig({ theme: t })}
                className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 active:scale-95 ${
                  config.theme === t
                    ? 'border-brand-blue-primary scale-110 shadow-sm'
                    : 'border-slate-200 opacity-40 hover:opacity-100'
                } ${t === 'light' ? 'bg-white' : t === 'dark' ? 'bg-slate-900' : 'bg-slate-300'}`}
              />
            ))}
          </div>
        </div>

        {/* Type Toggle (Digital/Visual) */}
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => updateConfig({ visualType: 'digital' })}
            className={`pb-2 px-1 flex items-center gap-2 text-xxs font-black uppercase tracking-widest transition-all border-b-2 ${!isVisual ? 'border-brand-blue-primary text-brand-blue-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Hash size={12} />
            Digital
          </button>
          <button
            onClick={() => updateConfig({ visualType: 'visual' })}
            className={`pb-2 px-1 flex items-center gap-2 text-xxs font-black uppercase tracking-widest transition-all border-b-2 ${isVisual ? 'border-brand-blue-primary text-brand-blue-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <CircleDot size={12} />
            Visual
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-0">
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
          <>
            <TimeDisplay
              time={displayTime}
              mode={mode}
              visualType={config.visualType}
              isRunning={isRunning}
              duration={config.duration}
              onEdit={() => setIsEditing(true)}
              theme={config.theme}
            />

            {!isVisual && mode === 'timer' && !isRunning && (
              <div className="flex flex-wrap justify-center gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {[60, 300, 600, 900, 1800].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTime(s)}
                    className={`px-3 py-1.5 rounded-lg text-xxs font-black transition-all hover:scale-105 active:scale-95 ${
                      config.elapsedTime === s
                        ? 'bg-brand-blue-primary text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s >= 60 ? `${s / 60}m` : `${s}s`}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 p-4 pt-0 flex flex-col gap-4">
        <div className="flex gap-3">
          <Button
            variant={isRunning ? 'secondary' : 'hero'}
            size="lg"
            className="flex-[3] h-14"
            onClick={isRunning ? () => handleStop() : handleStart}
            icon={
              isRunning ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" />
              )
            }
          >
            {isRunning ? 'PAUSE' : 'START'}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="aspect-square h-14 p-0"
            onClick={handleReset}
            icon={<RotateCcw size={20} />}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="relative">
            <button
              onClick={() => setShowSoundPicker(!showSoundPicker)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-blue-primary transition-all"
            >
              <Bell size={12} className={isRunning ? 'animate-pulse' : ''} />
              <span className="text-xxs font-black uppercase tracking-widest">
                {config.selectedSound}
              </span>
            </button>

            {showSoundPicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSoundPicker(false)}
                />
                <div className="absolute bottom-full left-0 mb-2 w-44 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-2 z-50 animate-in slide-in-from-bottom-2 zoom-in-95 duration-200">
                  {(['Chime', 'Blip', 'Gong', 'Alert'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        updateConfig({ selectedSound: s });
                        setShowSoundPicker(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-xxs font-black uppercase tracking-widest transition-all ${
                        config.selectedSound === s
                          ? 'bg-brand-blue-primary text-white shadow-md'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="text-xxxs font-black text-slate-300 uppercase tracking-tighter">
            SPART Board Timer v2
          </div>
        </div>
      </div>
    </div>
  );
};

export const TimeToolSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as TimeToolConfig;
  const { timerEndVoiceLevel } = config;

  const hasWorkSymbols = activeDashboard?.widgets.some(
    (w) => w.type === 'workSymbols'
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <label className="flex items-center gap-2 text-xxs font-black text-brand-blue-primary uppercase tracking-widest mb-4">
          <Palette size={14} />
          Timer Completion Action
        </label>

        {!hasWorkSymbols ? (
          <div className="text-xs text-brand-red-primary bg-brand-red-lighter/30 p-3 rounded-xl border border-brand-red-lighter flex items-center gap-3">
            <span className="text-lg">⚠️</span>
            <p className="font-medium">
              Add a &quot;Work Symbols&quot; widget to automatically change
              voice levels when the timer ends.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select a voice level to activate when the timer reaches zero:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() =>
                  updateWidget(widget.id, {
                    config: { ...config, timerEndVoiceLevel: null },
                  })
                }
                className={`p-3 rounded-xl text-xxs font-black uppercase transition-all border-2 ${
                  timerEndVoiceLevel === null ||
                  timerEndVoiceLevel === undefined
                    ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary'
                    : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'
                }`}
              >
                No Change
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
                      ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary'
                      : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  Level {level}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
