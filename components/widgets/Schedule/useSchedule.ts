import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { ScheduleConfig, WidgetData } from '../../../types';

export const useSchedule = (widgetId: string, config: ScheduleConfig) => {
  const { updateWidget, activeDashboard, addWidget, removeWidget } =
    useDashboard();
  const { items = [], autoProgress = false } = config;

  const lastTriggeredMinute = useRef<number>(-1);

  const parseTime = useCallback((t: string) => {
    if (!t || !t.includes(':')) return -1;
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return -1;
    return h * 60 + m;
  }, []);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const checkEvents = () => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      let itemsChanged = false;
      const newItems = [...items];

      items.forEach((item, index) => {
        const startTime = parseTime(item.time);
        const endTime = item.endTime ? parseTime(item.endTime) : -1;

        // Auto-Progress logic
        if (autoProgress) {
          let calculatedEndTime = endTime;
          if (calculatedEndTime === -1) {
            if (index < items.length - 1) {
              calculatedEndTime = parseTime(items[index + 1].time);
            } else {
              calculatedEndTime = startTime + 60;
            }
          }

          const shouldBeDone = nowMinutes >= calculatedEndTime;
          if (item.done !== shouldBeDone) {
            newItems[index] = { ...item, done: shouldBeDone };
            itemsChanged = true;
          }
        }

        // Auto-Launch & Auto-Close (only once per minute)
        if (nowMinutes !== lastTriggeredMinute.current) {
          // Auto-Launch
          if (startTime === nowMinutes && item.autoLaunchWidget) {
            const exists = activeDashboard?.widgets.some(
              (w) => w.type === item.autoLaunchWidget
            );
            if (!exists && item.autoLaunchWidget) {
              const overrides: Partial<WidgetData> = {};
              if (
                item.type === 'timer' &&
                item.autoLaunchWidget === 'time-tool' &&
                endTime > startTime
              ) {
                overrides.config = {
                  mode: 'timer',
                  duration: (endTime - startTime) * 60,
                  isRunning: true,
                  startTime: Date.now(),
                } as unknown as WidgetData['config'];
              }
              addWidget(item.autoLaunchWidget, overrides);
            }
          }

          // Auto-Close
          if (
            endTime === nowMinutes &&
            item.autoCloseWidget &&
            item.autoLaunchWidget
          ) {
            const target = activeDashboard?.widgets.find(
              (w) => w.type === item.autoLaunchWidget
            );
            if (target) {
              removeWidget(target.id);
            }
          }
        }
      });

      if (nowMinutes !== lastTriggeredMinute.current) {
        lastTriggeredMinute.current = nowMinutes;
      }

      if (itemsChanged) {
        updateWidget(widgetId, {
          config: { ...config, items: newItems } as ScheduleConfig,
        });
      }
    };

    const interval = setInterval(checkEvents, 10000);
    checkEvents();
    return () => clearInterval(interval);
  }, [
    items,
    autoProgress,
    activeDashboard?.widgets,
    addWidget,
    removeWidget,
    updateWidget,
    widgetId,
    config,
    parseTime,
  ]);

  const activeIndex = useMemo(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const start = parseTime(item.time);
      let end = item.endTime ? parseTime(item.endTime) : -1;

      if (end === -1) {
        if (i < items.length - 1) {
          end = parseTime(items[i + 1].time);
        } else {
          end = start + 60;
        }
      }

      if (nowMinutes >= start && nowMinutes < end) {
        return i;
      }
    }
    return -1;
  }, [items, parseTime]);

  const countdown = useMemo(() => {
    if (activeIndex === -1) return null;
    const item = items[activeIndex];
    if (item.type !== 'timer') return null;

    const now = new Date();
    const nowSeconds =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    let endMinutes = item.endTime ? parseTime(item.endTime) : -1;
    if (endMinutes === -1) {
      if (activeIndex < items.length - 1) {
        endMinutes = parseTime(items[activeIndex + 1].time);
      } else {
        endMinutes = parseTime(item.time) + 60;
      }
    }

    const endSeconds = endMinutes * 60;
    const remaining = endSeconds - nowSeconds;

    return remaining > 0 ? formatCountdown(remaining) : '0:00';
  }, [items, activeIndex, parseTime]);

  const toggleDone = useCallback(
    (idx: number) => {
      const newItems = [...items];
      if (newItems[idx]) {
        newItems[idx] = { ...newItems[idx], done: !newItems[idx].done };
        updateWidget(widgetId, {
          config: { ...config, items: newItems } as ScheduleConfig,
        });
      }
    },
    [items, updateWidget, widgetId, config]
  );

  return {
    items,
    activeIndex,
    countdown,
    toggleDone,
  };
};
