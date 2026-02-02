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
      <div className="px-[8cqmin] pt-[8cqmin] flex justify-between items-start shrink-0">
        <div className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-full flex items-center relative w-[36cqmin] shrink-0 shadow-inner">
          <div
            className={cn(
              'absolute w-[calc(50%-4px)] h-[calc(100%-8px)] bg-blue-600 rounded-full shadow-md transition-all duration-300 ease-out',
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
              'relative z-10 flex-1 py-1 text-[2.5cqmin] font-black uppercase tracking-wider transition-colors duration-300',
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
              'relative z-10 flex-1 py-1 text-[2.5cqmin] font-black uppercase tracking-wider transition-colors duration-300',
              isVisual ? 'text-white' : 'text-slate-400'
            )}
          >
            Visual
          </button>
        </div>
        <div className="flex gap-[1.5cqmin] shrink-0 mt-1">
          {(['light', 'dark', 'glass'] as const).map((t) => (
            <button
              key={t}
              onClick={() =>
                updateWidget(widget.id, { config: { ...config, theme: t } })
              }
              className={cn(
                'w-[3.5cqmin] h-[3.5cqmin] rounded-full border transition-all hover:scale-110 active:scale-95 shadow-sm',
                t === 'light'
                  ? 'bg-slate-100 border-slate-200'
                  : t === 'dark'
                    ? 'bg-slate-800 border-slate-700'
                    : 'bg-slate-300/50 border-slate-400/30'
              )}
            />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="px-[8cqmin] mt-[4cqmin] flex gap-[6cqmin] shrink-0"
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
            'pb-1 text-[2.8cqmin] font-black uppercase tracking-widest transition-all border-b-2',
            config.mode === 'timer'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-500'
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
            'pb-1 text-[2.8cqmin] font-black uppercase tracking-widest transition-all border-b-2',
            config.mode === 'stopwatch'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-500'
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
            <div className="grid grid-cols-3 gap-[2cqmin] w-full max-w-[45cqmin]">
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
                <Delete className="w-[4cqmin] h-[4cqmin]" />
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
                <Check className="w-[4cqmin] h-[4cqmin]" strokeWidth={3} />
              </button>
            </div>
            <button
              onClick={() => setIsEditing(false)}
              aria-label="Close keypad"
              className="mt-[4cqmin] text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-[4cqmin] h-[4cqmin]" />
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
      {!isEditing && (
        <div className="px-[8cqmin] pb-[4cqmin] flex gap-[3cqmin] items-center shrink-0">
          <Button
            variant={config.isRunning ? 'secondary' : 'hero'}
            onClick={
              config.isRunning
                ? () => handleStop(runningDisplayTime)
                : handleStart
            }
            className={cn(
              'flex-[3] h-[14cqmin] !rounded-full shadow-xl font-black text-[4cqmin] tracking-widest transition-all duration-300',
              !config.isRunning && 'bg-blue-600 hover:bg-blue-700'
            )}
            icon={
              config.isRunning ? (
                <Pause className="w-[5cqmin] h-[5cqmin]" fill="currentColor" />
              ) : (
                <Play className="w-[5cqmin] h-[5cqmin]" fill="currentColor" />
              )
            }
          >
            {config.isRunning ? 'PAUSE' : 'START'}
          </Button>
          <button
            onClick={handleReset}
            className="flex-1 h-[14cqmin] rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-md"
          >
            <RotateCcw className="w-[6cqmin] h-[6cqmin]" />
          </button>
        </div>
      )}

      {/* Audio Footer */}
      <div
        className={cn(
          'px-[8cqmin] flex justify-end items-center relative shrink-0',
          isEditing ? 'pb-[4cqmin]' : 'pb-[8cqmin]'
        )}
      >
        <div className="relative">
          <button
            onClick={() => setShowSoundPicker(!showSoundPicker)}
            className="flex items-center gap-[2cqmin] px-[4cqmin] py-[2cqmin] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm border border-slate-200/50"
          >
            <Bell className="w-[3.5cqmin] h-[3.5cqmin]" />
            <span className="text-[2.2cqmin] font-black uppercase tracking-widest">
              {config.selectedSound}
            </span>
          </button>
          {showSoundPicker && (
            <div className="absolute bottom-full right-0 mb-3 w-[44cqmin] bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in slide-in-from-bottom-4">
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
                    'w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[2.5cqmin] font-black transition-all mb-1 last:mb-0',
                    config.selectedSound === s
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <span className="uppercase tracking-wide">{s}</span>
                  {config.selectedSound === s && (
                    <Check
                      className="w-[3.5cqmin] h-[3.5cqmin]"
                      strokeWidth={3}
                    />
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
    if (config.mode !== 'timer') return 'text-blue-600';
    if (displayTime <= 60) return 'text-red-600';
    const percent = displayTime / (config.duration || 1);
    if (percent <= 0.25) return 'text-amber-500';
    return config.theme === 'light' ? 'text-slate-800' : 'text-white';
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-[8cqmin] min-h-0">
      <button
        onClick={startEditing}
        data-testid="time-display"
        className={cn(
          'font-black tracking-tighter tabular-nums leading-none transition-all duration-500 text-[26cqmin]',
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
        <div className="flex flex-wrap items-center justify-center gap-[2cqmin] mt-[2cqmin] mb-[6cqmin]">
          {[1, 5, 10, 30].map((m) => (
            <button
              key={m}
              onClick={() => setTime(m * 60)}
              className="px-[3.5cqmin] py-[1.5cqmin] rounded-full text-[2.2cqmin] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-600 hover:text-white transition-all active:scale-90 shadow-sm"
            >
              {m}M
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
    angle >= 360 ? '' : `M 0 0 L 0 -45 A 45 45 0 ${largeArc} 1 ${x} ${y} Z`;

  const wedgeColor =
    displayTime <= 60
      ? 'text-red-600'
      : displayTime / (config.duration || 1) <= 0.25
        ? 'text-amber-500'
        : 'text-orange-500';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-[6cqmin] min-h-0">
      <div className="relative aspect-square flex-1 max-h-[55cqmin] min-h-0 w-full flex items-center justify-center">
        <div className="relative w-full h-full max-w-[55cqmin]">
          <svg
            viewBox="-50 -50 100 100"
            className="w-full h-full drop-shadow-sm"
          >
            <circle
              cx="0"
              cy="0"
              r="45"
              className="fill-slate-50 dark:fill-slate-800/30 stroke-slate-100 dark:stroke-slate-700"
              strokeWidth="0.5"
            />
            {angle >= 360 ? (
              <circle
                cx="0"
                cy="0"
                r="45"
                fill="currentColor"
                className={cn(wedgeColor, 'transition-colors duration-500')}
              />
            ) : (
              <path
                d={pathData}
                fill="currentColor"
                className={cn(wedgeColor, 'transition-all duration-300')}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={startEditing}
              className={cn(
                'text-[14cqmin] font-black tabular-nums tracking-tighter text-slate-800 dark:text-white transition-all duration-300',
                !config.isRunning && 'hover:scale-110 active:scale-95',
                angle > 0 && 'drop-shadow-sm'
              )}
              disabled={config.isRunning}
            >
              {formatTime(displayTime)}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-[2cqmin] mt-[2cqmin] mb-[4cqmin]">
        {[1, 5, 10, 30].map((m) => (
          <button
            key={m}
            onClick={() => setTime(m * 60)}
            className="px-[3.5cqmin] py-[1.5cqmin] rounded-full text-[2.2cqmin] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-600 hover:text-white transition-all active:scale-90 shadow-sm"
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
