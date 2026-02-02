import React, { useState, useEffect, useRef } from 'react';
import {
  TimeToolConfig,
  WidgetData,
  WorkSymbolsConfig,
  WidgetConfig,
} from '../../types';
import { useDashboard } from '../../context/useDashboard';
import { Play, Pause, RotateCcw, Bell, Delete, Check, X } from 'lucide-react';
import { Button } from '../common/Button';
import { playTimerAlert, resumeAudio } from '../../utils/timeToolAudio';

const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface Props {
  widget: WidgetData;
}

export const TimeToolWidget: React.FC<Props> = ({ widget }) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as TimeToolConfig;
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [activeField, setActiveField] = useState<'min' | 'sec'>('min');
  const [editValues, setEditValues] = useState({ min: '00', sec: '00' });

  // Local state for the smooth display time while running
  const [runningDisplayTime, setRunningDisplayTime] = useState(
    config.elapsedTime
  );
  const displayTimeRef = useRef(runningDisplayTime);

  // The actual time to show: derived from config if stopped, from state if running
  const displayTime = config.isRunning
    ? runningDisplayTime
    : config.elapsedTime;

  // Keep ref in sync for callbacks
  useEffect(() => {
    displayTimeRef.current = displayTime;
  }, [displayTime]);

  const handleStop = React.useCallback(
    (finalTime?: number) => {
      updateWidget(widget.id, {
        config: {
          ...config,
          isRunning: false,
          elapsedTime: finalTime ?? displayTimeRef.current,
          startTime: null,
        },
      });
    },
    [config, updateWidget, widget.id]
  );

  const handleStart = async () => {
    await resumeAudio();
    updateWidget(widget.id, {
      config: {
        ...config,
        isRunning: true,
        startTime: Date.now(),
        elapsedTime: displayTime,
      },
    });
    setRunningDisplayTime(displayTime);
  };

  const handleReset = () => {
    const resetTime = config.mode === 'timer' ? config.duration : 0;
    updateWidget(widget.id, {
      config: {
        ...config,
        isRunning: false,
        elapsedTime: resetTime,
        startTime: null,
      },
    });
    setRunningDisplayTime(resetTime);
  };

  // --- TICKING LOGIC ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (config.isRunning && config.startTime) {
      const start = config.startTime;
      const base = config.elapsedTime;
      const sound = config.selectedSound;

      interval = setInterval(() => {
        const delta = (Date.now() - start) / 1000;
        let next: number;
        if (config.mode === 'timer') {
          next = Math.max(0, base - delta);
          if (next === 0) {
            handleStop(0);
            playTimerAlert(sound);

            // Auto-switch voice level if configured
            if (
              config.timerEndVoiceLevel !== undefined &&
              config.timerEndVoiceLevel !== null &&
              activeDashboard
            ) {
              const wsWidget = activeDashboard.widgets.find(
                (w) => w.type === 'workSymbols'
              );
              if (wsWidget) {
                const newConfig = {
                  ...(wsWidget.config || {}),
                  voiceLevel: config.timerEndVoiceLevel,
                } as unknown as WorkSymbolsConfig;

                updateWidget(wsWidget.id, {
                  config: newConfig as unknown as WidgetConfig,
                });
              }
            }
          }
        } else {
          next = base + delta;
        }
        setRunningDisplayTime(next);
      }, 50);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    config.isRunning,
    config.startTime,
    config.elapsedTime,
    config.mode,
    config.selectedSound,
    handleStop,
    activeDashboard,
    config.timerEndVoiceLevel,
    updateWidget,
  ]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    if (config.mode === 'stopwatch') {
      const ms = Math.floor((totalSeconds % 1) * 10);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const setTime = (s: number) => {
    updateWidget(widget.id, {
      config: {
        ...config,
        elapsedTime: s,
        duration: s,
        isRunning: false,
        startTime: null,
      },
    });
    setRunningDisplayTime(s);
  };

  const startEditing = () => {
    if (config.mode !== 'timer' || config.isRunning) return;
    const m = Math.floor(config.elapsedTime / 60);
    const s = Math.floor(config.elapsedTime % 60);
    setEditValues({
      min: m.toString().padStart(3, '0'),
      sec: s.toString().padStart(2, '0'),
    });
    setIsEditing(true);
    setActiveField('min');
  };

  const confirmEdit = () => {
    const totalSeconds =
      parseInt(editValues.min) * 60 + parseInt(editValues.sec);
    setTime(totalSeconds);
    setIsEditing(false);
  };

  const handleKeypadInput = (num: string) => {
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
      const next = ('0' + prev[activeField]).slice(0, -1).padStart(limit, '0');
      return { ...prev, [activeField]: next };
    });
  };

  const isVisual = config.visualType === 'visual';
  const themeClass =
    config.theme === 'dark'
      ? 'bg-slate-900 text-white'
      : config.theme === 'glass'
        ? 'bg-white/20 backdrop-blur-xl text-white'
        : 'bg-white text-slate-900';

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-[2.5rem] shadow-xl border border-white/30 transition-all duration-500 w-full overflow-hidden container-type-size',
        themeClass
      )}
    >
      {/* Header */}
      <div className="px-[6cqmin] pt-[6cqmin] flex justify-between items-center shrink-0">
        <div className="bg-slate-400/10 p-1 rounded-xl flex items-center relative w-[32cqmin] shrink-0">
          <div
            className={cn(
              'absolute w-[calc(50%-4px)] h-[calc(100%-8px)] bg-blue-500 rounded-lg shadow-sm transition-transform duration-300',
              isVisual ? 'translate-x-full' : 'translate-x-0'
            )}
          />
          <button
            onClick={() =>
              updateWidget(widget.id, {
                config: { ...config, visualType: 'digital' },
              })
            }
            className={cn(
              'relative z-10 flex-1 py-1 text-[10px] font-black uppercase tracking-wider transition-colors',
              !isVisual ? 'text-white' : 'text-slate-400'
            )}
          >
            Digital
          </button>
          <button
            onClick={() =>
              updateWidget(widget.id, {
                config: { ...config, visualType: 'visual' },
              })
            }
            className={cn(
              'relative z-10 flex-1 py-1 text-[10px] font-black uppercase tracking-wider transition-colors',
              isVisual ? 'text-white' : 'text-slate-400'
            )}
          >
            Visual
          </button>
        </div>
        <div className="flex gap-[1.5cqmin] shrink-0">
          {(['light', 'dark', 'glass'] as const).map((t) => (
            <button
              key={t}
              onClick={() =>
                updateWidget(widget.id, { config: { ...config, theme: t } })
              }
              className={cn(
                'w-[4cqmin] h-[4cqmin] rounded-full border border-black/10 shadow-sm transition-transform hover:scale-110 active:scale-95',
                t === 'light'
                  ? 'bg-white'
                  : t === 'dark'
                    ? 'bg-slate-800'
                    : 'bg-white/30 backdrop-blur-md'
              )}
            />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="px-[6cqmin] mt-[4cqmin] flex gap-[4cqmin] border-b border-white/5 shrink-0"
        role="tablist"
      >
        <button
          role="tab"
          aria-selected={config.mode === 'timer'}
          onClick={() => {
            updateWidget(widget.id, {
              config: {
                ...config,
                mode: 'timer',
                elapsedTime: 600,
                duration: 600,
                isRunning: false,
                startTime: null,
              },
            });
            setRunningDisplayTime(600);
          }}
          className={cn(
            'pb-2 text-[10px] font-black uppercase tracking-widest transition-all',
            config.mode === 'timer'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-slate-400'
          )}
        >
          Timer
        </button>
        <button
          role="tab"
          aria-selected={config.mode === 'stopwatch'}
          onClick={() => {
            updateWidget(widget.id, {
              config: {
                ...config,
                mode: 'stopwatch',
                elapsedTime: 0,
                isRunning: false,
                startTime: null,
              },
            });
            setRunningDisplayTime(0);
          }}
          className={cn(
            'pb-2 text-[10px] font-black uppercase tracking-widest transition-all',
            config.mode === 'stopwatch'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-slate-400'
          )}
        >
          Stopwatch
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {isEditing ? (
          <div className="flex-1 flex flex-col items-center justify-center px-[6cqmin] animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-[2cqmin] mb-[4cqmin] font-black text-[12cqmin] tabular-nums">
              <button
                onClick={() => setActiveField('min')}
                className={cn(
                  'px-[3cqmin] py-[1cqmin] rounded-xl border-2 transition-colors',
                  activeField === 'min'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-transparent text-slate-400'
                )}
              >
                {editValues.min}
              </button>
              <span className="text-slate-300">:</span>
              <button
                onClick={() => setActiveField('sec')}
                className={cn(
                  'px-[3cqmin] py-[1cqmin] rounded-xl border-2 transition-colors',
                  activeField === 'sec'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                    : 'border-transparent text-slate-400'
                )}
              >
                {editValues.sec}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-[2cqmin] w-full max-w-[220px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  onClick={() => handleKeypadInput(n.toString())}
                  className="py-[2.5cqmin] rounded-xl font-black text-[4cqmin] bg-slate-400/10 hover:bg-slate-400/20 active:scale-95 transition-all"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                aria-label="Backspace"
                className="py-[2.5cqmin] rounded-xl flex items-center justify-center bg-slate-400/5 hover:bg-red-500/10 hover:text-red-500 active:scale-95 transition-all"
              >
                <Delete size={20} />
              </button>
              <button
                onClick={() => handleKeypadInput('0')}
                className="py-[2.5cqmin] rounded-xl font-black text-[4cqmin] bg-slate-400/10 hover:bg-slate-400/20 active:scale-95 transition-all"
              >
                0
              </button>
              <button
                onClick={confirmEdit}
                aria-label="Confirm time"
                className="py-[2.5cqmin] bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
              >
                <Check size={20} strokeWidth={3} />
              </button>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              aria-label="Close keypad"
              className="mt-[4cqmin] text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        ) : isVisual && config.mode === 'timer' ? (
          <VisualMode
            displayTime={displayTime}
            config={config}
            formatTime={formatTime}
            startEditing={startEditing}
            setTime={setTime}
          />
        ) : (
          <DigitalMode
            displayTime={displayTime}
            config={config}
            formatTime={formatTime}
            startEditing={startEditing}
            setTime={setTime}
          />
        )}
      </div>

      {/* Controls */}
      <div className="px-[6cqmin] pb-[6cqmin] flex gap-[3cqmin] shrink-0">
        <Button
          variant={config.isRunning ? 'secondary' : 'hero'}
          onClick={
            config.isRunning
              ? () => handleStop(runningDisplayTime)
              : handleStart
          }
          className="flex-[3] h-[14cqmin] !rounded-2xl shadow-lg font-black text-[4.5cqmin] tracking-widest"
          icon={
            config.isRunning ? (
              <Pause className="w-[6cqmin] h-[6cqmin]" fill="currentColor" />
            ) : (
              <Play className="w-[6cqmin] h-[6cqmin]" fill="currentColor" />
            )
          }
        >
          {config.isRunning ? 'PAUSE' : 'START'}
        </Button>
        <Button
          variant="secondary"
          onClick={handleReset}
          className="flex-1 h-[14cqmin] !rounded-2xl"
          icon={<RotateCcw className="w-[6cqmin] h-[6cqmin]" />}
        />
      </div>

      {/* Audio Footer */}
      <div className="px-[6cqmin] py-[4cqmin] bg-black/5 border-t border-white/5 flex justify-end items-center relative shrink-0">
        <div className="relative">
          <button
            onClick={() => setShowSoundPicker(!showSoundPicker)}
            className="flex items-center gap-[2cqmin] px-[3cqmin] py-[1.5cqmin] rounded-full bg-slate-400/10 text-slate-500 hover:bg-blue-500 hover:text-white transition-all active:scale-95"
          >
            <Bell
              className={cn(
                'w-[3cqmin] h-[3cqmin]',
                showSoundPicker && 'animate-bounce'
              )}
            />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {config.selectedSound}
            </span>
          </button>
          {showSoundPicker && (
            <div className="absolute bottom-full right-0 mb-3 w-[44cqmin] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-1 z-50 animate-in fade-in slide-in-from-bottom-2">
              {(['Chime', 'Blip', 'Gong', 'Alert'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    updateWidget(widget.id, {
                      config: { ...config, selectedSound: s },
                    });
                    setShowSoundPicker(false);
                    playTimerAlert(s);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition-all',
                    config.selectedSound === s
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  )}
                >
                  <span className="uppercase tracking-wide">{s}</span>
                  {config.selectedSound === s && (
                    <Check size={14} strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DigitalMode: React.FC<{
  displayTime: number;
  config: TimeToolConfig;
  formatTime: (s: number) => string;
  startEditing: () => void;
  setTime: (s: number) => void;
}> = ({ displayTime, config, formatTime, startEditing, setTime }) => {
  const getStatusColor = () => {
    if (config.mode !== 'timer') return 'text-blue-500';
    if (displayTime <= 60) return 'text-red-600';
    const percent = displayTime / (config.duration || 1);
    if (percent <= 0.25) return 'text-amber-500';
    return config.theme === 'light' ? 'text-slate-900' : 'text-white';
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-[6cqmin] min-h-0">
      <button
        onClick={startEditing}
        data-testid="time-display"
        className={cn(
          'font-black tracking-tighter tabular-nums leading-none transition-all duration-500 text-[24cqmin]',
          getStatusColor(),
          !config.isRunning && config.mode === 'timer'
            ? 'cursor-pointer hover:scale-105 active:scale-95'
            : 'cursor-default'
        )}
        disabled={config.isRunning || config.mode !== 'timer'}
      >
        {formatTime(displayTime)}
      </button>

      {config.mode === 'timer' && (
        <div className="flex flex-wrap items-center justify-center gap-[1.5cqmin] mt-[4cqmin]">
          {[60, 300, 600, 900, 1800].map((s) => (
            <button
              key={s}
              onClick={() => setTime(s)}
              className="px-[3cqmin] py-[1.5cqmin] rounded-xl text-[10px] font-black bg-slate-400/10 hover:bg-blue-500 hover:text-white transition-all active:scale-90"
            >
              {s >= 60 ? `${s / 60}M` : `${s}S`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const VisualMode: React.FC<{
  displayTime: number;
  config: TimeToolConfig;
  formatTime: (s: number) => string;
  startEditing: () => void;
  setTime: (s: number) => void;
}> = ({ displayTime, config, formatTime, startEditing, setTime }) => {
  const angle = (displayTime / (config.duration || 1)) * 360;
  const x = Math.sin((angle * Math.PI) / 180) * 45;
  const y = -Math.cos((angle * Math.PI) / 180) * 45;
  const largeArc = angle > 180 ? 1 : 0;

  const pathData =
    angle >= 360
      ? '' // Circle instead
      : `M 0 0 L 0 -45 A 45 45 0 ${largeArc} 1 ${x} ${y} Z`;

  const wedgeColor =
    displayTime <= 60
      ? 'text-red-600'
      : displayTime / (config.duration || 1) <= 0.25
        ? 'text-amber-500'
        : 'text-orange-500';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-[4cqmin] min-h-0">
      <div className="relative aspect-square flex-1 max-h-[50cqmin] min-h-0">
        <svg viewBox="-50 -50 100 100" className="w-full h-full">
          <circle
            cx="0"
            cy="0"
            r="45"
            className="fill-slate-100 dark:fill-slate-800"
          />
          {angle >= 360 ? (
            <circle
              cx="0"
              cy="0"
              r="45"
              fill="currentColor"
              className={cn(wedgeColor, 'opacity-90')}
            />
          ) : (
            <path
              d={pathData}
              fill="currentColor"
              className={cn(wedgeColor, 'opacity-90')}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={startEditing}
            className={cn(
              'text-[12cqmin] font-black tabular-nums tracking-tight text-slate-900/40 dark:text-white/40 transition-transform',
              !config.isRunning && 'hover:scale-110 active:scale-95'
            )}
            disabled={config.isRunning}
          >
            {formatTime(displayTime)}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-[1.5cqmin] mt-[2cqmin]">
        {[1, 5, 10, 30].map((m) => (
          <button
            key={m}
            onClick={() => setTime(m * 60)}
            className="px-[2.5cqmin] py-[1cqmin] rounded-lg text-[10px] font-black bg-slate-400/10 hover:bg-blue-500 hover:text-white transition-all"
          >
            {m}M
          </button>
        ))}
      </div>
    </div>
  );
};

export const TimeToolSettings: React.FC<Props> = ({ widget }) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as TimeToolConfig;
  const { timerEndVoiceLevel } = config;

  const hasWorkSymbols = activeDashboard?.widgets.some(
    (w) => w.type === 'workSymbols'
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xxs font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Timer Completion Action
        </label>

        {!hasWorkSymbols ? (
          <div className="text-xs text-amber-500 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center gap-2">
            <span>
              ⚠️ Add a &quot;Work Symbols&quot; widget to use this feature.
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-2">
              Automatically set Voice Level when timer ends:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() =>
                  updateWidget(widget.id, {
                    config: { ...config, timerEndVoiceLevel: null },
                  })
                }
                className={cn(
                  'p-2 rounded-lg text-xxs font-bold uppercase border-2 transition-colors',
                  timerEndVoiceLevel === null ||
                    timerEndVoiceLevel === undefined
                    ? 'border-slate-400 bg-slate-100 text-slate-600'
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                )}
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
                  className={cn(
                    'p-2 rounded-lg text-xxs font-bold uppercase border-2 transition-colors',
                    timerEndVoiceLevel === level
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-slate-100 text-slate-400 hover:border-slate-200'
                  )}
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
