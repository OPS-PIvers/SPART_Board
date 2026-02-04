import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { ScheduleConfig, WidgetData, TimeToolConfig } from '../../../types';

const DEFAULT_EVENT_DURATION_MINUTES = 60;

export const useSchedule = (widgetId: string, config: ScheduleConfig) => {
  const { updateWidget, activeDashboard, addWidget, removeWidget } =
    useDashboard();
  const { items = [] } = config;

  const [now, setNow] = useState(new Date());
  const lastTriggeredMinute = useRef<number>(-1);

  // Use refs for stable access in the effect without re-running it
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const parseTime = useCallback((t: string) => {
    if (!t || !t.includes(':')) return -1;
    const [h, m] = t.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return -1;
    return h * 60 + m;
  }, []);

  const formatCountdown = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    const checkEvents = () => {
      const currentTime = new Date();
      // Always update 'now' state to keep activeIndex and countdown fresh
      setNow(currentTime);

      const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

      // Fix race condition and redundant checks for per-minute actions
      if (nowMinutes === lastTriggeredMinute.current) {
        return;
      }

      lastTriggeredMinute.current = nowMinutes;

      const currentConfig = configRef.current;
      const currentItems = currentConfig.items ?? [];
      const currentAutoProgress = currentConfig.autoProgress ?? false;
      let itemsChanged = false;
      const newItems = [...currentItems];

      currentItems.forEach((item, index) => {
        const startTime = parseTime(item.time);
        const endTime = item.endTime ? parseTime(item.endTime) : -1;

        // Auto-Progress logic
        if (currentAutoProgress) {
          let calculatedEndTime = endTime;
          if (calculatedEndTime === -1) {
            if (index < currentItems.length - 1) {
              calculatedEndTime = parseTime(currentItems[index + 1].time);
            } else {
              calculatedEndTime = startTime + DEFAULT_EVENT_DURATION_MINUTES;
            }
          }

          const shouldBeDone = nowMinutes >= calculatedEndTime;
          if (item.done !== shouldBeDone) {
            newItems[index] = { ...item, done: shouldBeDone };
            itemsChanged = true;
          }
        }

        // Auto-Launch
        if (startTime === nowMinutes && item.autoLaunchWidget) {
          const exists = activeDashboard?.widgets.some(
            (w) => w.type === item.autoLaunchWidget
          );
          if (!exists) {
            const overrides: Partial<WidgetData> = {};
            if (
              item.type === 'timer' &&
              item.autoLaunchWidget === 'time-tool' &&
              endTime > startTime
            ) {
              overrides.config = {
                mode: 'timer',
                visualType: 'digital',
                theme: 'light',
                duration: (endTime - startTime) * 60,
                elapsedTime: 0,
                isRunning: true,
                startTime: Date.now(),
                selectedSound: 'Gong',
              } as TimeToolConfig;
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
          const matchingWidgets =
            activeDashboard?.widgets.filter(
              (w) => w.type === item.autoLaunchWidget
            ) ?? [];

          if (matchingWidgets.length === 1 && matchingWidgets[0]) {
            removeWidget(matchingWidgets[0].id);
          }
        }
      });

      if (itemsChanged) {
        updateWidget(widgetId, {
          config: { ...currentConfig, items: newItems } as ScheduleConfig,
        });
      }
    };

    const interval = setInterval(checkEvents, 1000);
    checkEvents();
    return () => clearInterval(interval);
  }, [
    activeDashboard?.widgets,
    addWidget,
    removeWidget,
    updateWidget,
    widgetId,
    parseTime,
  ]);

  const activeIndex = useMemo(() => {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const start = parseTime(item.time);
      if (start === -1) continue;

      let end = item.endTime ? parseTime(item.endTime) : -1;

      if (end === -1) {
        if (i < items.length - 1) {
          end = parseTime(items[i + 1].time);
        } else {
          end = start + DEFAULT_EVENT_DURATION_MINUTES;
        }
      }

      if (nowMinutes >= start && nowMinutes < end) {
        return i;
      }
    }
    return -1;
  }, [items, parseTime, now]);

  const countdown = useMemo(() => {
    if (activeIndex === -1) return null;
    const item = items[activeIndex];
    if (!item || item.type !== 'timer') return null;

    const nowSeconds =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    let endMinutes = item.endTime ? parseTime(item.endTime) : -1;
    if (endMinutes === -1) {
      if (activeIndex < items.length - 1) {
        endMinutes = parseTime(items[activeIndex + 1].time);
      } else {
        const startMinutes = parseTime(item.time);
        if (startMinutes !== -1) {
          endMinutes = startMinutes + DEFAULT_EVENT_DURATION_MINUTES;
        }
      }
    }

    if (endMinutes === -1) return null;

    const endSeconds = endMinutes * 60;
    const remaining = endSeconds - nowSeconds;

    return remaining > 0 ? formatCountdown(remaining) : '0:00';
  }, [activeIndex, items, now, parseTime, formatCountdown]);

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
