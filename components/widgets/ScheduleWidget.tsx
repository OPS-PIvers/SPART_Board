import React, { useEffect, useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { useScaledFont } from '../../hooks/useScaledFont';
import {
  WidgetData,
  ScheduleItem,
  ScheduleConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../types';
import { Circle, CheckCircle2, Type, Clock, AlertTriangle } from 'lucide-react';
import { Toggle } from '../../components/common/Toggle';

export const ScheduleWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as ScheduleConfig;
  const items = useMemo(() => config.items ?? [], [config.items]);
  const { fontFamily = 'global', autoProgress = false } = config;

  // Memoize hasClock to avoid dependency issues in useEffect
  const hasClock = useMemo(
    () => activeDashboard?.widgets?.some((w) => w.type === 'clock') ?? false,
    [activeDashboard?.widgets]
  );

  // Logic for Auto-Progress
  useEffect(() => {
    // Only run if autoProgress is on AND a clock widget exists
    if (!autoProgress || !hasClock) return;

    const checkTime = () => {
      const now = new Date();
      // Current minutes since midnight
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      let changed = false;

      // Determine which items should be done
      // Logic: An item is DONE if there is a SUBSEQUENT item whose time has passed (or equals now).
      // Meaning, we are now in the "zone" of the next item (or a later one).
      // The current active item (latest one that has passed) is NOT done.

      // Helper to parse "HH:MM"
      const parseTime = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      const newItems = items.map((item, index) => {
        // We look ahead.
        // If ANY item after this one has started (time <= now), then this item is done.

        let isDone = false;

        // Check subsequent items
        for (let j = index + 1; j < items.length; j++) {
          const nextTime = parseTime(items[j].time);
          if (nowMinutes >= nextTime) {
            isDone = true;
            break;
          }
        }

        // If state changed, mark flag
        if (item.done !== isDone) {
          changed = true;
          return { ...item, done: isDone };
        }
        return item;
      });

      if (changed) {
        updateWidget(widget.id, {
          config: { ...config, items: newItems } as ScheduleConfig,
        });
      }
    };

    const interval = setInterval(checkTime, 10000); // Check every 10s
    checkTime(); // Initial check

    return () => clearInterval(interval);
  }, [autoProgress, items, hasClock, widget.id, updateWidget, config]);

  const toggle = (idx: number) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], done: !newItems[idx].done };
    updateWidget(widget.id, {
      config: { ...config, items: newItems } as ScheduleConfig,
    });
  };

  const taskSize = useScaledFont(widget.w, widget.h, 0.35, 14, 24);
  const timeSize = useScaledFont(widget.w, widget.h, 0.2, 10, 14);

  const getFontClass = () => {
    if (fontFamily === 'global') {
      return `font-${globalStyle.fontFamily}`;
    }
    return fontFamily;
  };

  return (
    <div
      className={`h-full flex flex-col p-4 bg-transparent rounded-lg ${getFontClass()}`}
    >
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {items.map((item: ScheduleItem, i: number) => (
          <button
            key={i}
            onClick={() => {
              toggle(i);
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              item.done
                ? 'bg-white/30 border-white/20 opacity-60'
                : 'bg-white/50 border-white/30'
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-indigo-300" />
            )}
            <div className="flex flex-col items-start">
              <span
                className={`font-mono font-bold ${item.done ? 'text-slate-400' : 'text-indigo-400'}`}
                style={{ fontSize: `${timeSize}px` }}
              >
                {item.time}
              </span>
              <span
                className={`font-bold leading-tight ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                style={{ fontSize: `${taskSize}px` }}
              >
                {item.task}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const ScheduleSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as ScheduleConfig;

  const hasClock = useMemo(
    () => activeDashboard?.widgets?.some((w) => w.type === 'clock') ?? false,
    [activeDashboard?.widgets]
  );

  const fonts = [
    { id: 'global', label: 'Inherit', icon: 'G' },
    { id: 'font-mono', label: 'Digital', icon: '01' },
    { id: 'font-sans', label: 'Modern', icon: 'Aa' },
    { id: 'font-handwritten', label: 'School', icon: '✏️' },
  ];

  return (
    <div className="space-y-6">
      {/* Typography */}
      <div>
        <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Type className="w-3 h-3" /> Typography
        </label>
        <div className="grid grid-cols-4 gap-2">
          {fonts.map((f) => (
            <button
              key={f.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, fontFamily: f.id },
                })
              }
              className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                config.fontFamily === f.id ||
                (!config.fontFamily && f.id === 'global')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <span className={`text-sm ${f.id} text-slate-900`}>{f.icon}</span>
              <span className="text-[8px] uppercase text-slate-600">
                {f.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Automation */}
      <div>
        <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Clock className="w-3 h-3" /> Automation
        </label>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Connect to Clock
            </span>
            <Toggle
              checked={config.autoProgress ?? false}
              onChange={(checked) =>
                updateWidget(widget.id, {
                  config: { ...config, autoProgress: checked },
                })
              }
            />
          </div>

          <p className="text-xs text-slate-500">
            Automatically check off items as time passes.
          </p>

          {/* Validation Note */}
          <div
            className={`flex items-start gap-2 p-2 rounded-lg text-xs transition-colors ${hasClock ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}
          >
            {hasClock ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>
              {hasClock
                ? 'Clock widget detected. Auto-progress active.'
                : 'Requires an active Clock widget to function.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
