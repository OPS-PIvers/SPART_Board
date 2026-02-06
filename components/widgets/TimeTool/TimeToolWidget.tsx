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
  Timer as TimerIcon,
  Clock as ClockIcon,
  Palette,
  CircleDot,
  Hash,
  ChevronLeft,
  Settings2,
} from 'lucide-react';
import { STANDARD_COLORS } from '../../../config/colors';
import { WidgetLayout as BaseWidgetLayout } from '../WidgetLayout';

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
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <div className="relative w-full aspect-square max-w-[80%] flex items-center justify-center">
        {isVisual && (
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
              stroke={ringColor()}
              strokeWidth="12"
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
          className={`transition-all duration-300 tabular-nums select-none font-black font-sans leading-none z-10 ${getStatusColor()} ${!isRunning && mode === 'timer' ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}`}
          style={{
            fontSize: isVisual ? 'min(20cqw, 25cqh)' : 'min(30cqw, 35cqh)',
            textShadow:
              theme === 'glass' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          {formatTime(time)}
        </button>
      </div>
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

  const btnClass = `aspect-square flex items-center justify-center rounded-2xl text-xl font-black transition-all active:scale-90 ${
    theme === 'dark'
      ? 'bg-slate-800 text-white hover:bg-slate-700'
      : theme === 'glass'
        ? 'bg-white/10 text-white hover:bg-white/20'
        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-brand-blue-primary shadow-sm'
  }`;

  return (
    <div className="flex flex-col items-center w-full h-full p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-4 mb-8 font-mono text-5xl font-black tabular-nums">
        <button
          onClick={() => setActiveField('min')}
          className={`px-6 py-3 rounded-2xl border-4 transition-all ${
            activeField === 'min'
              ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary scale-110 shadow-lg'
              : 'border-transparent text-slate-300 opacity-40 hover:opacity-100'
          }`}
        >
          {editValues.min}
        </button>
        <span className="text-slate-200">:</span>
        <button
          onClick={() => setActiveField('sec')}
          className={`px-6 py-3 rounded-2xl border-4 transition-all ${
            activeField === 'sec'
              ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary scale-110 shadow-lg'
              : 'border-transparent text-slate-400 opacity-40 hover:opacity-100'
          }`}
        >
          {editValues.sec}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-[300px]">
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
          <Delete size={24} />
        </button>
        <button onClick={() => handleInput('0')} className={btnClass}>
          0
        </button>
        <button
          onClick={() =>
            onConfirm(parseInt(editValues.min) * 60 + parseInt(editValues.sec))
          }
          className="aspect-square flex items-center justify-center rounded-2xl bg-brand-blue-primary text-white shadow-xl hover:bg-brand-blue-light active:scale-90"
          aria-label="Confirm time"
        >
          <Check size={28} strokeWidth={4} />
        </button>
      </div>

      <button
        onClick={onCancel}
        className="mt-8 px-6 py-2 rounded-full text-xxs font-black uppercase tracking-widest text-slate-400 hover:text-brand-red-primary hover:bg-brand-red-lighter/20 transition-all"
        aria-label="Close keypad"
      >
        Cancel & Go Back
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
  const [activeTab, setActiveTab] = useState<'display' | 'modes'>('display');

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

  const renderHeader = () => (
    <div
      className={`p-3 flex items-center justify-between border-b ${config.theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`}
    >
      <div className="flex items-center gap-2">
        {activeTab === 'modes' ? (
          <button
            onClick={() => setActiveTab('display')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
        ) : (
          <div className="p-2 bg-brand-blue-primary text-white rounded-xl shadow-sm">
            {mode === 'timer' ? (
              <TimerIcon size={18} />
            ) : (
              <ClockIcon size={18} />
            )}
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">
            {mode === 'timer' ? 'Countdown' : 'Elapsed'}
          </span>
          <span className="text-xs font-black uppercase tracking-tight leading-none">
            {mode === 'timer' ? 'Timer' : 'Stopwatch'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
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
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
        <button
          onClick={() =>
            setActiveTab(activeTab === 'modes' ? 'display' : 'modes')
          }
          className={`p-2 rounded-xl transition-all ${activeTab === 'modes' ? 'bg-brand-blue-primary text-white shadow-md' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        >
          <Settings2 size={18} />
        </button>
      </div>
    </div>
  );

  const renderModesMenu = () => (
    <div className="w-full h-full flex flex-col p-4 gap-6 animate-in slide-in-from-right duration-200">
      <div>
        <label className="text-xxs font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Switch Mode
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              updateConfig({
                mode: 'timer',
                duration: 600,
                elapsedTime: 600,
                isRunning: false,
                startTime: null,
              });
              setActiveTab('display');
            }}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${mode === 'timer' ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
          >
            <TimerIcon size={24} />
            <span className="text-xxs font-black uppercase">Timer</span>
          </button>
          <button
            onClick={() => {
              updateConfig({
                mode: 'stopwatch',
                elapsedTime: 0,
                isRunning: false,
                startTime: null,
              });
              setActiveTab('display');
            }}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${mode === 'stopwatch' ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
          >
            <ClockIcon size={24} />
            <span className="text-xxs font-black uppercase">Stopwatch</span>
          </button>
        </div>
      </div>

      <div>
        <label className="text-xxs font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Visual Style
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateConfig({ visualType: 'digital' })}
            className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${!isVisual ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
          >
            <Hash size={20} />
            <span className="text-xxs font-black uppercase">Digital Only</span>
          </button>
          <button
            onClick={() => updateConfig({ visualType: 'visual' })}
            className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${isVisual ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
          >
            <CircleDot size={20} />
            <span className="text-xxs font-black uppercase">Visual Ring</span>
          </button>
        </div>
      </div>

      <Button
        variant="secondary"
        className="mt-auto w-full py-4"
        onClick={() => setActiveTab('display')}
      >
        Done & Show Timer
      </Button>
    </div>
  );

  return (
    <BaseWidgetLayout
      padding="p-0"
      header={renderHeader()}
      content={
        <div
          className={`flex-1 flex flex-col items-center justify-center relative ${themeClass}`}
        >
          {activeTab === 'modes' ? (
            renderModesMenu()
          ) : isEditing ? (
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
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
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
                <div className="flex flex-wrap justify-center gap-2 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {[60, 300, 600, 900, 1800].map((s) => (
                    <button
                      key={s}
                      onClick={() => setTime(s)}
                      className={`px-4 py-2 rounded-xl text-xxs font-black transition-all hover:scale-105 active:scale-95 ${
                        config.elapsedTime === s
                          ? 'bg-brand-blue-primary text-white shadow-lg'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-brand-blue-primary shadow-sm'
                      }`}
                    >
                      {s >= 60 ? `${s / 60}m` : `${s}s`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      }
      footer={
        activeTab === 'display' && !isEditing ? (
          <div
            className={`p-4 pt-0 flex flex-col gap-4 rounded-b-xl ${themeClass}`}
          >
            <div className="flex gap-3">
              <Button
                variant={isRunning ? 'secondary' : 'hero'}
                size="lg"
                className="flex-[3] h-16 text-sm"
                onClick={isRunning ? () => handleStop() : handleStart}
                icon={
                  isRunning ? (
                    <Pause size={24} fill="currentColor" />
                  ) : (
                    <Play size={24} fill="currentColor" />
                  )
                }
              >
                {isRunning ? 'PAUSE' : 'START'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="aspect-square h-16 p-0 hover:text-brand-blue-primary transition-colors"
                onClick={handleReset}
                icon={<RotateCcw size={24} />}
              />
            </div>

            <div className="flex justify-between items-center px-1">
              <div className="relative">
                <button
                  onClick={() => setShowSoundPicker(!showSoundPicker)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-brand-blue-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700 shadow-sm"
                >
                  <Bell
                    size={14}
                    className={
                      isRunning ? 'animate-pulse text-brand-blue-primary' : ''
                    }
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {config.selectedSound}
                  </span>
                </button>

                {showSoundPicker && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSoundPicker(false)}
                    />
                    <div className="absolute bottom-full left-0 mb-3 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 p-2 z-50 animate-in slide-in-from-bottom-2 zoom-in-95 duration-200">
                      {(['Chime', 'Blip', 'Gong', 'Alert'] as const).map(
                        (s) => (
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
                        )
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 opacity-30 select-none">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue-primary" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                  Timer v2.1
                </span>
              </div>
            </div>
          </div>
        ) : undefined
      }
    />
  );
};

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
            <span className="text-xl mt-0.5">💡</span>
            <p className="font-bold leading-snug">
              Pro Tip: Add an &quot;Expectations&quot; widget to enable
              automatic voice level changes when the timer hits zero!
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
                  timerEndVoiceLevel === null ||
                  timerEndVoiceLevel === undefined
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
