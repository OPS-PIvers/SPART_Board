import { useState, useEffect, useRef, useCallback } from 'react';
import {
  TimeToolConfig,
  WidgetData,
  ExpectationsConfig,
  WidgetConfig,
} from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { playTimerAlert, resumeAudio } from '../../../utils/timeToolAudio';

export const useTimeTool = (widget: WidgetData) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as TimeToolConfig;

  // Local state for smooth display
  const [runningDisplayTime, setRunningDisplayTime] = useState(
    config.elapsedTime
  );
  const rafRef = useRef<number | null>(null);

  // Derived display time
  const displayTime = config.isRunning
    ? runningDisplayTime
    : config.elapsedTime;

  const handleStop = useCallback(
    (finalTime?: number) => {
      const timeToSave = finalTime ?? runningDisplayTime;
      updateWidget(widget.id, {
        config: {
          ...config,
          isRunning: false,
          elapsedTime: timeToSave,
          startTime: null,
        },
      });
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    },
    [config, updateWidget, widget.id, runningDisplayTime]
  );

  const handleStart = async () => {
    await resumeAudio();
    const now = Date.now();
    updateWidget(widget.id, {
      config: {
        ...config,
        isRunning: true,
        startTime: now,
        elapsedTime: displayTime,
      },
    });
    setRunningDisplayTime(displayTime);
  };

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
    setRunningDisplayTime(resetTime);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
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
      setRunningDisplayTime(s);
    },
    [config, updateWidget, widget.id]
  );

  // Ticking logic with requestAnimationFrame
  useEffect(() => {
    if (config.isRunning && config.startTime) {
      const startTime = config.startTime;
      const baseTime = config.elapsedTime;

      const tick = () => {
        const now = Date.now();
        const delta = (now - startTime) / 1000;

        let nextTime: number;
        if (config.mode === 'timer') {
          nextTime = Math.max(0, baseTime - delta);
          if (nextTime === 0) {
            handleStop(0);
            playTimerAlert(config.selectedSound);

            // Auto-switch voice level if configured
            if (
              config.timerEndVoiceLevel !== undefined &&
              config.timerEndVoiceLevel !== null &&
              activeDashboard
            ) {
              const wsWidget = activeDashboard.widgets.find(
                (w) => w.type === 'expectations'
              );
              if (wsWidget) {
                const wsConfig = wsWidget.config as ExpectationsConfig;
                const newConfig: ExpectationsConfig = {
                  ...wsConfig,
                  voiceLevel: config.timerEndVoiceLevel,
                };

                updateWidget(wsWidget.id, {
                  config: newConfig as WidgetConfig,
                });
              }
            }
            return;
          }
        } else {
          nextTime = baseTime + delta;
        }

        setRunningDisplayTime(nextTime);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    config.isRunning,
    config.startTime,
    config.elapsedTime,
    config.mode,
    config.selectedSound,
    config.timerEndVoiceLevel,
    activeDashboard,
    updateWidget,
    handleStop,
  ]);

  return {
    displayTime,
    isRunning: config.isRunning,
    mode: config.mode,
    config,
    handleStart,
    handleStop,
    handleReset,
    setTime,
  };
};
