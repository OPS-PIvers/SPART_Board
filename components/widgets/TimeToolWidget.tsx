import React, { useState, useEffect, useRef } from 'react';
import { TimeToolConfig, WidgetData } from '../../types';
import { useDashboard } from '../../context/useDashboard';
import { Play, Pause, RotateCcw, Bell } from 'lucide-react';
import { STANDARD_COLORS } from '../../config/colors';

interface Props {
  widget: WidgetData;
}

// Add type definition for webkitAudioContext
interface CustomWindow extends Window {
  webkitAudioContext: typeof AudioContext;
}

const AUDIO_CONTEXT = new (
  window.AudioContext || (window as unknown as CustomWindow).webkitAudioContext
)();

export const TimeToolWidget: React.FC<Props> = ({ widget }) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as TimeToolConfig;
  const [showSoundPicker, setShowSoundPicker] = useState(false);

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

  // --- AUDIO SYNTHESIS ---
  const playAlert = React.useCallback(() => {
    const now = AUDIO_CONTEXT.currentTime;
    if (config.selectedSound === 'Chime') {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const osc = AUDIO_CONTEXT.createOscillator();
        const gain = AUDIO_CONTEXT.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.05);
        gain.gain.setValueAtTime(0, now + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5 + i * 0.1);
        osc.connect(gain);
        gain.connect(AUDIO_CONTEXT.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + 2);
      });
    } else if (config.selectedSound === 'Gong') {
      const fund = AUDIO_CONTEXT.createOscillator();
      const fundGain = AUDIO_CONTEXT.createGain();
      fund.type = 'sine';
      fund.frequency.setValueAtTime(55, now);
      fundGain.gain.setValueAtTime(0, now);
      fundGain.gain.linearRampToValueAtTime(0.8, now + 0.08);
      fundGain.gain.exponentialRampToValueAtTime(0.001, now + 5);
      fund.connect(fundGain);
      fundGain.connect(AUDIO_CONTEXT.destination);
      fund.start(now);
      fund.stop(now + 5);
      [113, 167, 223, 317, 449].forEach((f) => {
        const pOsc = AUDIO_CONTEXT.createOscillator();
        const pGain = AUDIO_CONTEXT.createGain();
        pOsc.type = 'sine';
        pOsc.frequency.setValueAtTime(f, now);
        pGain.gain.setValueAtTime(0, now);
        pGain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        pGain.gain.exponentialRampToValueAtTime(0.001, now + 3);
        pOsc.connect(pGain);
        pGain.connect(AUDIO_CONTEXT.destination);
        pOsc.start(now);
        pOsc.stop(now + 3);
      });
    } else if (config.selectedSound === 'Blip') {
      const osc = AUDIO_CONTEXT.createOscillator();
      const gain = AUDIO_CONTEXT.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(AUDIO_CONTEXT.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (config.selectedSound === 'Alert') {
      [440, 880, 440, 880].forEach((f, i) => {
        const osc = AUDIO_CONTEXT.createOscillator();
        const gain = AUDIO_CONTEXT.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + i * 0.2);
        gain.gain.setValueAtTime(0, now + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.2 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.15);
        osc.connect(gain);
        gain.connect(AUDIO_CONTEXT.destination);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.2);
      });
    }
  }, [config.selectedSound]);

  const resumeAudio = async () => {
    if (AUDIO_CONTEXT.state === 'suspended') {
      await AUDIO_CONTEXT.resume();
    }
  };

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
        elapsedTime: displayTime, // Sync the current display time as base
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

      interval = setInterval(() => {
        const delta = (Date.now() - start) / 1000;
        let next: number;
        if (config.mode === 'timer') {
          next = Math.max(0, base - delta);
          if (next === 0) {
            handleStop(0);
            playAlert();

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
                // We use a small timeout to allow the render cycle to complete and ensure this side effect is handled cleanly
                setTimeout(() => {
                  if (
                    config.timerEndVoiceLevel !== undefined &&
                    config.timerEndVoiceLevel !== null
                  ) {
                    // Force the config type to unknown then WidgetConfig to satisfy the linter
                    // while allowing the update.
                    const newConfig = {
                      ...(wsWidget.config || {}),
                      voiceLevel: config.timerEndVoiceLevel,
                    } as unknown as TimeToolConfig;

                    updateWidget(wsWidget.id, {
                      config: newConfig,
                    });
                  }
                }, 0);
              }
            }
          }
        } else {
          next = base + delta;
        }
        setRunningDisplayTime(next);
      }, 50); // High frequency for smooth UI, but NO updateWidget here
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    config.isRunning,
    config.startTime,
    config.elapsedTime,
    config.mode,
    playAlert,
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

  // --- STYLING ---
  const isVisual = config.visualType === 'visual';
  const themeClass =
    config.theme === 'dark'
      ? 'bg-slate-900 text-white'
      : config.theme === 'glass'
        ? 'bg-white/20 backdrop-blur-xl text-white'
        : 'bg-white text-slate-900';

  const getStatusColor = () => {
    if (config.mode !== 'timer') return 'text-blue-500';
    const percent = displayTime / config.duration;
    if (displayTime <= 60) return 'text-red-500';
    if (percent <= 0.25) return 'text-amber-500';
    return config.theme === 'light' ? 'text-slate-900' : 'text-white';
  };

  return (
    <div
      className={`flex flex-col h-full rounded-[2.5rem] shadow-xl border border-white/30 transition-all duration-500 ${themeClass} w-full`}
    >
      {/* Header: Digital/Visual Toggle & Themes */}
      <div className="px-8 pt-6 flex justify-between items-center shrink-0">
        <div className="bg-slate-400/10 p-1 rounded-xl flex items-center relative w-36">
          <div
            className={`absolute w-[calc(50%-4px)] h-[calc(100%-8px)] bg-blue-500 rounded-lg shadow-sm transition-transform duration-300 ${isVisual ? 'translate-x-full' : ''}`}
          />
          <button
            onClick={() =>
              updateWidget(widget.id, {
                config: { ...config, visualType: 'digital' },
              })
            }
            className={`relative z-10 flex-1 py-1 text-[10px] font-bold uppercase transition-colors ${!isVisual ? 'text-white' : 'text-slate-400'}`}
          >
            Digital
          </button>
          <button
            onClick={() =>
              updateWidget(widget.id, {
                config: { ...config, visualType: 'visual' },
              })
            }
            className={`relative z-10 flex-1 py-1 text-[10px] font-bold uppercase transition-colors ${isVisual ? 'text-white' : 'text-slate-400'}`}
          >
            Visual
          </button>
        </div>
        <div className="flex gap-2">
          {(['light', 'dark', 'glass'] as const).map((t) => (
            <button
              key={t}
              onClick={() =>
                updateWidget(widget.id, { config: { ...config, theme: t } })
              }
              className={`w-4 h-4 rounded-full border border-black shadow-sm transition-transform hover:scale-110 active:scale-95 ${t === 'light' ? 'bg-white' : t === 'dark' ? 'bg-slate-800' : 'bg-white/30'}`}
            />
          ))}
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="px-8 mt-4 flex gap-4 border-b border-white/5 shrink-0">
        <button
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
          className={`pb-2 text-[10px] font-bold uppercase tracking-widest transition-all ${config.mode === 'timer' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-400'}`}
        >
          Timer
        </button>
        <button
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
          className={`pb-2 text-[10px] font-bold uppercase tracking-widest transition-all ${config.mode === 'stopwatch' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-400'}`}
        >
          Stopwatch
        </button>
      </div>

      {/* Center: Time Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative min-h-0">
        {isVisual && (
          <svg
            className="absolute"
            width="220"
            height="220"
            viewBox="0 0 220 220"
          >
            <circle
              className="opacity-10"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              r="95"
              cx="110"
              cy="110"
            />
            <circle
              className="transition-all duration-300"
              stroke={
                getStatusColor().includes('red')
                  ? STANDARD_COLORS.red
                  : getStatusColor().includes('amber')
                    ? STANDARD_COLORS.amber
                    : STANDARD_COLORS.blue
              }
              strokeWidth="10"
              strokeLinecap="round"
              fill="transparent"
              r="95"
              cx="110"
              cy="110"
              strokeDasharray="597"
              strokeDashoffset={
                597 -
                (config.mode === 'timer' ? displayTime / config.duration : 1) *
                  597
              }
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%',
              }}
            />
          </svg>
        )}
        <div
          className={`font-black transition-all duration-500 tabular-nums select-none ${getStatusColor()} ${isVisual ? 'text-5xl' : 'text-7xl'}`}
        >
          {formatTime(displayTime)}
        </div>
        {!isVisual && config.mode === 'timer' && (
          <div className="flex gap-2 mt-4">
            {[60, 300, 600, 900, 1800].map((s) => (
              <button
                key={s}
                onClick={() => setTime(s)}
                className="px-3 py-1 text-[10px] font-bold bg-slate-400/10 rounded-lg hover:bg-slate-400/20 transition-colors"
              >
                {s >= 60 ? `${s / 60}m` : `${s}s`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-8 pb-6 flex gap-3 shrink-0">
        <button
          onClick={
            config.isRunning
              ? () => handleStop(runningDisplayTime)
              : handleStart
          }
          className={`flex-[3] py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${config.isRunning ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700'}`}
        >
          {config.isRunning ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" />
          )}
          {config.isRunning ? 'PAUSE' : 'START'}
        </button>
        <button
          onClick={handleReset}
          className="flex-1 bg-slate-400/10 rounded-2xl flex items-center justify-center hover:bg-slate-400/20 transition-all active:scale-95"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Footer: Audio Selection */}
      <div className="px-8 py-4 bg-black/5 border-t border-white/5 flex justify-end items-center relative shrink-0">
        <div className="relative">
          <button
            onClick={() => {
              setShowSoundPicker(!showSoundPicker);
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors"
          >
            <Bell size={14} />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              {config.selectedSound}
            </span>
          </button>
          {showSoundPicker && (
            <div className="absolute bottom-full right-0 mb-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50">
              {(['Chime', 'Blip', 'Gong', 'Alert'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    updateWidget(widget.id, {
                      config: { ...config, selectedSound: s },
                    });
                    setShowSoundPicker(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${config.selectedSound === s ? 'bg-blue-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
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
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
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
                className={`p-2 rounded-lg text-[10px] font-bold uppercase border-2 transition-colors ${
                  timerEndVoiceLevel === null ||
                  timerEndVoiceLevel === undefined
                    ? 'border-slate-400 bg-slate-100 text-slate-600'
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
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
                  className={`p-2 rounded-lg text-[10px] font-bold uppercase border-2 transition-colors ${
                    timerEndVoiceLevel === level
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                      : 'border-slate-100 text-slate-400 hover:border-slate-200'
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
