import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TrafficConfig } from '../../types';
import { useScaledFont } from '../../hooks/useScaledFont';

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

  const lightSize = useScaledFont(widget.w, widget.h, 5.0, {
    minSize: 40,
    maxSize: 180,
  });

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div
        style={{
          padding: `${lightSize * 0.25}px`,
          gap: `${lightSize * 0.25}px`,
        }}
        className="bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] shadow-inner flex flex-col border-2 border-white/10"
      >
        <button
          onClick={() => {
            toggle('red');
          }}
          style={{ width: `${lightSize}px`, height: `${lightSize}px` }}
          className={`rounded-full border-4 border-black/20 traffic-light light-red transition-all duration-300 ${current === 'red' ? 'active bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-105' : 'bg-red-950/50 hover:bg-red-900/40'}`}
        />
        <button
          onClick={() => {
            toggle('yellow');
          }}
          style={{ width: `${lightSize}px`, height: `${lightSize}px` }}
          className={`rounded-full border-4 border-black/20 traffic-light light-yellow transition-all duration-300 ${current === 'yellow' ? 'active bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)] scale-105' : 'bg-yellow-950/50 hover:bg-yellow-900/40'}`}
        />
        <button
          onClick={() => {
            toggle('green');
          }}
          style={{ width: `${lightSize}px`, height: `${lightSize}px` }}
          className={`rounded-full border-4 border-black/20 traffic-light light-green transition-all duration-300 ${current === 'green' ? 'active bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)] scale-105' : 'bg-green-950/50 hover:bg-green-900/40'}`}
        />
      </div>
    </div>
  );
};
