import React, { useEffect, useRef } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TrafficConfig, TimeToolConfig } from '../../types';
import { Toggle } from '../common/Toggle';

export const TrafficLightWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as TrafficConfig;

  const current = config.active ?? 'none';

  // --- NEXUS CONNECTION: Timer -> Traffic Light ---
  // If syncWithTimer is enabled, listen to the active TimeTool widget
  const lastSyncStateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!config.syncWithTimer || !activeDashboard) return;

    // Find the first time-tool widget
    const timeTool = activeDashboard.widgets.find(
      (w) => w.type === 'time-tool'
    );
    if (!timeTool) return;

    const timerConfig = timeTool.config as TimeToolConfig;
    let desiredState = current;

    // Logic:
    // 1. If running -> GREEN
    // 2. If finished (0s) -> RED
    // 3. If paused (not running, not 0, not full) -> YELLOW
    // 4. If reset (full duration) -> OFF (or maintain current manual override?)
    //    Let's stick to Red/Green/Yellow for active states.

    if (timerConfig.isRunning) {
      desiredState = 'green';
    } else if (
      timerConfig.mode === 'timer' &&
      Math.abs(timerConfig.elapsedTime) < 0.1
    ) {
      // Finished
      desiredState = 'red';
    } else if (
      !timerConfig.isRunning &&
      timerConfig.mode === 'timer' &&
      timerConfig.elapsedTime < timerConfig.duration
    ) {
      // Paused mid-way
      desiredState = 'yellow';
    }

    // Only update if changed to avoid loop
    if (desiredState !== current) {
      // Avoid flickering or conflict by checking if we actually need to update
      // We use a ref to prevent identifying our own update as a change needed?
      // No, activeDashboard updates come from top.
      updateWidget(widget.id, {
        config: {
          ...config,
          active: desiredState,
        } as TrafficConfig,
      });
    }
  }, [
    config.syncWithTimer,
    activeDashboard, // This triggers whenever ANY widget updates, which is good for listening
    widget.id,
    current,
    config, // Need full config for updateWidget spread
    updateWidget,
  ]);

  const toggle = (light: 'red' | 'yellow' | 'green') => {
    updateWidget(widget.id, {
      config: {
        ...config,
        active: current === light ? 'none' : light,
      } as TrafficConfig,
    });
  };

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-slate-800 p-4 rounded-3xl shadow-inner flex flex-col gap-4 border-2 border-slate-700">
        <button
          onClick={() => {
            toggle('red');
          }}
          className={`w-16 h-16 rounded-full border-4 border-black/20 traffic-light light-red ${current === 'red' ? 'active bg-red-500' : 'bg-red-950/50'}`}
        />
        <button
          onClick={() => {
            toggle('yellow');
          }}
          className={`w-16 h-16 rounded-full border-4 border-black/20 traffic-light light-yellow ${current === 'yellow' ? 'active bg-yellow-400' : 'bg-yellow-950/50'}`}
        />
        <button
          onClick={() => {
            toggle('green');
          }}
          className={`w-16 h-16 rounded-full border-4 border-black/20 traffic-light light-green ${current === 'green' ? 'active bg-green-500' : 'bg-green-950/50'}`}
        />
      </div>
    </div>
  );
};

export const TrafficLightSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as TrafficConfig;

  const hasTimer = activeDashboard?.widgets.some(
    (w) => w.type === 'time-tool'
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xxs font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Nexus Connections
        </label>

        {!hasTimer ? (
           <div className="text-xs text-amber-500 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center gap-2">
            <span>
              ⚠️ Add a &quot;Timer&quot; widget to use this feature.
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600 font-bold">Sync with Timer</span>
            <Toggle
              checked={config.syncWithTimer ?? false}
              onChange={(checked) =>
                updateWidget(widget.id, {
                  config: { ...config, syncWithTimer: checked } as TrafficConfig,
                })
              }
            />
          </div>
        )}
         <p className="text-xxs text-slate-400 mt-2 leading-relaxed">
          When enabled, the traffic light will automatically change based on the timer:
          <br />• <strong>Green:</strong> Timer Running
          <br />• <strong>Yellow:</strong> Timer Paused
          <br />• <strong>Red:</strong> Timer Finished
        </p>
      </div>
    </div>
  );
};
