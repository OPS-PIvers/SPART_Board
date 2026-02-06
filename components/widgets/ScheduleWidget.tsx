import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { useScaledFont } from '../../hooks/useScaledFont';
import {
  WidgetData,
  ScheduleItem,
  ScheduleConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../types';
import { Circle, CheckCircle2, Type, Clock, AlertTriangle } from 'lucide-react';
import { Toggle } from '../common/Toggle';

interface ScheduleRowProps {
  item: ScheduleItem;
  index: number;
  onToggle: (idx: number) => void;
  timeSize: number;
  taskSize: number;
  iconSize: number;
}

const ScheduleRow = React.memo<ScheduleRowProps>(
  ({ item, index, onToggle, timeSize, taskSize, iconSize }) => {
    return (
      <button
        onClick={() => onToggle(index)}
        className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
          item.done
            ? 'bg-white/30 border-white/20 opacity-60'
            : 'bg-white/50 border-white/30'
        }`}
      >
        {item.done ? (
          <CheckCircle2 className="text-green-500 shrink-0" size={iconSize} />
        ) : (
          <Circle className="text-indigo-300 shrink-0" size={iconSize} />
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
    );
  }
);

ScheduleRow.displayName = 'ScheduleRow';

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

  // Stable callback pattern: Store full config in ref to ensure
  // we preserve all properties during updates while keeping handler stable.
  const configRef = useRef(config);
  const itemsRef = useRef(items);

  // Update refs when config or items change
  useEffect(() => {
    configRef.current = config;
    itemsRef.current = items;
  }, [config, items]);

  const toggle = useCallback(
    (idx: number) => {
      const currentConfig = configRef.current;
      const currentItems = itemsRef.current;
      const newItems = [...currentItems];
      if (newItems[idx]) {
        newItems[idx] = { ...newItems[idx], done: !newItems[idx].done };

        updateWidget(widget.id, {
          config: { ...currentConfig, items: newItems } as ScheduleConfig,
        });
      }
    },
    [updateWidget, widget.id]
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
      const currentItems = itemsRef.current;
      const currentConfig = configRef.current;

      // Helper to parse "HH:MM" with validation
      const parseTime = (t: string) => {
        if (!t || !t.includes(':')) return -1;
        const [h, m] = t.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return -1;
        return h * 60 + m;
      };

      const newItems = currentItems.map((item, index) => {
        let isDone = false;

        let nextTime = -1;
        if (index < currentItems.length - 1) {
          nextTime = parseTime(currentItems[index + 1].time);
        } else {
          // Last item: assume 60 mins duration for auto-complete?
          const myTime = parseTime(item.time);
          if (myTime !== -1) nextTime = myTime + 60;
        }

        if (nextTime !== -1 && nowMinutes >= nextTime) {
          isDone = true;
        }

        if (item.done !== isDone) {
          changed = true;
          return { ...item, done: isDone };
        }
        return item;
      });

      if (changed) {
        updateWidget(widget.id, {
          config: {
            ...currentConfig,
            items: newItems,
          } as ScheduleConfig,
        });
      }
    };

    const interval = setInterval(checkTime, 10000); // Check every 10s
    checkTime(); // Initial check

    return () => clearInterval(interval);
  }, [autoProgress, hasClock, widget.id, updateWidget]);

  const taskSize = useScaledFont(widget.w, widget.h, 0.35, 14, 36);
  const timeSize = useScaledFont(widget.w, widget.h, 0.2, 10, 22);
  const iconSize = useScaledFont(widget.w, widget.h, 0.3, 16, 32);

  const getFontClass = () => {
    if (fontFamily === 'global') {
      return `font-${globalStyle.fontFamily}`;
    }
    if (fontFamily.startsWith('font-')) {
      return fontFamily;
    }
    return `font-${fontFamily}`;
  };

  return (
    <div className={`h-full flex flex-col p-2 ${getFontClass()}`}>
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {items.map((item: ScheduleItem, i: number) => (
          <ScheduleRow
            key={i}
            index={i}
            item={item}
            onToggle={toggle}
            timeSize={timeSize}
            taskSize={taskSize}
            iconSize={iconSize}
          />
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
        <label className="text-xxs text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Type className="w-3 h-3" /> Typography
        </label>
        <div className="grid grid-cols-4 gap-2">
          {fonts.map((f) => (
            <button
              key={f.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, fontFamily: f.id } as ScheduleConfig,
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
              <span className="text-xxxs uppercase text-slate-600">
                {f.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Automation */}
      <div>
        <label className="text-xxs text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
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
                  config: {
                    ...config,
                    autoProgress: checked,
                  } as ScheduleConfig,
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
