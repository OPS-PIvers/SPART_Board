import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TrafficConfig } from '../../types';

export const TrafficLightWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as TrafficConfig;

  const current = config.active ?? 'none';

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
          aria-label="Red Light"
          aria-pressed={current === 'red'}
          onClick={() => {
            toggle('red');
          }}
          className={`w-16 h-16 rounded-full border-4 border-black/20 traffic-light light-red ${current === 'red' ? 'active bg-red-500' : 'bg-red-950/50'}`}
        />
        <button
          aria-label="Yellow Light"
          aria-pressed={current === 'yellow'}
          onClick={() => {
            toggle('yellow');
          }}
          className={`w-16 h-16 rounded-full border-4 border-black/20 traffic-light light-yellow ${current === 'yellow' ? 'active bg-yellow-400' : 'bg-yellow-950/50'}`}
        />
        <button
          aria-label="Green Light"
          aria-pressed={current === 'green'}
          onClick={() => {
            toggle('green');
          }}
          className={`w-16 h-16 rounded-full border-4 border-black/20 traffic-light light-green ${current === 'green' ? 'active bg-green-500' : 'bg-green-950/50'}`}
        />
      </div>
    </div>
  );
};
