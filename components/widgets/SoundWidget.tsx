import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import {
  WidgetData,
  SoundConfig,
  TrafficConfig,
  ExpectationsConfig,
  WidgetConfig,
} from '../../types';
import { Thermometer, Gauge, Activity, Citrus, Zap, Ear } from 'lucide-react';
import { STANDARD_COLORS } from '../../config/colors';
import { Toggle } from '../common/Toggle';

// Poster Colors Mapping
const POSTER_LEVELS = [
  { label: '0 - Silence', color: STANDARD_COLORS.blue, threshold: 0 }, // Blue
  { label: '1 - Whisper', color: STANDARD_COLORS.green, threshold: 20 }, // Green
  { label: '2 - Conversation', color: STANDARD_COLORS.yellow, threshold: 40 }, // Yellow
  { label: '3 - Presenter', color: STANDARD_COLORS.orange, threshold: 60 }, // Orange
  { label: '4 - Outside', color: STANDARD_COLORS.red, threshold: 80 }, // Red
];

const getLevelData = (volume: number) => {
  for (let i = POSTER_LEVELS.length - 1; i >= 0; i--) {
    if (volume >= POSTER_LEVELS[i].threshold) return POSTER_LEVELS[i];
  }
  return POSTER_LEVELS[0];
};

// Map Voice Level (0-4) to Sensitivity (High -> Low)
// 0 (Silence) -> 4.0
// 1 (Whisper) -> 2.5
// 2 (Conversation) -> 1.5
// 3 (Presenter) -> 1.0
// 4 (Outside) -> 0.5
const SENSITIVITY_MAP: Record<number, number> = {
  0: 4.0,
  1: 2.5,
  2: 1.5,
  3: 1.0,
  4: 0.5,
};

// --- Sub-Components for Visuals ---

const ThermometerView: React.FC<{ volume: number }> = ({ volume }) => {
  const { color } = getLevelData(volume);
  return (
    <div className="relative w-full h-full flex items-center justify-center py-4">
      <svg viewBox="0 0 40 100" className="h-full drop-shadow-sm">
        {/* Tube Background */}
        <rect
          x="15"
          y="5"
          width="10"
          height="75"
          rx="5"
          className="fill-white/20 stroke-white/30"
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
          className="stroke-white/30"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};

const SpeedometerView: React.FC<{ volume: number }> = ({ volume }) => {
  const ANGLE_OFFSET = 180; // Start angle for the gauge (Left)
  const VOLUME_TO_ANGLE_RATIO = 1.8; // 180 degrees / 100 volume units
  const degToRad = (degrees: number) => (degrees * Math.PI) / 180;

  // Map volume (0-100) to angle (180-360 degrees)
  // 180 = Left, 270 = Up, 360 = Right
  const angle = ANGLE_OFFSET + volume * VOLUME_TO_ANGLE_RATIO;
  const centerX = 50;
  const centerY = 55;
  const radius = 40;
  const needleLen = 35;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
      <svg viewBox="0 0 100 60" className="w-full h-auto drop-shadow-sm">
        {/* Arcs */}
        {POSTER_LEVELS.map((level, i) => {
          const startVol = level.threshold;
          const endVol =
            i < POSTER_LEVELS.length - 1 ? POSTER_LEVELS[i + 1].threshold : 100;
          const startAngle = ANGLE_OFFSET + startVol * VOLUME_TO_ANGLE_RATIO;
          const endAngle = ANGLE_OFFSET + endVol * VOLUME_TO_ANGLE_RATIO;

          const x1 = centerX + radius * Math.cos(degToRad(startAngle));
          const y1 = centerY + radius * Math.sin(degToRad(startAngle));
          const x2 = centerX + radius * Math.cos(degToRad(endAngle));
          const y2 = centerY + radius * Math.sin(degToRad(endAngle));

          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke={level.color}
              strokeWidth="8"
              className="opacity-20"
            />
          );
        })}
        {/* Main Background Arc */}
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          className="stroke-white/10"
          strokeWidth="8"
        />
        {/* Needle */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX + needleLen * Math.cos(degToRad(angle))}
          y2={centerY + needleLen * Math.sin(degToRad(angle))}
          stroke={STANDARD_COLORS.slate}
          strokeWidth="2"
          strokeLinecap="round"
          className="transition-all duration-150 stroke-slate-800"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r="3"
          fill={STANDARD_COLORS.slate}
          className="fill-slate-800"
        />
      </svg>
    </div>
  );
};

const PopcornBallsView: React.FC<{
  volume: number;
  width: number;
  height: number;
}> = ({ volume, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balls = useRef<{ x: number; y: number; vy: number; color: string }[]>(
    []
  );

  // ⚡ Bolt Optimization: Use ref for volume to prevent loop recreation on every frame
  const volumeRef = useRef(volume);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Handle resizing and ball re-initialization
  useEffect(() => {
    balls.current = []; // Reset balls on resize to reposition them
    for (let i = 0; i < 30; i++) {
      balls.current.push({
        x: Math.random() * width,
        y: height - 10,
        vy: 0,
        color:
          POSTER_LEVELS[Math.floor(Math.random() * POSTER_LEVELS.length)].color,
      });
    }
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const impulse = (volumeRef.current / 100) * (height * 0.1);

      balls.current.forEach((b) => {
        // Physics logic
        if (b.y >= height - 10 && impulse > 2) {
          b.vy = -impulse * (0.5 + Math.random());
        }
        b.vy += 0.5; // Gravity
        b.y += b.vy;

        if (b.y > height - 10) {
          b.y = height - 10;
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
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      width={width}
      height={height}
    />
  );
};

// --- Main Widget ---

import { WidgetLayout } from './WidgetLayout';

export const SoundWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const [volume, setVolume] = useState(0);
  const [history, setHistory] = useState<number[]>(new Array(50).fill(0));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(null);

  const { w, h } = widget;

  // Add type definition for webkitAudioContext
  interface CustomWindow extends Window {
    webkitAudioContext: typeof AudioContext;
  }

  const {
    sensitivity = 1,
    visual = 'thermometer',
    autoTrafficLight,
    trafficLightThreshold = 4,
  } = widget.config as SoundConfig;

  // ⚡ Bolt Optimization: Use ref for sensitivity to prevent audio stream restart
  const sensitivityRef = useRef(sensitivity);
  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

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
          const normalized = Math.min(
            100,
            average * (sensitivityRef.current * 2)
          );

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
  }, []);

  const level = getLevelData(volume);

  // Nexus Connection: Auto Traffic Light
  useEffect(() => {
    if (!autoTrafficLight || !activeDashboard) return;

    // Find the first traffic light widget
    const trafficLight = activeDashboard.widgets.find(
      (w) => w.type === 'traffic'
    );
    if (!trafficLight) return;

    const levelIndex = POSTER_LEVELS.indexOf(level);
    const thresholdIndex = trafficLightThreshold ?? 4;

    // Stable Delay: Only act if the level holds for 1s
    const timer = setTimeout(() => {
      const trafficConfig = trafficLight.config as TrafficConfig;
      const desiredState = levelIndex >= thresholdIndex ? 'red' : 'green';

      // Only update if state is different to avoid spamming Firestore
      if (trafficConfig.active !== desiredState) {
        updateWidget(trafficLight.id, {
          config: { ...trafficConfig, active: desiredState } as WidgetConfig,
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    level,
    autoTrafficLight,
    trafficLightThreshold,
    activeDashboard,
    updateWidget,
  ]);

  // Nexus Connection: Auto-Adjust Sensitivity from Expectations
  const { syncExpectations } = widget.config as SoundConfig;

  const expectationsVoiceLevel = useMemo(() => {
    if (!activeDashboard) return null;
    const expWidget = activeDashboard.widgets.find(
      (w) => w.type === 'expectations'
    );
    if (!expWidget) return null;
    return (expWidget.config as ExpectationsConfig).voiceLevel;
  }, [activeDashboard]);

  useEffect(() => {
    if (!syncExpectations || expectationsVoiceLevel === null) return;

    const targetSensitivity = SENSITIVITY_MAP[expectationsVoiceLevel];
    if (targetSensitivity !== undefined && sensitivity !== targetSensitivity) {
      updateWidget(widget.id, {
        config: {
          ...widget.config,
          sensitivity: targetSensitivity,
        } as WidgetConfig,
      });
    }
  }, [
    syncExpectations,
    expectationsVoiceLevel,
    sensitivity,
    updateWidget,
    widget.id,
    widget.config,
  ]);

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div className="flex-1 min-h-0 relative w-full h-full p-2">
          {visual === 'thermometer' && <ThermometerView volume={volume} />}
          {visual === 'speedometer' && <SpeedometerView volume={volume} />}
          {visual === 'balls' && (
            <PopcornBallsView volume={volume} width={w} height={h - 60} />
          )}
          {visual === 'line' && (
            <div className="w-full h-full bg-black/20 rounded-2xl p-2">
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
      }
      footer={
        <div className="text-center pb-3">
          <span
            className="font-black uppercase tracking-widest px-6 py-2 rounded-full text-white shadow-md transition-all duration-300 inline-block border-2 border-white/20"
            style={{
              backgroundColor: level.color,
              fontSize: 'min(12px, 3.5cqmin)',
            }}
          >
            {level.label}
          </span>
        </div>
      }
    />
  );
};

export const SoundSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as SoundConfig;
  const {
    sensitivity = 1,
    visual = 'thermometer',
    autoTrafficLight,
    trafficLightThreshold = 4,
  } = config;

  const hasTrafficLight = activeDashboard?.widgets.some(
    (w) => w.type === 'traffic'
  );
  const hasExpectations = activeDashboard?.widgets.some(
    (w) => w.type === 'expectations'
  );

  const modes = [
    { id: 'thermometer', icon: Thermometer, label: 'Meter' },
    { id: 'speedometer', icon: Gauge, label: 'Gauge' },
    { id: 'line', icon: Activity, label: 'Graph' },
    { id: 'balls', icon: Citrus, label: 'Popcorn' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-3 block">
          Sensitivity
        </label>
        <input
          type="range"
          min="0.5"
          max="5"
          step="0.1"
          value={sensitivity}
          disabled={config.syncExpectations}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, sensitivity: parseFloat(e.target.value) },
            })
          }
          className={`w-full accent-indigo-600 ${config.syncExpectations ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {config.syncExpectations && (
          <p className="text-xxxs text-indigo-500 mt-1 font-medium">
            Controlled by Expectations widget
          </p>
        )}
      </div>

      <div>
        <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-3 block">
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
              <span className="text-xxs  uppercase">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Nexus Connection: Traffic Light */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-indigo-900">
          <Zap className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">
            Auto-Control Traffic Light
          </span>
        </div>

        {!hasTrafficLight && (
          <div className="text-xxs text-indigo-400 font-medium bg-indigo-50 p-2 rounded-lg">
            Tip: Add a Traffic Light widget to use this feature.
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-indigo-800">Enable Automation</span>
          <Toggle
            checked={autoTrafficLight ?? false}
            onChange={(checked: boolean) =>
              updateWidget(widget.id, {
                config: { ...config, autoTrafficLight: checked },
              })
            }
            disabled={!hasTrafficLight}
            size="sm"
            activeColor="bg-indigo-600"
            showLabels={false}
          />
        </div>

        {autoTrafficLight && (
          <div className="animate-in fade-in slide-in-from-top-1">
            <label className="text-xxs text-indigo-400 uppercase tracking-widest mb-1.5 block">
              Trigger Red Light At:
            </label>
            <div className="grid grid-cols-1 gap-1">
              {POSTER_LEVELS.slice(1).map((lvl, i) => (
                <button
                  key={i}
                  onClick={() =>
                    updateWidget(widget.id, {
                      config: {
                        ...config,
                        trafficLightThreshold: i + 1, // POSTER_LEVELS index (1-based relative to slice, so i+1 matches real index)
                      },
                    })
                  }
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    trafficLightThreshold === i + 1
                      ? 'bg-white border-indigo-200 text-indigo-700 shadow-sm'
                      : 'border-transparent hover:bg-indigo-50 text-indigo-900/60'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: lvl.color }}
                  />
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nexus Connection: Expectations */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-slate-700">
          <Ear className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">
            Sync with Expectations
          </span>
        </div>

        {!hasExpectations && (
          <div className="text-xxs text-slate-400 font-medium bg-slate-100 p-2 rounded-lg">
            Tip: Add an Expectations widget to use this feature.
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">
            Auto-Adjust Sensitivity
          </span>
          <Toggle
            checked={config.syncExpectations ?? false}
            onChange={(checked: boolean) =>
              updateWidget(widget.id, {
                config: { ...config, syncExpectations: checked },
              })
            }
            disabled={!hasExpectations && !config.syncExpectations}
            size="sm"
            activeColor="bg-slate-600"
            showLabels={false}
          />
        </div>

        {config.syncExpectations && (
          <p className="text-xxxs text-slate-400 leading-relaxed">
            Microphone sensitivity will automatically adjust based on the Voice
            Level set in the Expectations widget.
          </p>
        )}
      </div>
    </div>
  );
};
