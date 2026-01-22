import React, { useState } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { useScaledFont } from '../../hooks/useScaledFont';
import {
  WidgetData,
  WorkSymbolsConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../types';
import * as Icons from 'lucide-react';

// --- Types & Constants ---
// ... (rest of constants remains same)

interface RoutineStep {
  icon: string;
  label: string;
  color: string;
}

interface Routine {
  id: string;
  label: string;
  icon: string;
  hint?: string;
  steps: RoutineStep[];
}

const ROUTINE_DB: Record<string, Routine[]> = {
  Blooms: [
    {
      id: 'b1',
      label: '1. Remember',
      icon: 'Archive',
      hint: 'Recall facts (Effect: 0.46)',
      steps: [{ icon: 'Pencil', label: 'Recall & List Facts', color: 'slate' }],
    },
    {
      id: 'b2',
      label: '2. Understand',
      icon: 'Book',
      hint: 'Construct meaning',
      steps: [
        { icon: 'MessageSquare', label: 'Summarize / Explain', color: 'blue' },
      ],
    },
    {
      id: 'b3',
      label: '3. Apply',
      icon: 'Play',
      hint: 'Carry out a procedure',
      steps: [{ icon: 'Zap', label: 'Solve / Implement', color: 'indigo' }],
    },
    {
      id: 'b4',
      label: '4. Analyze',
      icon: 'Brain',
      hint: 'Break into components',
      steps: [
        { icon: 'Brain', label: 'Attribute / Organize', color: 'purple' },
      ],
    },
    {
      id: 'b5',
      label: '5. Evaluate',
      icon: 'Award',
      hint: 'Make judgments',
      steps: [
        { icon: 'CheckCircle', label: 'Critique / Judge', color: 'amber' },
      ],
    },
    {
      id: 'b6',
      label: '6. Create',
      icon: 'Lightbulb',
      hint: 'Produce original work',
      steps: [
        { icon: 'PlusCircle', label: 'Design / Produce', color: 'green' },
      ],
    },
  ],
  Collaboration: [
    {
      id: 'reciprocal',
      label: 'Reciprocal Teaching',
      icon: 'Users',
      hint: 'Effect Size: 0.74',
      steps: [
        { icon: 'Search', label: 'Predict & Clarify', color: 'blue' },
        { icon: 'Ear', label: 'Listen to Summarizer', color: 'indigo' },
        { icon: 'HelpCircle', label: 'Question Content', color: 'purple' },
      ],
    },
    {
      id: 'tps',
      label: 'Think-Pair-Share',
      icon: 'Users',
      steps: [
        { icon: 'Lightbulb', label: 'Internal Think Time', color: 'amber' },
        {
          icon: 'MessageSquare',
          label: 'Dialogue with Partner',
          color: 'blue',
        },
        { icon: 'Share2', label: 'Whole Class Share', color: 'green' },
      ],
    },
  ],
  Literacy: [
    {
      id: 'nw',
      label: 'Notice & Wonder',
      icon: 'Eye',
      steps: [
        { icon: 'Eye', label: 'Close Observation', color: 'slate' },
        { icon: 'HelpCircle', label: 'Identify Wonders', color: 'purple' },
      ],
    },
    {
      id: 'sc',
      label: 'Stronger & Clearer',
      icon: 'RefreshCw',
      steps: [
        { icon: 'Pencil', label: 'Write First Draft', color: 'blue' },
        {
          icon: 'MessageSquare',
          label: 'Refine via Discussion',
          color: 'indigo',
        },
      ],
    },
  ],
  Thinking: [
    {
      id: 'stw',
      label: 'See-Think-Wonder',
      icon: 'Brain',
      steps: [
        { icon: 'Eye', label: 'What do you see?', color: 'blue' },
        { icon: 'Lightbulb', label: 'What do you think?', color: 'amber' },
        { icon: 'HelpCircle', label: 'What do you wonder?', color: 'purple' },
      ],
    },
  ],
};

export const WorkSymbolsWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, gradeFilter, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = (widget.config as WorkSymbolsConfig) ?? {};
  const activeRoutines = config.activeRoutines ?? [];
  const { voiceLevel = null, workMode = null } = config;

  const labelSize = useScaledFont(widget.w, widget.h, 0.25, 8, 12);
  const voiceSize = useScaledFont(widget.w, widget.h, 0.3, 10, 14);

  // View state: 'picker' or 'facilitator' (for specific routine steps)
  const [viewState, setViewState] = useState<'picker' | 'facilitator'>(
    'picker'
  );
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    null
  );
  const [activeCategory, setActiveCategory] =
    useState<keyof typeof ROUTINE_DB>('Blooms');

  // Helper to get current routine object
  const getCurrentRoutine = () => {
    if (!selectedRoutineId) return null;
    for (const cat in ROUTINE_DB) {
      const routine = ROUTINE_DB[cat].find((r) => r.id === selectedRoutineId);
      if (routine) return routine;
    }
    return null;
  };

  const toggleRoutine = (id: string) => {
    const newRoutines = activeRoutines.includes(id)
      ? activeRoutines.filter((r: string) => r !== id)
      : [...activeRoutines, id];

    updateWidget(widget.id, {
      config: { ...config, activeRoutines: newRoutines },
    });
  };

  const handleRoutineClick = (routineId: string) => {
    setSelectedRoutineId(routineId);
    setViewState('facilitator');

    if (!activeRoutines.includes(routineId)) {
      toggleRoutine(routineId);
    }
  };

  const onDragStart = (
    e: React.DragEvent,
    icon: string,
    color: string,
    label?: string
  ) => {
    e.dataTransfer.setData(
      'application/spart-sticker',
      JSON.stringify({ icon, color, label })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 9-12 High School View
  if (gradeFilter === '9-12') {
    if (viewState === 'facilitator') {
      const routine = getCurrentRoutine();
      if (!routine)
        return (
          <div onClick={() => setViewState('picker')}>
            Error: Routine not found
          </div>
        );

      return (
        <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 p-3 border-b bg-slate-50">
            <button
              onClick={() => setViewState('picker')}
              className="p-1.5 hover:bg-slate-200 rounded-full transition-colors"
            >
              <Icons.ArrowLeft size={18} className="text-slate-600" />
            </button>
            <div className="flex-1">
              <h3 className=" text-slate-800 leading-tight">{routine.label}</h3>
              {routine.hint && (
                <p className="text-[10px] text-slate-500">{routine.hint}</p>
              )}
            </div>
          </div>

          {/* Steps / Drag Zone */}
          <div className="flex-1 p-3 overflow-y-auto bg-slate-100">
            <div className="space-y-3">
              <div className="text-[10px]  text-slate-400 uppercase tracking-wider text-center mb-2">
                Drag icons to whiteboard
              </div>
              {routine.steps.map((step, idx) => {
                const IconComponent =
                  (Icons as unknown as Record<string, React.ElementType>)[
                    step.icon
                  ] ?? Icons.HelpCircle;
                const colorClass = `text-${step.color}-600`;
                const bgClass = `bg-${step.color}-50`;

                return (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) =>
                      onDragStart(e, step.icon, step.color, step.label)
                    }
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 bg-white cursor-grab active:cursor-grabbing hover:shadow-md transition-all group`}
                  >
                    <div
                      className={`p-2 rounded-lg ${bgClass} ${colorClass} group-hover:scale-110 transition-transform`}
                    >
                      <IconComponent size={24} />
                    </div>
                    <span className=" text-slate-700 text-sm">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Picker View
    return (
      <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden">
        {/* Category Tabs */}
        <div className="flex gap-1 p-2 bg-gray-50 border-b overflow-x-auto no-scrollbar">
          {Object.keys(ROUTINE_DB).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs  transition-all whitespace-nowrap ${
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
            {ROUTINE_DB[activeCategory].map((routine) => {
              const isActive = activeRoutines.includes(routine.id);
              const IconComponent =
                (Icons as unknown as Record<string, React.ElementType>)[
                  routine.icon
                ] ?? Icons.HelpCircle;

              return (
                <button
                  key={routine.id}
                  onClick={() => handleRoutineClick(routine.id)}
                  className={`p-3 border-2 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group relative overflow-hidden ${
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
                    className={`text-[10px]  text-center leading-tight ${
                      isActive ? 'text-blue-700' : 'text-gray-500'
                    }`}
                  >
                    {routine.label}
                  </span>
                  {isActive && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
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
    <div
      className={`flex h-full w-full p-2 gap-3 bg-transparent overflow-hidden select-none font-${globalStyle.fontFamily}`}
    >
      {/* Voice Level Thermometer */}

      <div className="flex-1 flex flex-col gap-1.5 h-full">
        <label className="text-[9px]  uppercase text-slate-500 tracking-widest pl-1 mb-1">
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
              <span
                className="font-black uppercase tracking-tight"
                style={{ fontSize: `${voiceSize}px` }}
              >
                {v.label}
              </span>
              <span
                className="font-bold opacity-60 uppercase"
                style={{ fontSize: `${voiceSize * 0.7}px` }}
              >
                {v.sub}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Working Mode Section */}
      <div className="w-28 flex flex-col gap-2 h-full border-l border-white/20 pl-3">
        {' '}
        <label className="text-[9px]  uppercase text-slate-500 tracking-widest mb-1">
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
            <span
              className="font-black uppercase text-center leading-tight px-1"
              style={{ fontSize: `${labelSize}px` }}
            >
              {m.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
