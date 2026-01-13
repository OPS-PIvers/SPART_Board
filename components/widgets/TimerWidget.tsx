import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Music,
  Volume2,
  Waves,
  Zap,
} from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TimerConfig } from '../../types';

// Global reference for Timer Chime AudioContext
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

// Map of royalty-free sources (Public Domain / Creative Commons)
const MUSIC_SOURCES = {
  lofi: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808f3030c.mp3', // Lofi Study
  nature: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3', // Rain/Nature
  classical: 'https://cdn.pixabay.com/audio/2022/03/15/audio_730623631f.mp3', // Classical Piano
  focus: 'https://cdn.pixabay.com/audio/2023/05/08/audio_496c697843.mp3', // Deep Ambient
  cleanup: 'https://cdn.pixabay.com/audio/2024/09/20/audio_5b38e07978.mp3', // Happy Kids/Cleanup
};

export const TimerWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const config = widget.config as TimerConfig;
  const [timeLeft, setTimeLeft] = useState(config.duration ?? 300);
  const [isActive, setIsActive] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playChime = React.useCallback(() => {
    if (!config.sound) return;
    const ctx = getTimerAudioCtx();
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
  }, [config.sound]);

  const handleCompletion = React.useCallback(() => {
    setIsActive(false);
    setIsDone(true);

    // Fade out music
    if (audioRef.current) {
      let currentVol = audioRef.current.volume;
      fadeIntervalRef.current = setInterval(() => {
        if (audioRef.current && currentVol > 0.05) {
          currentVol -= 0.05;
          audioRef.current.volume = Math.max(0, currentVol);
        } else {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

          // Play Chime ONLY after fade is complete
          playChime();
        }
      }, 100);
    } else {
      playChime();
    }
  }, [playChime]);

  // Music Logic
  useEffect(() => {
    if (!audioRef.current) return;

    if (isActive && config.musicType !== 'none') {
      audioRef.current
        .play()
        .catch((_e) => console.warn('Audio blocked by browser'));
    } else {
      audioRef.current.pause();
    }
  }, [isActive, config.musicType]);

  // Volume & Dynamic Fade Logic
  useEffect(() => {
    if (!audioRef.current || !isActive) return;

    if (config.volumeMode === 'manual') {
      audioRef.current.volume = config.musicVolume;
    } else if (config.volumeMode === 'dynamic') {
      // Logic: Start at musicVolume, fade to 0.05 as time reaches zero
      const ratio = timeLeft / config.duration;
      const dynamicVol = Math.max(0.05, config.musicVolume * ratio);
      audioRef.current.volume = dynamicVol;
    }
  }, [
    timeLeft,
    config.volumeMode,
    config.musicVolume,
    config.duration,
    isActive,
  ]);

  // Countdown Logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            handleCompletion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, handleCompletion]);

  const toggle = async () => {
    const ctx = getTimerAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    if (isDone) reset();
    setIsActive(!isActive);
  };

  const reset = () => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    setIsActive(false);
    setIsDone(false);
    setTimeLeft(config.duration);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div
      className={`flex flex-col items-center justify-center h-full transition-colors duration-500 ${isDone ? 'bg-red-500/20' : ''}`}
    >
      {config.musicType !== 'none' && (
        <audio ref={audioRef} src={MUSIC_SOURCES[config.musicType]} loop />
      )}

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
          className={`p-3 rounded-full transition-all shadow-md ${isActive ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}
        >
          {isActive ? (
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

  const genres = [
    { id: 'none', label: 'No Music', icon: Music },
    { id: 'lofi', label: 'Lofi Study', icon: Volume2 },
    { id: 'nature', label: 'Nature', icon: Waves },
    { id: 'classical', label: 'Classical', icon: Music },
    { id: 'focus', label: 'Deep Focus', icon: Zap },
    { id: 'cleanup', label: 'Cleanup!', icon: Play },
  ];

  return (
    <div className="space-y-6">
      {/* Duration Slider */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Duration (Minutes)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1"
            max="60"
            value={Math.floor(config.duration / 60)}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, duration: parseInt(e.target.value) * 60 },
              })
            }
            className="flex-1 accent-blue-600"
          />
          <span className="w-12 text-center font-mono font-bold text-slate-700">
            {Math.floor(config.duration / 60)}m
          </span>
        </div>
      </div>

      {/* Music Type */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Background Music
        </label>
        <div className="grid grid-cols-3 gap-2">
          {genres.map((g) => (
            <button
              key={g.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, musicType: g.id } as TimerConfig,
                })
              }
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${config.musicType === g.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-400'}`}
            >
              <g.icon className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase text-center leading-tight">
                {g.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Volume Mode */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Volume Behavior
        </label>
        <div className="flex bg-slate-200 p-1 rounded-lg mb-3">
          <button
            onClick={() =>
              updateWidget(widget.id, {
                config: { ...config, volumeMode: 'manual' },
              })
            }
            className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all ${config.volumeMode === 'manual' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
          >
            MANUAL
          </button>
          <button
            onClick={() =>
              updateWidget(widget.id, {
                config: { ...config, volumeMode: 'dynamic' },
              })
            }
            className={`flex-1 py-1.5 text-[9px] font-black rounded-md transition-all ${config.volumeMode === 'dynamic' ? 'bg-white shadow-sm' : 'text-slate-500'}`}
          >
            DYNAMIC FADE
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.musicVolume}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  musicVolume: parseFloat(e.target.value),
                },
              })
            }
            className="flex-1 accent-indigo-600"
          />
        </div>
      </div>

      {/* Completion Sound Toggle */}
      <label className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer">
        <span className="text-xs font-bold text-slate-700 uppercase">
          Completion Chime
        </span>
        <input
          type="checkbox"
          checked={config.sound}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, sound: e.target.checked },
            })
          }
          className="w-5 h-5 accent-blue-600"
        />
      </label>
    </div>
  );
};
