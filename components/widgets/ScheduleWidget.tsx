
import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetData } from '../../types';
import { Circle, CheckCircle2, Clock } from 'lucide-react';

export const ScheduleWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const items = widget.config.items || [];

  const toggle = (idx: number) => {
    const newItems = [...items];
    newItems[idx].done = !newItems[idx].done;
    updateWidget(widget.id, { config: { ...widget.config, items: newItems } });
  };

  return (
    <div className="h-full flex flex-col p-4 bg-white rounded-lg">
      <div className="text-[10px] font-black uppercase text-indigo-500 tracking-widest mb-4 flex items-center gap-2">
        <Clock className="w-3 h-3" /> Our Daily Routine
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
        {items.map((item: any, i: number) => (
          <button 
            key={i} 
            onClick={() => toggle(i)}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${item.done ? 'bg-slate-50 border-slate-100' : 'bg-indigo-50 border-indigo-100'}`}
          >
            {item.done ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-indigo-300" />}
            <div className="flex flex-col items-start">
              <span className={`text-[10px] font-mono font-bold ${item.done ? 'text-slate-400' : 'text-indigo-400'}`}>{item.time}</span>
              <span className={`text-sm font-bold leading-tight ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.task}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
