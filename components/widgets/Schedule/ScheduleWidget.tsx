import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { useDashboard } from '../../../context/useDashboard';
import {
  WidgetData,
  ScheduleItem,
  ScheduleConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../../types';
import { Circle, CheckCircle2, Clock } from 'lucide-react';

interface ScheduleRowProps {
  item: ScheduleItem;
  index: number;
  onToggle: (idx: number) => void;
  timeSize: number;
  taskSize: number;
  iconSize: number;
}

const ScheduleRow = React.memo<ScheduleRowProps>(
  ({ item, index, onToggle }) => {
    return (
      <button
        onClick={() => onToggle(index)}
        className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
          item.done
            ? 'bg-slate-100 border-slate-200 opacity-60'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        {item.done ? (
          <CheckCircle2
            className="text-green-500 shrink-0"
            style={{ width: 'min(6cqw, 10cqh)', height: 'min(6cqw, 10cqh)' }}
          />
        ) : (
          <Circle
            className="text-indigo-300 shrink-0"
            style={{ width: 'min(6cqw, 10cqh)', height: 'min(6cqw, 10cqh)' }}
          />
        )}
        <div className="flex flex-col items-start min-w-0">
          <span
            className={`font-mono font-bold ${item.done ? 'text-slate-400' : 'text-indigo-400'}`}
            style={{ fontSize: 'min(3.5cqw, 5cqh)' }}
          >
            {item.startTime ?? item.time ?? ''}
          </span>
          <span
            className={`font-bold leading-tight truncate w-full text-left ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}
            style={{ fontSize: 'min(4.5cqw, 7cqh)' }}
          >
            {item.task}
          </span>
        </div>
      </button>
    );
  }
);

ScheduleRow.displayName = 'ScheduleRow';

import { WidgetLayout } from '../WidgetLayout';

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
      const parseTime = (t?: string) => {
        if (!t || !t.includes(':')) return -1;
        const [h, m] = t.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return -1;
        return h * 60 + m;
      };

      const newItems = currentItems.map((item, index) => {
        let isDone = false;

        let nextTime = -1;
        if (index < currentItems.length - 1) {
          const nextItem = currentItems[index + 1];
          nextTime = parseTime(nextItem.startTime ?? nextItem.time);
        } else {
          // Last item: assume 60 mins duration for auto-complete?
          const myTime = parseTime(item.startTime ?? item.time);
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
    <WidgetLayout
      padding="p-0"
      content={
        <div
          className={`h-full w-full flex flex-col p-4 overflow-hidden ${getFontClass()}`}
        >
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {items.map((item: ScheduleItem, i: number) => (
              <ScheduleRow
                key={i}
                index={i}
                item={item}
                onToggle={toggle}
                timeSize={14} // These will be used as base for min(cqw, cqh) in Row
                taskSize={18}
                iconSize={20}
              />
            ))}
            {items.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2 opacity-20 py-10">
                <Clock className="w-12 h-12" />
                <span className="text-xs font-black uppercase tracking-widest">
                  No Schedule
                </span>
              </div>
            )}
          </div>
        </div>
      }
    />
  );
};
