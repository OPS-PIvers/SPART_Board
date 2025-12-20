import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetData } from '../../types';
import {
  VolumeX,
  Volume1,
  Volume2,
  Users,
  Briefcase,
  Sparkles,
  Trash2,
  ArrowRight,
} from 'lucide-react';

export const WorkSymbolsWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const { voice = 'none', routine = 'none' } = widget.config;

  const voices = [
    { id: 'silence', label: 'Silence', icon: VolumeX, color: 'bg-red-500' },
    { id: 'whisper', label: 'Whisper', icon: Volume1, color: 'bg-blue-400' },
    { id: 'group', label: 'Group Talk', icon: Volume2, color: 'bg-green-500' },
    { id: 'class', label: 'Class Talk', icon: Users, color: 'bg-indigo-500' },
  ];

  const routines = [
    {
      id: 'ready',
      label: 'Get Ready',
      icon: Briefcase,
      color: 'bg-orange-500',
    },
    { id: 'clean', label: 'Clean Up', icon: Trash2, color: 'bg-slate-500' },
    { id: 'task', label: 'On Task', icon: Sparkles, color: 'bg-amber-400' },
  ];

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Voice Level
        </label>
        <div className="grid grid-cols-4 gap-2">
          {voices.map((v) => (
            <button
              key={v.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: {
                    ...widget.config,
                    voice: voice === v.id ? 'none' : v.id,
                  },
                })
              }
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${voice === v.id ? `${v.color} border-white shadow-lg scale-105 text-white` : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
            >
              <v.icon className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase whitespace-nowrap">
                {v.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Instructional Routine
        </label>
        <div className="grid grid-cols-3 gap-2">
          {routines.map((r) => (
            <button
              key={r.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: {
                    ...widget.config,
                    routine: routine === r.id ? 'none' : r.id,
                  },
                })
              }
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${routine === r.id ? `${r.color} border-white shadow-lg scale-105 text-white` : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
            >
              <r.icon className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase whitespace-nowrap">
                {r.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
