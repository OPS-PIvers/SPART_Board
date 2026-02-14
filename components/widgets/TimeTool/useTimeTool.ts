import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TimeToolConfig,
  WidgetData,
  ExpectationsConfig,
  WidgetConfig,
} from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { playTimerAlert, resumeAudio } from '../../../utils/timeToolAudio';

export const useTimeToolActions = (widget: WidgetData) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as TimeToolConfig;

  const handleStop = useCallback(
    (finalTime?: number) => {
      let timeToSave = finalTime;

      // If no explicit finalTime provided, calculate it from start time
      if (timeToSave === undefined && config.isRunning && config.startTime) {
        const delta = (Date.now() - config.startTime) / 1000;
        if (config.mode === 'timer') {
          timeToSave = Math.max(0, config.elapsedTime - delta);
        } else {
          timeToSave = config.elapsedTime + delta;
        }
      }

      // Fallback to current elapsed time if not running or calculation logic skipped
      timeToSave ??= config.elapsedTime;

      updateWidget(widget.id, {
        config: {
          ...config,
          isRunning: false,
          elapsedTime: timeToSave,
          startTime: null,
        },
      });
    },
    [config, updateWidget, widget.id]
  );

  const handleStart = useCallback(async () => {
    await resumeAudio();
    const now = Date.now();
    updateWidget(widget.id, {
      config: {
        ...config,
        isRunning: true,
        startTime: now,
        // When starting, we resume from current elapsedTime
        elapsedTime: config.elapsedTime,
      },
    });
  }, [config, updateWidget, widget.id]);

  const handleReset = useCallback(() => {
    const resetTime = config.mode === 'timer' ? config.duration : 0;
    updateWidget(widget.id, {
      config: {
        ...config,
        isRunning: false,
        elapsedTime: resetTime,
        startTime: null,
      },
    });
  }, [config, updateWidget, widget.id]);

  const setTime = useCallback(
    (s: number) => {
      updateWidget(widget.id, {
        config: {
          ...config,
          elapsedTime: s,
          duration: s,
          isRunning: false,
          startTime: null,
        },
      });
    },
    [config, updateWidget, widget.id]
  );

  return {
    isRunning: config.isRunning,
    mode: config.mode,
    config,
    handleStart,
    handleStop,
    handleReset,
    setTime,
  };
};

export const useTimeToolTicker = (
  widget: WidgetData,
  onStop: (finalTime: number) => void
) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as TimeToolConfig;
  const rafRef = useRef<number | null>(null);

  // Local state for smooth animation
  const [runningDisplayTime, setRunningDisplayTime] = useState(
    config.elapsedTime
  );

  // Sync local state when config updates (e.g. reset/stopped)
  useEffect(() => {
    if (!config.isRunning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRunningDisplayTime(config.elapsedTime);
    }
  }, [config.elapsedTime, config.isRunning]);

  const cancelRaf = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // RAF tick loop
  useEffect(() => {
    if (!config.isRunning || !config.startTime) {
      cancelRaf();
      return;
    }

    const startTime = config.startTime;
    const baseTime = config.elapsedTime;

    const tick = () => {
      const delta = (Date.now() - startTime) / 1000;

      if (config.mode === 'timer') {
        const nextTime = Math.max(0, baseTime - delta);
        setRunningDisplayTime(nextTime);

        if (nextTime === 0) {
          // Timer finished
          onStop(0);
          playTimerAlert(config.selectedSound);

          // Auto-switch expectations voice level
          if (config.timerEndVoiceLevel != null && activeDashboard) {
            const expWidget = activeDashboard.widgets.find(
              (w) => w.type === 'expectations'
            );
            if (expWidget) {
              updateWidget(expWidget.id, {
                config: {
                  ...(expWidget.config as ExpectationsConfig),
                  voiceLevel: config.timerEndVoiceLevel,
                } as WidgetConfig,
              });
            }
          }
          cancelRaf();
          return;
        }
      } else {
        // Stopwatch
        setRunningDisplayTime(baseTime + delta);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return cancelRaf;
  }, [
    config.isRunning,
    config.startTime,
    config.elapsedTime,
    config.mode,
    config.selectedSound,
    config.timerEndVoiceLevel,
    activeDashboard,
    updateWidget,
    onStop,
    cancelRaf,
  ]);

  const displayTime = config.isRunning
    ? runningDisplayTime
    : config.elapsedTime;

  return displayTime;
};
