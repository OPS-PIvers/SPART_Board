import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, SoundConfig } from '../../types';
import { Thermometer, Gauge, Activity, Citrus } from 'lucide-react';

// Poster Colors Mapping
const POSTER_LEVELS = [
  { label: '0 - SILENCE', color: '#3b82f6', threshold: 0 }, // Blue
  { label: '1 - WHISPER', color: '#22c55e', threshold: 20 }, // Green
  { label: '2 - CONVERSATION', color: '#eab308', threshold: 40 }, // Yellow
  { label: '3 - PRESENTER', color: '#f97316', threshold: 60 }, // Orange
  { label: '4 - OUTSIDE', color: '#ef4444', threshold: 80 }, // Red
];

const getLevelData = (volume: number) => {
  for (let i = POSTER_LEVELS.length - 1; i >= 0; i--) {
    if (volume >= POSTER_LEVELS[i].threshold) return POSTER_LEVELS[i];
  }
  return POSTER_LEVELS[0];
};

// --- Sub-Components for Visuals ---

const ThermometerView: React.FC<{ volume: number }> = ({ volume }) => {
  const { color } = getLevelData(volume);
  return (
    <div className="relative w-full h-full flex items-center justify-center py-4">
      <svg viewBox="0 0 40 100" className="h-full">
        {/* Tube Background */}
        <rect
          x="15"
          y="5"
          width="10"
          height="75"
          rx="5"
          fill="#f1f5f9"
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        {/* Liquid Fill */}
        <rect
          x="16"
          y={80 - volume * 0.7}
          width="8"
          height={volume * 0.7}
          fill={color}
          className="transition-all duration-75"
        />
        {/* Bottom Bulb */}
        <circle
          cx="20"
          cy="85"
          r="10"
          fill={color}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};

const SpeedometerView: React.FC<{ volume: number }> = ({ volume }) => {
  const rotation = -90 + volume * 1.8; // Maps 0-100 volume to -90 to +90 degrees

  // Helper to create arc paths for the gauge segments
  const describeArc = (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(' ');
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      <svg viewBox="0 0 100 65" className="w-full h-auto overflow-visible">
        {/* Background Track */}
        <path
          d={describeArc(50, 55, 40, -90, 90)}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Gauge Colored Segments (behind needle) */}
        {POSTER_LEVELS.map((level, i) => {
          const segmentSize = 180 / POSTER_LEVELS.length;
          const start = -90 + i * segmentSize;
          const end = start + segmentSize;
          return (
            <path
              key={i}
              d={describeArc(50, 55, 40, start, end)}
              fill="none"
              stroke={level.color}
              strokeWidth="10"
              className="opacity-80"
            />
          );
        })}

        {/* Needle */}
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: '50px 55px',
          }}
          className="transition-transform duration-150 ease-out"
        >
          <line
            x1="50"
            y1="55"
            x2="50"
            y2="15"
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M 47 55 L 50 10 L 53 55 Z" fill="#1e293b" />
        </g>

        {/* Center Cap */}
        <circle
          cx="50"
          cy="55"
          r="5"
          fill="#1e293b"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};

const PopcornBallsView: React.FC<{ volume: number }> = ({ volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balls = useRef<{ x: number; y: number; vy: number; color: string }[]>(
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize balls if empty
    if (balls.current.length === 0) {
      for (let i = 0; i < 20; i++) {
        balls.current.push({
          x: Math.random() * canvas.width,
          y: canvas.height - 10,
          vy: 0,
          color:
            POSTER_LEVELS[Math.floor(Math.random() * POSTER_LEVELS.length)]
              .color,
        });
      }
    }

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const impulse = (volume / 100) * 15;

      balls.current.forEach((b) => {
        // Physics logic
        if (b.y >= canvas.height - 10 && impulse > 2) {
          b.vy = -impulse * (0.5 + Math.random());
        }
        b.vy += 0.5; // Gravity
        b.y += b.vy;

        if (b.y > canvas.height - 10) {
          b.y = canvas.height - 10;
          b.vy = 0;
        }

        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
        ctx.fill();
      });
      animId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animId);
  }, [volume]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      width={300}
      height={200}
    />
  );
};

// --- Main Widget ---

export const SoundWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const [volume, setVolume] = useState(0);
  const [history, setHistory] = useState<number[]>(new Array(50).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(null);

  // Add type definition for webkitAudioContext
  interface CustomWindow extends Window {
    webkitAudioContext: typeof AudioContext;
  }

  const { sensitivity = 1, visual = 'thermometer' } =
    widget.config as SoundConfig;

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
          const normalized = Math.min(100, average * (sensitivity * 2));

          setVolume(normalized);
          setHistory((prev) => [...prev.slice(-49), normalized]);
          animationRef.current = requestAnimationFrame(update);
        };
        update();
      } catch (err) {
        console.error(err);
      }
    };
    void startAudio();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [sensitivity]);

  const level = getLevelData(volume);

  return (
    <div className="flex flex-col h-full p-4 gap-3 bg-transparent">
      <div className="flex-1 min-h-0 relative">
        {visual === 'thermometer' && <ThermometerView volume={volume} />}
        {visual === 'speedometer' && <SpeedometerView volume={volume} />}
        {visual === 'balls' && <PopcornBallsView volume={volume} />}
        {visual === 'line' && (
          <div className="w-full h-full bg-slate-900 rounded-xl p-2">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              <polyline
                fill="none"
                stroke={level.color}
                strokeWidth="3"
                points={history
                  .map((v, i) => `${(i / 49) * 100},${100 - v}`)
                  .join(' ')}
                className="transition-colors duration-300"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="text-center">
        <span
          className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full text-white shadow-sm transition-colors duration-300"
          style={{ backgroundColor: level.color }}
        >
          {level.label}
        </span>
      </div>
    </div>
  );
};

export const SoundSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as SoundConfig;
  const { sensitivity = 1, visual = 'thermometer' } = config;

  const modes = [
    { id: 'thermometer', icon: Thermometer, label: 'Meter' },
    { id: 'speedometer', icon: Gauge, label: 'Gauge' },
    { id: 'line', icon: Activity, label: 'Graph' },
    { id: 'balls', icon: Citrus, label: 'Popcorn' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Sensitivity
        </label>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={sensitivity}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, sensitivity: parseFloat(e.target.value) },
            })
          }
          className="w-full accent-indigo-600"
        />
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Visual Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, visual: m.id as SoundConfig['visual'] },
                })
              }
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                visual === m.id
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-slate-100 text-slate-400 hover:border-slate-200'
              }`}
            >
              <m.icon className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
