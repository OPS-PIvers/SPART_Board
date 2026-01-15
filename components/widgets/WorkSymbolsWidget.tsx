import React, { useState } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, WorkSymbolsConfig } from '../../types';
import * as Icons from 'lucide-react';

const ROUTINE_CATEGORIES = {
  Collaboration: [
    { id: 'think-pair-share', label: 'Think-Pair-Share', icon: 'Users' },
    { id: 'turn-talk', label: 'Turn and Talk', icon: 'MessageSquare' },
    { id: 'gallery-walk', label: 'Gallery Walk', icon: 'Footprints' },
    {
      id: 'socratic-seminar',
      label: 'Socratic Seminar',
      icon: 'GraduationCap',
    },
    { id: 'fishbowl', label: 'Fishbowl', icon: 'CircleDot' },
    { id: 'jigsaw', label: 'Jigsaw', icon: 'Puzzle' },
  ],
  Literacy: [
    { id: 'notice-wonder', label: 'Notice and Wonder', icon: 'Search' },
    { id: 'chalk-talk', label: 'Chalk Talk', icon: 'Pencil' },
    {
      id: 'stronger-clearer',
      label: 'Stronger and Clearer',
      icon: 'RefreshCw',
    },
    { id: 'annotation', label: 'Active Annotation', icon: 'Highlighter' },
    { id: 'reading-protocol', label: 'Reading Protocol', icon: 'BookOpen' },
  ],
  Thinking: [
    { id: 'see-think-wonder', label: 'See-Think-Wonder', icon: 'Eye' },
    { id: 'compass-points', label: 'Compass Points', icon: 'Compass' },
    { id: 'bridge-321', label: '3-2-1 Bridge', icon: 'Bridge' },
    {
      id: 'claim-support-question',
      label: 'Claim-Support-Question',
      icon: 'HelpCircle',
    },
  ],
  Catalyst: [
    { id: 'do-now', label: 'Do Now / Bell Ringer', icon: 'Play' },
    { id: 'exit-ticket', label: 'Exit Ticket', icon: 'LogOut' },
    { id: 'cfu', label: 'Check for Understanding', icon: 'CheckCircle2' },
    {
      id: 'direct-instruction',
      label: 'Direct Instruction',
      icon: 'Presentation',
    },
  ],
};

export const WorkSymbolsWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, gradeFilter } = useDashboard();
  const config = (widget.config as WorkSymbolsConfig) ?? {};
  const activeRoutines = config.activeRoutines ?? [];
  const { voiceLevel = null, workMode = null } = config;
  const [activeCategory, setActiveCategory] =
    useState<keyof typeof ROUTINE_CATEGORIES>('Collaboration');

  const toggleRoutine = (id: string) => {
    const newRoutines = activeRoutines.includes(id)
      ? activeRoutines.filter((r: string) => r !== id)
      : [...activeRoutines, id];

    updateWidget(widget.id, {
      config: { ...config, activeRoutines: newRoutines },
    });
  };

  // 9-12 High School View
  if (gradeFilter === '9-12') {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden">
        {/* Category Tabs */}
        <div className="flex gap-1 p-2 bg-gray-50 border-b overflow-x-auto no-scrollbar">
          {(
            Object.keys(ROUTINE_CATEGORIES) as Array<
              keyof typeof ROUTINE_CATEGORIES
            >
          ).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of Routine Cards */}
        <div className="flex-1 p-3 overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            {ROUTINE_CATEGORIES[activeCategory].map((routine) => {
              const isActive = activeRoutines.includes(routine.id);
              const IconComponent =
                (Icons as unknown as Record<string, React.ElementType>)[
                  routine.icon
                ] ?? Icons.HelpCircle;

              return (
                <button
                  key={routine.id}
                  onClick={() => toggleRoutine(routine.id)}
                  className={`p-3 border-2 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`p-2 rounded-full transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                    }`}
                  >
                    <IconComponent size={20} />
                  </div>
                  <span
                    className={`text-[10px] font-bold text-center leading-tight ${
                      isActive ? 'text-blue-700' : 'text-gray-500'
                    }`}
                  >
                    {routine.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Original K-8 View
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
    { id: 'individual', label: 'On Your Own', icon: Icons.User },
    { id: 'partner', label: 'With a Partner', icon: Icons.Users },
    { id: 'group', label: 'With a Group', icon: Icons.UsersRound },
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
