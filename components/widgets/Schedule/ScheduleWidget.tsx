import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/context/useDashboard';
import {
  WidgetData,
  ScheduleItem,
  ScheduleConfig,
  DEFAULT_GLOBAL_STYLE,
} from '@/types';
import { Circle, CheckCircle2, Clock, Timer } from 'lucide-react';
import { ScaledEmptyState } from '@/components/common/ScaledEmptyState';

/** Parses an "HH:MM" time string and returns minutes since midnight, or -1 if invalid. */
const parseScheduleTime = (t: string | undefined): number => {
  if (!t || !t.includes(':')) return -1;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return -1;
  if (h < 0 || h > 23 || m < 0 || m > 59) return -1;
  return h * 60 + m;
};

interface ScheduleRowProps {
  item: ScheduleItem;
  index: number;
  onToggle: (idx: number) => void;
  onStartTimer?: (item: ScheduleItem) => void;
  timeSize: number;
  taskSize: number;
  iconSize: number;
}

const ScheduleRow = React.memo<ScheduleRowProps>(
  ({ item, index, onToggle, onStartTimer }) => {
    const { t } = useTranslation();
    return (
      <div
        className={`flex-1 w-full flex items-center rounded-2xl border transition-all ${
          item.done
            ? 'bg-slate-100 border-slate-200 opacity-60'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
        style={{ minHeight: 0 }}
      >
        <button
          onClick={() => onToggle(index)}
          className="flex items-center flex-1 min-w-0"
          style={{ gap: 'min(16px, 3cqmin)', padding: 'min(16px, 3cqmin)' }}
        >
          {item.done ? (
            <CheckCircle2
              className="text-green-500 shrink-0"
              style={{
                width: 'min(32px, 8cqmin)',
                height: 'min(32px, 8cqmin)',
              }}
            />
          ) : (
            <Circle
              className="text-indigo-300 shrink-0"
              style={{
                width: 'min(32px, 8cqmin)',
                height: 'min(32px, 8cqmin)',
              }}
            />
          )}
          <div className="flex flex-col items-start justify-center min-w-0 flex-1">
            <span
              className={`font-mono font-black ${item.done ? 'text-slate-400' : 'text-indigo-400'}`}
              style={{ fontSize: 'min(24px, 6cqmin, 30cqw)' }}
            >
              {item.startTime ?? item.time ?? ''}
            </span>
            <span
              className={`font-black leading-tight truncate w-full text-left ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}
              style={{ fontSize: 'min(36px, 10cqmin, 80cqw)' }}
            >
              {item.task}
            </span>
          </div>
        </button>
        {item.endTime && onStartTimer && (
          <button
            onClick={() => onStartTimer(item)}
            className="shrink-0 text-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
            style={{
              padding: 'min(4px, 1cqmin)',
              marginRight: 'min(12px, 2.5cqmin)',
            }}
            title={t('widgets.schedule.startTimerUntil', { time: item.endTime })}
            aria-label={t('widgets.schedule.startTimerUntil', { time: item.endTime })}
          >
            <Timer
              className="shrink-0"
              style={{
                width: 'min(28px, 7cqmin)',
                height: 'min(28px, 7cqmin)',
              }}
            />
          </button>
        )}
      </div>
    );
  }
);

ScheduleRow.displayName = 'ScheduleRow';

import { WidgetLayout } from '@/components/widgets/WidgetLayout';

export const ScheduleWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { t } = useTranslation();
  const { updateWidget, activeDashboard, addWidget } = useDashboard();
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

  const handleStartTimer = useCallback(
    (item: ScheduleItem) => {
      if (!item.endTime) return;

      const endMinutes = parseScheduleTime(item.endTime);
      if (endMinutes < 0) return;

      const now = new Date();
      const nowSeconds =
        now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      const endSeconds = endMinutes * 60;

      const remainingSeconds = Math.max(0, endSeconds - nowSeconds);
      const spawnNow = Date.now();

      addWidget('time-tool', {
        x: widget.x + widget.w + 20,
        y: widget.y,
        config: {
          mode: 'timer',
          visualType: 'digital',
          duration: remainingSeconds,
          elapsedTime: remainingSeconds,
          isRunning: remainingSeconds > 0,
          startTime: remainingSeconds > 0 ? spawnNow : null,
          selectedSound: 'Gong',
        },
      });
    },
    [addWidget, widget.x, widget.y, widget.w]
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

      const newItems = currentItems.map((item, index) => {
        let isDone = false;

        let nextTime = -1;
        if (index < currentItems.length - 1) {
          const nextItem = currentItems[index + 1];
          nextTime = parseScheduleTime(nextItem.startTime ?? nextItem.time);
        } else {
          // Last item: assume 60 mins duration for auto-complete?
          const myTime = parseScheduleTime(item.startTime ?? item.time);
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
          className={`h-full w-full flex flex-col overflow-hidden ${getFontClass()}`}
          style={{ padding: 'min(12px, 2.5cqmin)' }}
        >
          <div
            className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col"
            style={{ gap: 'min(10px, 2cqmin)' }}
          >
            {items.map((item: ScheduleItem, i: number) => (
              <ScheduleRow
                key={i}
                index={i}
                item={item}
                onToggle={toggle}
                onStartTimer={handleStartTimer}
                timeSize={14}
                taskSize={18}
                iconSize={20}
              />
            ))}
            {items.length === 0 && (
              <ScaledEmptyState
                icon={Clock}
                title="No Schedule"
                subtitle="Flip to add schedule items."
                className="opacity-40"
              />
            )}
          </div>
        </div>
      }
    />
  );
};
