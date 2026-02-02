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
    <div className="flex items-center justify-center h-full w-full">
      <div className="bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] shadow-inner flex flex-col items-center border-2 border-white/10 p-[min(5cqw,2cqh)] gap-[min(5cqw,2cqh)]">
        <button
          onClick={() => {
            toggle('red');
          }}
          className={`w-[min(70cqw,22cqh)] h-[min(70cqw,22cqh)] rounded-full border-4 border-black/20 traffic-light light-red ${current === 'red' ? 'active bg-red-500' : 'bg-red-950/50'}`}
        />
        <button
          onClick={() => {
            toggle('yellow');
          }}
          className={`w-[min(70cqw,22cqh)] h-[min(70cqw,22cqh)] rounded-full border-4 border-black/20 traffic-light light-yellow ${current === 'yellow' ? 'active bg-yellow-400' : 'bg-yellow-950/50'}`}
        />
        <button
          onClick={() => {
            toggle('green');
          }}
          className={`w-[min(70cqw,22cqh)] h-[min(70cqw,22cqh)] rounded-full border-4 border-black/20 traffic-light light-green ${current === 'green' ? 'active bg-green-500' : 'bg-green-950/50'}`}
        />
      </div>
    </div>
  );
};
