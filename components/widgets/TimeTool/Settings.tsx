import React from 'react';
import {
  Timer as TimerIcon,
  Clock as ClockIcon,
  Sparkles,
  Bell,
  Type,
  Palette,
  Sun,
} from 'lucide-react';
import { TimeToolConfig, WidgetData } from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { WIDGET_PALETTE, STANDARD_COLORS } from '../../../config/colors';
import { SettingsLabel } from '../../common/SettingsLabel';

const SOUNDS = ['Chime', 'Blip', 'Gong', 'Alert'] as const;

// ─── Settings Panel ─────────────────────────────────────────────────────────

export const TimeToolSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as TimeToolConfig;
  const {
    timerEndVoiceLevel,
    fontFamily = 'global',
    clockStyle = 'modern',
    themeColor = STANDARD_COLORS.slate,
  } = config;

  const hasExpectations = activeDashboard?.widgets.some(
    (w) => w.type === 'expectations'
  );

  const fonts = [
    { id: 'global', label: 'Inherit', icon: 'G' },
    { id: 'font-mono', label: 'Digital', icon: '01' },
    { id: 'font-sans', label: 'Modern', icon: 'Aa' },
    { id: 'font-handwritten', label: 'School', icon: '\u270F\uFE0F' },
  ];

  const styles = [
    { id: 'modern', label: 'Default' },
    { id: 'lcd', label: 'LCD Panel' },
    { id: 'minimal', label: 'Minimal' },
  ];

  const colors = WIDGET_PALETTE;

  return (
    <div className="space-y-6 p-1">
      {/* Mode Selection */}
      <div>
        <SettingsLabel icon={TimerIcon}>Mode</SettingsLabel>
        <div className="grid grid-cols-2 gap-2">
          {(['timer', 'stopwatch'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                if (m === 'timer') {
                  updateWidget(widget.id, {
                    config: {
                      ...config,
                      mode: 'timer',
                      duration: 600,
                      elapsedTime: 600,
                      isRunning: false,
                      startTime: null,
                    },
                  });
                } else {
                  updateWidget(widget.id, {
                    config: {
                      ...config,
                      mode: 'stopwatch',
                      elapsedTime: 0,
                      isRunning: false,
                      startTime: null,
                    },
                  });
                }
              }}
              className={`p-2 rounded-lg text-xxs font-black uppercase transition-all border-2 flex items-center justify-center gap-2 ${
                config.mode === m
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {m === 'timer' ? (
                <TimerIcon size={14} />
              ) : (
                <ClockIcon size={14} />
              )}
              {m === 'timer' ? 'Timer' : 'Stopwatch'}
            </button>
          ))}
        </div>
      </div>

      {/* Display Style */}
      <div>
        <SettingsLabel icon={Sparkles}>Display Style</SettingsLabel>
        <div className="grid grid-cols-2 gap-2">
          {(['digital', 'visual'] as const).map((v) => (
            <button
              key={v}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, visualType: v },
                })
              }
              className={`p-2 rounded-lg text-xxs font-black uppercase transition-all border-2 ${
                config.visualType === v
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {v === 'digital' ? 'Digital' : 'Visual Ring'}
            </button>
          ))}
        </div>
      </div>

      {/* Sound Selector */}
      <div>
        <SettingsLabel icon={Bell}>Alert Sound</SettingsLabel>
        <div className="grid grid-cols-4 gap-2">
          {SOUNDS.map((s) => (
            <button
              key={s}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, selectedSound: s },
                })
              }
              className={`p-2 rounded-lg text-xxs font-black uppercase transition-all border-2 ${
                config.selectedSound === s
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Font Family */}
      <div>
        <SettingsLabel icon={Type}>Typography</SettingsLabel>
        <div className="grid grid-cols-4 gap-2">
          {fonts.map((f) => (
            <button
              key={f.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, fontFamily: f.id },
                })
              }
              className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${fontFamily === f.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
            >
              <span
                className={`text-sm ${f.id === 'global' ? 'font-sans' : f.id} text-slate-900`}
              >
                {f.icon}
              </span>
              <span className="text-xxxs uppercase text-slate-600">
                {f.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Clock Style */}
      <div>
        <SettingsLabel icon={Sparkles}>Number Style</SettingsLabel>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {styles.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, clockStyle: s.id },
                })
              }
              className={`flex-1 py-1.5 text-xxs rounded-lg transition-all ${clockStyle === s.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {s.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Color & Glow */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex-1">
          <SettingsLabel icon={Palette}>Color Palette</SettingsLabel>
          <div className="flex gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() =>
                  updateWidget(widget.id, {
                    config: { ...config, themeColor: c },
                  })
                }
                className={`w-6 h-6 rounded-full border-2 transition-all ${themeColor === c ? 'border-slate-800 scale-125 shadow-md' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, glow: !config.glow },
            })
          }
          className={`p-2 rounded-lg border-2 flex items-center gap-2 transition-all ${config.glow ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
        >
          <Sun className={`w-4 h-4 ${config.glow ? 'fill-current' : ''}`} />
          <span className="text-xxs uppercase">Glow</span>
        </button>
      </div>

      {/* Timer End Action */}
      <div>
        <SettingsLabel icon={Bell}>Timer End Action</SettingsLabel>

        {!hasExpectations ? (
          <div className="text-xs text-brand-red-primary bg-brand-red-lighter/20 p-4 rounded-2xl border border-brand-red-lighter/30 flex items-start gap-3">
            <span className="text-xl mt-0.5">&#128161;</span>
            <p className="font-bold leading-snug">
              Add an &quot;Expectations&quot; widget to enable automatic voice
              level changes when the timer hits zero!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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
                className={`p-2 rounded-lg text-xxs font-black uppercase transition-all border-2 ${
                  timerEndVoiceLevel == null
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600'
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
                  className={`p-2 rounded-lg text-xxs font-black uppercase transition-all border-2 ${
                    timerEndVoiceLevel === level
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-200 text-slate-600'
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
