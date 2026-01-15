import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, ScheduleItem, ScheduleConfig } from '../../types';
import { Circle, CheckCircle2 } from 'lucide-react';

export const ScheduleWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as ScheduleConfig;
  const items = config.items ?? [];

  const toggle = (idx: number) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], done: !newItems[idx].done };
    updateWidget(widget.id, {
      config: { ...config, items: newItems } as ScheduleConfig,
    });
  };

  return (
    <div className="h-full flex flex-col p-4 bg-transparent rounded-lg">
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {items.map((item: ScheduleItem, i: number) => (
          <button
            key={i}
            onClick={() => {
              toggle(i);
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              item.done
                ? 'bg-white/30 border-white/20 opacity-60'
                : 'bg-white/50 border-white/30'
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <Circle className="w-5 h-5 text-indigo-300" />
            )}
            <div className="flex flex-col items-start">
              <span
                className={`text-[10px] font-mono font-bold ${item.done ? 'text-slate-400' : 'text-indigo-400'}`}
              >
                {item.time}
              </span>
              <span
                className={`text-sm font-bold leading-tight ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}
              >
                {item.task}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
