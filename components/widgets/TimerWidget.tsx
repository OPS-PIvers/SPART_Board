import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TimerConfig } from '../../types';

// Global reference for Timer AudioContext
let timerAudioCtx: AudioContext | null = null;

// Add type definition for webkitAudioContext
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

const playSound = () => {
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
};

export const TimerWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as TimerConfig;
  const soundEnabled = config.sound;

  // Derive state from config
  const isRunning = config.running ?? false;
  const endsAt = config.endsAt ?? null;
  const duration = config.duration ?? 300;

  // Initialize state lazily to avoid impure calls in render body
  const [displaySeconds, setDisplaySeconds] = useState(() => {
    if (isRunning && endsAt) {
      return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    }
    return config.timeLeft ?? duration;
  });

  const [playedSound, setPlayedSound] = useState(false);

  // Pattern: Derived state from props
  // If not running, the display MUST match the config snapshot/duration.
  if (
    (!isRunning || !endsAt) &&
    displaySeconds !== (config.timeLeft ?? duration)
  ) {
    setDisplaySeconds(config.timeLeft ?? duration);
  }

  // Tick effect
  useEffect(() => {
    // If not running, just ensure we match the config (handled by render logic above)
    if (!isRunning || !endsAt) {
      return;
    }

    let animationFrame: number;

    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000));
      setDisplaySeconds(remaining);

      if (remaining > 0) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isRunning, endsAt]);

  // Sound effect logic
  useEffect(() => {
    if (displaySeconds === 0 && isRunning && !playedSound && soundEnabled) {
      playSound();
      // Use timeout to avoid "setState in effect" warning
      setTimeout(() => setPlayedSound(true), 0);
    }
    // Reset sound flag if we add time or reset
    if (displaySeconds > 0 && playedSound) {
      setTimeout(() => setPlayedSound(false), 0);
    }
  }, [displaySeconds, isRunning, soundEnabled, playedSound]);

  const toggle = async () => {
    // Unlock audio context on interaction
    const ctx = getTimerAudioCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    if (isRunning) {
      // Pause: Calculate remaining time snapshot
      const now = Date.now();
      const remainingMs = (endsAt ?? now) - now;
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

      updateWidget(widget.id, {
        config: {
          ...config,
          running: false,
          endsAt: undefined,
          timeLeft: remainingSeconds,
        } as TimerConfig,
      });
    } else {
      // Start: Set endsAt based on current displayed time
      const currentSeconds = displaySeconds <= 0 ? duration : displaySeconds;
      const newEndsAt = Date.now() + currentSeconds * 1000;

      updateWidget(widget.id, {
        config: {
          ...config,
          running: true,
          endsAt: newEndsAt,
          timeLeft: undefined,
        } as TimerConfig,
      });
      setPlayedSound(false);
    }
  };

  const reset = () => {
    updateWidget(widget.id, {
      config: {
        ...config,
        running: false,
        endsAt: undefined,
        timeLeft: undefined, // Reverts to duration
      } as TimerConfig,
    });
    setPlayedSound(false);
  };

  const isDone = displaySeconds === 0;
  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;

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
          className={`p-3 rounded-full transition-all shadow-md ${isRunning ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
        >
          {isRunning ? (
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
  const duration = config.duration ?? 300;
  const minutes = Math.floor(duration / 60);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
          Duration (Minutes)
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
                  // Reset timer state on duration change to avoid confusion
                  running: false,
                  endsAt: undefined,
                  timeLeft: undefined,
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
