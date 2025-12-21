import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData } from '../../types';

export const TrafficLightWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();

  const current = (widget.config.active as string) ?? 'none';

  const toggle = (light: 'red' | 'yellow' | 'green') => {
    updateWidget(widget.id, {
      config: { ...widget.config, active: current === light ? 'none' : light },
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
