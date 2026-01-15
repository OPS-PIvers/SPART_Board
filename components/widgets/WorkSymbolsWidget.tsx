import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, WorkSymbolsConfig } from '../../types';
import { User, Users, UsersRound } from 'lucide-react';

export const WorkSymbolsWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as WorkSymbolsConfig;
  const { voiceLevel = null, workMode = null } = config;

  const voices = [
    {
      id: 4,
      label: 'Outside',
      sub: '(Recess)',
      color: 'bg-red-500',
      text: 'text-white',
    },
    {
      id: 3,
      label: 'Presenter',
      sub: '(Speaking)',
      color: 'bg-orange-500',
      text: 'text-white',
    },
    {
      id: 2,
      label: 'Conversation',
      sub: '(Table Talk)',
      color: 'bg-yellow-400',
      text: 'text-slate-900',
    },
    {
      id: 1,
      label: 'Whisper',
      sub: '(Partner Talk)',
      color: 'bg-green-500',
      text: 'text-white',
    },
    {
      id: 0,
      label: 'Silence',
      sub: '(Independent)',
      color: 'bg-blue-500',
      text: 'text-white',
    },
  ];

  const modes: {
    id: 'individual' | 'partner' | 'group';
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: 'individual', label: 'On Your Own', icon: User },
    { id: 'partner', label: 'With a Partner', icon: Users },
    { id: 'group', label: 'With a Group', icon: UsersRound },
  ];

  return (
    <div className="flex h-full w-full p-2 gap-3 bg-transparent overflow-hidden select-none">
      {/* Voice Level Thermometer */}
      <div className="flex-1 flex flex-col gap-1.5 h-full">
        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest pl-1 mb-1">
          Voice Level
        </label>
        {voices.map((v) => (
          <button
            key={v.id}
            onClick={() =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  voiceLevel: voiceLevel === v.id ? null : v.id,
                },
              })
            }
            className={`flex items-center gap-3 px-3 flex-1 rounded-xl border-2 transition-all duration-300 ${
              voiceLevel === v.id
                ? `${v.color} border-white shadow-lg scale-[1.02] ${v.text}`
                : 'border-white/20 bg-white/30 text-slate-600 hover:bg-white/50'
            }`}
          >
            <span className="text-2xl font-black opacity-40">{v.id}</span>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[11px] font-black uppercase tracking-tight">
                {v.label}
              </span>
              <span className="text-[8px] font-bold opacity-60 uppercase">
                {v.sub}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Working Mode Section */}
      <div className="w-28 flex flex-col gap-2 h-full border-l border-white/20 pl-3">
        {' '}
        <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">
          Working...
        </label>
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  workMode: workMode === m.id ? null : m.id,
                },
              })
            }
            className={`flex flex-col items-center justify-center flex-1 gap-1 rounded-2xl border-2 transition-all duration-300 ${
              workMode === m.id
                ? 'bg-indigo-600 border-white shadow-lg scale-105 text-white'
                : 'border-white/20 bg-white/30 text-slate-600 hover:bg-white/50'
            }`}
          >
            <m.icon className="w-6 h-6" strokeWidth={2.5} />
            <span className="text-[8px] font-black uppercase text-center leading-tight px-1">
              {m.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
