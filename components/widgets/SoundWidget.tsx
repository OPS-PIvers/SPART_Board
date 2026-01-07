import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, SoundConfig } from '../../types';

export const SoundWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const [volume, setVolume] = useState(0);
  // Pre-fill history with 50 zeros so the line is visible on start

  // Add type definition for webkitAudioContext
  interface CustomWindow extends Window {
    webkitAudioContext: typeof AudioContext;
  }

  const [history, setHistory] = useState<number[]>(new Array(50).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(null);

  const {
    sensitivity = 5,
    orientation = 'horizontal',
    style = 'bar',
  } = widget.config as SoundConfig;

  useEffect(() => {
    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as CustomWindow).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const update = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / bufferLength;
          // Cap at 100 to ensure calculations stay in range
          const normalized = Math.min(100, average * (sensitivity / 2));

          setVolume(normalized);
          setHistory((prev) => {
            const next = [...prev, normalized];
            return next.slice(-50); // Keep last 50 points
          });

          animationRef.current = requestAnimationFrame(update);
        };
        update();
      } catch (err) {
        console.error('Error accessing microphone:', err);
      }
    };

    void startAudio();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sensitivity]);

  const getBarColor = (val: number) => {
    if (val > 80) return 'rgb(239, 68, 68)';
    if (val > 50) return 'rgb(250, 204, 21)';
    return 'rgb(34, 197, 94)';
  };

  const renderVisualization = () => {
    if (style === 'line') {
      const points = history
        .map((val, i) => {
          const x = (i / (history.length - 1)) * 100;
          // Baseline at 95. Max height at 15 (95 - 80).
          // This ensures a 15% margin at the top so it never goes off-screen.
          const y = 95 - val * 0.8;
          return `${x},${y}`;
        })
        .join(' ');

      return (
        <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden p-2 ring-1 ring-white/10 shadow-inner">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Background Grid Lines for Scale */}
            <line
              x1="0"
              y1="95"
              x2="100"
              y2="95"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="0.5"
            />
            <line
              x1="0"
              y1="55"
              x2="100"
              y2="55"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.5"
            />
            <line
              x1="0"
              y1="15"
              x2="100"
              y2="15"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.5"
            />

            <polyline
              fill="none"
              stroke={getBarColor(volume)}
              strokeWidth="2.5"
              strokeLinejoin="round"
              filter="url(#glow)"
              points={points}
              style={{ transition: 'stroke 0.2s' }}
            />
          </svg>
        </div>
      );
    }

    const isVertical = orientation === 'vertical';
    return (
      <div
        className={`w-full h-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner p-1 flex ${isVertical ? 'flex-col-reverse' : 'flex-row'}`}
      >
        <div
          className="rounded-lg transition-all duration-75 ease-out shadow-lg"
          style={{
            width: isVertical ? '100%' : `${volume}%`,
            height: isVertical ? `${volume}%` : '100%',
            backgroundColor: getBarColor(volume),
            boxShadow: `0 0 20px ${getBarColor(volume)}44`,
          }}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-3 w-full overflow-hidden">
      <div className="flex-1 w-full relative">{renderVisualization()}</div>
      <div className="mt-2 w-full flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-tighter">
        <span>Quiet</span>
        <span className="text-slate-500">{Math.round(volume)}%</span>
        <span>Loud</span>
      </div>
    </div>
  );
};

export const SoundSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as SoundConfig;
  const { sensitivity = 5, orientation = 'horizontal', style = 'bar' } = config;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase mb-3 block">
          Microphone Sensitivity
        </label>
        <div className="flex items-center gap-4 px-2">
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={sensitivity}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  sensitivity: parseFloat(e.target.value),
                },
              })
            }
            className="flex-1 accent-pink-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="w-8 text-center font-mono font-bold text-slate-700 text-xs">
            {sensitivity}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
            Orientation
          </label>
          <div className="flex bg-slate-200 p-1 rounded-lg">
            {(['horizontal', 'vertical'] as const).map((o) => (
              <button
                key={o}
                onClick={() =>
                  updateWidget(widget.id, {
                    config: { ...config, orientation: o },
                  })
                }
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${orientation === o ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {o.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
            Style
          </label>
          <div className="flex bg-slate-200 p-1 rounded-lg">
            {(['bar', 'line'] as const).map((s) => (
              <button
                key={s}
                onClick={() =>
                  updateWidget(widget.id, {
                    config: { ...config, style: s },
                  })
                }
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${style === s ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
