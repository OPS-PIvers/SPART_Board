import React, { useState } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, WorkSymbolsConfig } from '../../types';
import {
  Volume2,
  Users,
  ArrowLeft,
  User,
  UsersRound,
  Ear,
  Heart,
  MessagesSquare,
  CheckCircle2,
} from 'lucide-react';

// --- Constants & Data ---

const VOLUME_OPTIONS = [
  {
    id: 0,
    label: 'Silence',
    sub: 'Independent',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 1,
    label: 'Whisper',
    sub: 'Partner Talk',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    id: 2,
    label: 'Conversation',
    sub: 'Table Talk',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  {
    id: 3,
    label: 'Presenter',
    sub: 'Speaking',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    id: 4,
    label: 'Outside',
    sub: 'Recess',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
];

const GROUP_OPTIONS: {
  id: WorkSymbolsConfig['workMode'];
  label: string;
  icon: typeof User;
  color: string;
  bg: string;
}[] = [
  {
    id: 'individual',
    label: 'Alone',
    icon: User,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    id: 'partner',
    label: 'Partner',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'group',
    label: 'Group',
    icon: UsersRound,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
];

const INTERACTION_OPTIONS: {
  id: WorkSymbolsConfig['interactionMode'];
  label: string;
  icon: typeof Heart;
  color: string;
  bg: string;
}[] = [
  {
    id: 'respectful',
    label: 'Respectful',
    icon: Heart,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    id: 'listening',
    label: 'Listening',
    icon: Ear,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    id: 'productive',
    label: 'Productive',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    id: 'discussion',
    label: 'Discussion',
    icon: MessagesSquare,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
];

export const WorkSymbolsWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as WorkSymbolsConfig;
  const { voiceLevel = null, workMode = null, interactionMode = null } = config;

  const [activeCategory, setActiveCategory] = useState<
    'volume' | 'groups' | 'interaction' | null
  >(null);

  const updateConfig = (newConfig: Partial<WorkSymbolsConfig>) => {
    updateWidget(widget.id, {
      config: { ...config, ...newConfig },
    });
  };

  // --- Render Sub-views ---

  const renderVolumeView = () => (
    <div className="flex flex-col h-full bg-transparent animate-in slide-in-from-right duration-200">
      <div className="flex items-center p-3 border-b border-white/20 backdrop-blur-sm shrink-0">
        <button
          onClick={() => setActiveCategory(null)}
          className="p-1 hover:bg-white/20 rounded-lg mr-2"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight">
          Volume Level
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
        {VOLUME_OPTIONS.map((v) => (
          <button
            key={v.id}
            onClick={() =>
              updateConfig({ voiceLevel: voiceLevel === v.id ? null : v.id })
            }
            className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all ${
              voiceLevel === v.id
                ? `${v.bg} border-current ${v.color} shadow-sm scale-[1.02]`
                : 'border-white/40 bg-white/20 text-slate-500 hover:border-white/60'
            }`}
          >
            <span className="text-2xl font-black opacity-40 w-6">{v.id}</span>
            <div className="text-left">
              <div className="font-black uppercase text-sm leading-tight">
                {v.label}
              </div>
              <div className="text-[10px] font-bold opacity-60 uppercase">
                {v.sub}
              </div>
            </div>
            {voiceLevel === v.id && (
              <CheckCircle2 className="ml-auto" size={18} />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderGroupsView = () => (
    <div className="flex flex-col h-full bg-transparent animate-in slide-in-from-right duration-200">
      <div className="flex items-center p-3 border-b border-white/20 backdrop-blur-sm shrink-0">
        <button
          onClick={() => setActiveCategory(null)}
          className="p-1 hover:bg-white/20 rounded-lg mr-2"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight">
          Group Size
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
        {GROUP_OPTIONS.map((g) => (
          <button
            key={g.id}
            onClick={() =>
              updateConfig({ workMode: workMode === g.id ? null : g.id })
            }
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              workMode === g.id
                ? `${g.bg} border-current ${g.color} shadow-sm scale-[1.02]`
                : 'border-white/40 bg-white/20 text-slate-500 hover:border-white/60'
            }`}
          >
            <g.icon size={24} strokeWidth={2.5} />
            <span className="font-black uppercase text-sm tracking-wide">
              {g.label}
            </span>
            {workMode === g.id && (
              <CheckCircle2 className="ml-auto" size={18} />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderInteractionView = () => (
    <div className="flex flex-col h-full bg-transparent animate-in slide-in-from-right duration-200">
      <div className="flex items-center p-3 border-b border-white/20 backdrop-blur-sm shrink-0">
        <button
          onClick={() => setActiveCategory(null)}
          className="p-1 hover:bg-white/20 rounded-lg mr-2"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="font-bold text-slate-800 uppercase text-sm tracking-tight">
          Interaction
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
        {INTERACTION_OPTIONS.map((i) => (
          <button
            key={i.id}
            onClick={() =>
              updateConfig({
                interactionMode: interactionMode === i.id ? null : i.id,
              })
            }
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
              interactionMode === i.id
                ? `${i.bg} border-current ${i.color} shadow-sm scale-[1.02]`
                : 'border-white/40 bg-white/20 text-slate-500 hover:border-white/60'
            }`}
          >
            <i.icon size={24} strokeWidth={2.5} />
            <span className="font-black uppercase text-sm tracking-wide">
              {i.label}
            </span>
            {interactionMode === i.id && (
              <CheckCircle2 className="ml-auto" size={18} />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  // --- Main Category Picker ---

  if (activeCategory === 'volume') return renderVolumeView();
  if (activeCategory === 'groups') return renderGroupsView();
  if (activeCategory === 'interaction') return renderInteractionView();

  const selectedVolume = VOLUME_OPTIONS.find((v) => v.id === voiceLevel);
  const selectedGroup = GROUP_OPTIONS.find((g) => g.id === workMode);
  const selectedInteraction = INTERACTION_OPTIONS.find(
    (i) => i.id === interactionMode
  );

  return (
    <div className="flex flex-col h-full bg-transparent p-3 gap-3 overflow-hidden animate-in fade-in duration-200">
      <button
        onClick={() => setActiveCategory('volume')}
        className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${
          selectedVolume
            ? `${selectedVolume.bg} border-current ${selectedVolume.color} shadow-sm`
            : 'bg-white/40 border-white/50 text-slate-600 hover:border-white/80 shadow-sm'
        }`}
      >
        <div
          className={`p-3 rounded-xl ${selectedVolume ? 'bg-white/50' : 'bg-white/20'}`}
        >
          <Volume2 size={24} strokeWidth={2.5} />
        </div>
        <div className="text-left flex-1">
          <div className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">
            Volume
          </div>
          <div className="font-black uppercase text-sm tracking-tight">
            {selectedVolume ? selectedVolume.label : 'Not Set'}
          </div>
        </div>
      </button>

      <button
        onClick={() => setActiveCategory('groups')}
        className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${
          selectedGroup
            ? `${selectedGroup.bg} border-current ${selectedGroup.color} shadow-sm`
            : 'bg-white/40 border-white/50 text-slate-600 hover:border-white/80 shadow-sm'
        }`}
      >
        <div
          className={`p-3 rounded-xl ${selectedGroup ? 'bg-white/50' : 'bg-white/20'}`}
        >
          <Users size={24} strokeWidth={2.5} />
        </div>
        <div className="text-left flex-1">
          <div className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">
            Group Size
          </div>
          <div className="font-black uppercase text-sm tracking-tight">
            {selectedGroup ? selectedGroup.label : 'Not Set'}
          </div>
        </div>
      </button>

      <button
        onClick={() => setActiveCategory('interaction')}
        className={`flex-1 flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${
          selectedInteraction
            ? `${selectedInteraction.bg} border-current ${selectedInteraction.color} shadow-sm`
            : 'bg-white/40 border-white/50 text-slate-600 hover:border-white/80 shadow-sm'
        }`}
      >
        <div
          className={`p-3 rounded-xl ${selectedInteraction ? 'bg-white/50' : 'bg-white/20'}`}
        >
          <MessagesSquare size={24} strokeWidth={2.5} />
        </div>
        <div className="text-left flex-1">
          <div className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">
            Interaction
          </div>
          <div className="font-black uppercase text-sm tracking-tight">
            {selectedInteraction ? selectedInteraction.label : 'Not Set'}
          </div>
        </div>
      </button>
    </div>
  );
};
