import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { useInstructionalRoutines } from '../../hooks/useInstructionalRoutines';
import {
  WidgetData,
  InstructionalRoutinesConfig,
  RoutineStep,
  WidgetType,
  WidgetConfig,
  TimeToolConfig,
  SoundConfig,
  TrafficConfig,
  RandomConfig,
  PollConfig,
} from '../../types';
import {
  ROUTINES as DEFAULT_ROUTINES,
  InstructionalRoutine,
} from '../../config/instructionalRoutines';
import { COMMON_INSTRUCTIONAL_ICONS } from '../../config/instructionalIcons';
import * as Icons from 'lucide-react';
import {
  Star,
  Trash2,
  Plus,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Grab,
  Rocket,
  Settings,
  Save,
  PlusCircle,
} from 'lucide-react';
import { WIDGET_DEFAULTS } from '../../config/widgetDefaults';
import { BLOOMS_DATA } from '../../config/bloomsData';

const QUICK_TOOLS: {
  label: string;
  type: WidgetType | 'none';
  config?: WidgetConfig;
}[] = [
  { label: 'None', type: 'none' },
  {
    label: 'Timer (1 min)',
    type: 'time-tool',
    config: {
      ...(WIDGET_DEFAULTS['time-tool'].config as TimeToolConfig),
      mode: 'timer',
      duration: 60,
      isRunning: true,
    },
  },
  {
    label: 'Timer (2 min)',
    type: 'time-tool',
    config: {
      ...(WIDGET_DEFAULTS['time-tool'].config as TimeToolConfig),
      mode: 'timer',
      duration: 120,
      isRunning: true,
    },
  },
  {
    label: 'Timer (5 min)',
    type: 'time-tool',
    config: {
      ...(WIDGET_DEFAULTS['time-tool'].config as TimeToolConfig),
      mode: 'timer',
      duration: 300,
      isRunning: true,
    },
  },
  {
    label: 'Stopwatch',
    type: 'time-tool',
    config: {
      ...(WIDGET_DEFAULTS['time-tool'].config as TimeToolConfig),
      mode: 'stopwatch',
      isRunning: true,
    },
  },
  {
    label: 'Noise Meter',
    type: 'sound',
    config: {
      ...(WIDGET_DEFAULTS['sound'].config as SoundConfig),
      sensitivity: 50,
      visual: 'balls',
    },
  },
  {
    label: 'Traffic Light',
    type: 'traffic',
    config: {
      ...(WIDGET_DEFAULTS['traffic'].config as TrafficConfig),
      active: 'red',
    },
  },
  {
    label: 'Random Picker',
    type: 'random',
    config: {
      ...(WIDGET_DEFAULTS['random'].config as RandomConfig),
      mode: 'spinner',
    },
  },
  {
    label: 'Poll',
    type: 'poll',
    config: {
      ...(WIDGET_DEFAULTS['poll'].config as PollConfig),
      question: '',
      options: [],
    },
  },
];

// --- FRONT VIEW (STUDENT FOCUS) ---
const IconPicker: React.FC<{
  currentIcon: string;
  onSelect: (icon: string) => void;
  color?: string;
}> = ({ currentIcon, onSelect, color = 'blue' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center justify-center text-${color}-600 bg-${color}-50`}
        title="Select Icon"
      >
        {(Icons as unknown as Record<string, React.ElementType>)[
          currentIcon
        ] ? (
          React.createElement(
            (Icons as unknown as Record<string, React.ElementType>)[
              currentIcon
            ],
            { size: 16 }
          )
        ) : (
          <Icons.HelpCircle size={16} />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-[100] bg-white border border-slate-200 shadow-2xl rounded-2xl p-3 w-64 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xxs font-black uppercase text-slate-400">
              Select Icon
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <Icons.X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
            {COMMON_INSTRUCTIONAL_ICONS.map((icon) => {
              const IconComp = (
                Icons as unknown as Record<string, React.ElementType>
              )[icon];
              if (!IconComp) return null;
              return (
                <button
                  key={icon}
                  onClick={() => {
                    onSelect(icon);
                    setIsOpen(false);
                  }}
                  className={`p-2 rounded-lg transition-all hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center ${
                    currentIcon === icon
                      ? 'bg-blue-600 text-white shadow-lg scale-110'
                      : 'text-slate-500'
                  }`}
                >
                  <IconComp size={16} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const InstructionalRoutinesWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, gradeFilter, addWidget, clearAllStickers } =
    useDashboard();
  const { isAdmin } = useAuth();
  const {
    routines: cloudRoutines,
    saveRoutine,
    deleteRoutine,
  } = useInstructionalRoutines();

  // Merge cloud routines with defaults
  const ROUTINES = useMemo(() => {
    if (cloudRoutines.length === 0) return DEFAULT_ROUTINES;

    // Create a map by ID to ensure cloud ones override defaults if IDs match
    const routineMap = new Map<string, InstructionalRoutine>();
    DEFAULT_ROUTINES.forEach((r) => routineMap.set(r.id, r));
    cloudRoutines.forEach((r) => routineMap.set(r.id, r));

    return Array.from(routineMap.values());
  }, [cloudRoutines]);
  const config = widget.config as InstructionalRoutinesConfig;
  const {
    selectedRoutineId,
    customSteps = [],
    favorites = [],
    scaleMultiplier = 1,
  } = config;

  const [isManagingLibrary, setIsManagingLibrary] = useState(false);
  const [editingRoutine, setEditingRoutine] =
    useState<InstructionalRoutine | null>(null);

  const selectedRoutine = ROUTINES.find((r) => r.id === selectedRoutineId);

  // Mathematical Scaling
  const dynamicFontSize = useMemo(() => {
    // Adjusted divisor to 24 to provide better scaling for typical content density
    // Reduced min size to 8px to ensure content fits in smaller windows
    const baseSize = Math.min(widget.w / 24, widget.h / 24);
    return Math.max(8, baseSize * scaleMultiplier);
  }, [widget.w, widget.h, scaleMultiplier]);

  const displayedRoutines = useMemo(() => {
    const filtered = ROUTINES.filter(
      (r) => gradeFilter === 'all' || r.gradeLevels.includes(gradeFilter)
    );
    return filtered.sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [gradeFilter, favorites, ROUTINES]);

  const selectRoutine = (r: InstructionalRoutine) => {
    const initialSteps: RoutineStep[] = r.steps.map((step) => ({
      id: crypto.randomUUID(),
      text: step.text,
      icon: step.icon,
      color: step.color,
      label: step.label,
    }));
    updateWidget(widget.id, {
      config: { ...config, selectedRoutineId: r.id, customSteps: initialSteps },
    });
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

  if (isManagingLibrary && isAdmin) {
    const routine = editingRoutine ?? {
      id: crypto.randomUUID(),
      name: '',
      grades: 'Universal',
      gradeLevels: ['k-2', '3-5', '6-8', '9-12'],
      icon: 'Zap',
      steps: [{ text: '', icon: 'Zap', color: 'blue', label: 'Step' }],
    };

    const handleSave = async () => {
      if (!routine.name) return;
      await saveRoutine(routine);
      setIsManagingLibrary(false);
      setEditingRoutine(null);
    };

    return (
      <div className="flex flex-col h-full bg-slate-50 p-4 overflow-y-auto custom-scrollbar">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => {
              setIsManagingLibrary(false);
              setEditingRoutine(null);
            }}
            className="p-1 hover:bg-slate-200 rounded-full"
          >
            <ArrowLeft size={18} />
          </button>
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 flex-1">
            {editingRoutine ? 'Edit Routine Template' : 'Add New Routine'}
          </h3>
          <button
            onClick={handleSave}
            disabled={!routine.name}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xxs font-black uppercase tracking-wider hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={14} />
            Save to Library
          </button>
        </div>

        <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xxxs font-black uppercase text-slate-400 ml-1">
                Routine Name
              </label>
              <input
                type="text"
                value={routine.name}
                onChange={(e) =>
                  setEditingRoutine({
                    ...routine,
                    name: e.target.value,
                  } as InstructionalRoutine)
                }
                placeholder="e.g. Think-Pair-Share"
                className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-xxxs font-black uppercase text-slate-400 ml-1">
                Main Icon
              </label>
              <IconPicker
                currentIcon={routine.icon}
                onSelect={(icon) =>
                  setEditingRoutine({
                    ...routine,
                    icon,
                  } as InstructionalRoutine)
                }
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <label className="text-xxs font-black uppercase text-slate-400 tracking-widest block mb-2">
              Default Steps
            </label>
            {routine.steps.map((step, i) => (
              <div
                key={i}
                className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <IconPicker
                      currentIcon={step.icon ?? 'Zap'}
                      color={step.color}
                      onSelect={(icon) => {
                        const nextSteps = [...routine.steps];
                        nextSteps[i] = { ...step, icon };
                        setEditingRoutine({
                          ...routine,
                          steps: nextSteps,
                        } as InstructionalRoutine);
                      }}
                    />
                    <input
                      type="text"
                      value={step.label ?? ''}
                      onChange={(e) => {
                        const nextSteps = [...routine.steps];
                        nextSteps[i] = { ...step, label: e.target.value };
                        setEditingRoutine({
                          ...routine,
                          steps: nextSteps,
                        } as InstructionalRoutine);
                      }}
                      placeholder="Label"
                      className="w-16 bg-white border-none rounded px-2 py-0.5 text-[9px] font-bold text-emerald-600"
                    />
                    <select
                      value={step.color ?? 'blue'}
                      onChange={(e) => {
                        const nextSteps = [...routine.steps];
                        nextSteps[i] = { ...step, color: e.target.value };
                        setEditingRoutine({
                          ...routine,
                          steps: nextSteps,
                        } as InstructionalRoutine);
                      }}
                      className="bg-white border-none rounded px-2 py-0.5 text-[9px] font-bold text-slate-600"
                    >
                      {[
                        'blue',
                        'amber',
                        'indigo',
                        'green',
                        'slate',
                        'purple',
                        'rose',
                      ].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={step.text}
                    onChange={(e) => {
                      const nextSteps = [...routine.steps];
                      nextSteps[i] = { ...step, text: e.target.value };
                      setEditingRoutine({
                        ...routine,
                        steps: nextSteps,
                      } as InstructionalRoutine);
                    }}
                    rows={1}
                    placeholder="Instruction text..."
                    className="w-full text-[11px] font-bold bg-white border-none rounded-lg px-2 py-1 leading-tight resize-none text-slate-800"
                  />
                </div>
                <button
                  onClick={() => {
                    const nextSteps = routine.steps.filter(
                      (_, idx) => idx !== i
                    );
                    setEditingRoutine({
                      ...routine,
                      steps: nextSteps,
                    } as InstructionalRoutine);
                  }}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const nextSteps = [
                  ...routine.steps,
                  { text: '', icon: 'Zap', color: 'blue', label: 'Step' },
                ];
                setEditingRoutine({
                  ...routine,
                  steps: nextSteps,
                } as InstructionalRoutine);
              }}
              className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2 text-xxs font-black uppercase"
            >
              <PlusCircle size={14} /> Add Template Step
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedRoutineId || !selectedRoutine) {
    return (
      <div className="flex flex-col h-full bg-brand-gray-lightest p-4 overflow-hidden">
        <div className="flex justify-between items-center mb-3 shrink-0">
          <div className="text-xxs font-black uppercase text-slate-400 tracking-widest">
            Library ({gradeFilter.toUpperCase()})
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setIsManagingLibrary(true)}
                className="flex items-center gap-1 text-xxs font-black uppercase text-blue-600 hover:text-blue-700 transition-colors"
                title="Manage global routine library"
              >
                <Settings size={12} />
                Manage
              </button>
            )}
            <button
              onClick={clearAllStickers}
              className="flex items-center gap-1 text-xxs font-black uppercase text-red-500 hover:text-red-600 transition-colors"
              title="Remove all stickers from board"
            >
              <Trash2 size={12} />
              Clear Board
            </button>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-1 pb-4">
          {displayedRoutines.map((r) => {
            const Icon =
              (Icons as unknown as Record<string, React.ElementType>)[r.icon] ??
              Icons.HelpCircle;
            const isFav = favorites.includes(r.id);
            return (
              <div key={r.id} className="relative group/card">
                <button
                  onClick={() => selectRoutine(r)}
                  className="w-full h-full relative p-4 border-2 border-white rounded-2xl bg-white shadow-sm hover:border-brand-blue-primary transition-all text-left"
                >
                  <Icon className="w-8 h-8 text-brand-red-primary mb-2" />
                  <div className="text-[11px] font-black text-brand-gray-darkest uppercase leading-tight">
                    {r.name}
                  </div>
                </button>
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = isFav
                        ? favorites.filter((f) => f !== r.id)
                        : [...favorites, r.id];
                      updateWidget(widget.id, {
                        config: { ...config, favorites: next },
                      });
                    }}
                    className={`p-1 rounded-full bg-white/80 backdrop-blur shadow-sm border border-slate-100 ${isFav ? 'text-brand-blue-light' : 'text-slate-300 hover:text-slate-500'}`}
                  >
                    <Star size={12} className={isFav ? 'fill-current' : ''} />
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRoutine(r);
                          setIsManagingLibrary(true);
                        }}
                        className="p-1 rounded-full bg-white/80 backdrop-blur shadow-sm border border-slate-100 text-blue-400 hover:text-blue-600"
                      >
                        <PlusCircle size={12} />
                      </button>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              'Delete this template from the global library?'
                            )
                          ) {
                            await deleteRoutine(r.id);
                          }
                        }}
                        className="p-1 rounded-full bg-white/80 backdrop-blur shadow-sm border border-slate-100 text-red-300 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const RoutineIcon =
    (Icons as unknown as Record<string, React.ElementType>)[
      selectedRoutine.icon
    ] ?? Icons.HelpCircle;

  const launchBloomsResource = (type: 'keyWords' | 'questionStarters') => {
    const title =
      type === 'keyWords' ? "Bloom's Key Words" : "Bloom's Sentence Starters";

    let content = `<h3 style="font-weight: 900; margin-bottom: 0.5em; text-transform: uppercase; color: #1e293b;">${title}</h3>`;

    if (type === 'keyWords') {
      BLOOMS_DATA.keyWords.forEach((levelGroup) => {
        content += `<h4 style="font-weight: 800; margin-top: 1em; margin-bottom: 0.25em; color: #2d3f89; font-size: 0.9em;">${levelGroup.level}</h4><ul style="padding-left: 1.2em; list-style-type: disc; color: #475569; font-size: 0.85em;">`;
        levelGroup.words.forEach((item) => {
          content += `<li>${item}</li>`;
        });
        content += `</ul>`;
      });
    } else {
      BLOOMS_DATA.questionStarters.forEach((levelGroup) => {
        content += `<h4 style="font-weight: 800; margin-top: 1em; margin-bottom: 0.25em; color: #2d3f89; font-size: 0.9em;">${levelGroup.level}</h4><ul style="padding-left: 1.2em; list-style-type: disc; color: #475569; font-size: 0.85em;">`;
        levelGroup.starters.forEach((item) => {
          content += `<li>${item}</li>`;
        });
        content += `</ul>`;
      });
    }

    addWidget('text', {
      config: {
        content,
        bgColor: '#ffffff',
        fontSize: 16,
      },
    });
  };

  return (
    <div
      className="flex flex-col h-full bg-white animate-in fade-in duration-200 overflow-hidden relative"
      style={{
        fontSize: `${dynamicFontSize}px`,
        padding: '1.5em',
      }}
    >
      <div
        className="flex items-center shrink-0 border-b border-brand-blue-lighter"
        style={{ gap: '1em', marginBottom: '1.5em', paddingBottom: '1em' }}
      >
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, selectedRoutineId: null },
            })
          }
          className="rounded-full transition-colors hover:bg-slate-100"
          style={{ padding: '0.5em' }}
          title="Back to Library"
        >
          <ArrowLeft size={dynamicFontSize * 1.5} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h2
            className="text-brand-blue-primary leading-tight font-bold"
            style={{ fontSize: '1.4em' }}
          >
            {selectedRoutine.name}
          </h2>
          <span
            className="text-brand-blue-light uppercase tracking-widest block mt-[0.2em]"
            style={{ fontSize: '0.6em' }}
          >
            {selectedRoutine.grades} Protocol
          </span>
        </div>
        <button
          onClick={clearAllStickers}
          className="bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
          style={{ padding: '0.6em' }}
          title="Clear all stickers from board"
        >
          <Trash2 size={dynamicFontSize * 1.25} />
        </button>
        <div
          className="bg-brand-blue-lighter text-brand-red-primary rounded-3xl shadow-sm flex items-center justify-center"
          style={{ padding: '1em' }}
        >
          <RoutineIcon style={{ width: '2em', height: '2em' }} />
        </div>
      </div>

      {selectedRoutine.id === 'blooms-analysis' && (
        <div
          className="flex shrink-0 px-1"
          style={{ gap: '1em', marginBottom: '1em' }}
        >
          <button
            onClick={() => launchBloomsResource('keyWords')}
            className="flex-1 bg-brand-blue-lighter/50 text-brand-blue-primary rounded-xl font-black uppercase tracking-wider hover:bg-brand-blue-lighter transition-colors border border-brand-blue-lighter flex items-center justify-center"
            style={{ padding: '1em', gap: '0.5em', fontSize: '0.7em' }}
          >
            <Icons.Key size={dynamicFontSize * 1.2} /> Key Words
          </button>
          <button
            onClick={() => launchBloomsResource('questionStarters')}
            className="flex-1 bg-brand-blue-lighter/50 text-brand-blue-primary rounded-xl font-black uppercase tracking-wider hover:bg-brand-blue-lighter transition-colors border border-brand-blue-lighter flex items-center justify-center"
            style={{ padding: '1em', gap: '0.5em', fontSize: '0.7em' }}
          >
            <Icons.MessageSquare size={dynamicFontSize * 1.2} /> Sentence
            Starters
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="flex flex-col" style={{ gap: '1.5em' }}>
          {customSteps.map((step, i) => {
            const StepIcon = step.icon
              ? (Icons as unknown as Record<string, React.ElementType>)[
                  step.icon
                ]
              : null;
            return (
              <li
                key={step.id}
                className="flex items-start animate-in slide-in-from-left duration-300 group"
                style={{ gap: '1em' }}
              >
                <span
                  className="bg-brand-blue-primary text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    width: '2.5em',
                    height: '2.5em',
                    fontSize: '0.8em',
                  }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 flex flex-col" style={{ gap: '0.5em' }}>
                  <div
                    className="flex items-start justify-between"
                    style={{ gap: '1em' }}
                  >
                    <p
                      className="font-bold text-brand-gray-darkest leading-relaxed pt-1"
                      style={{ fontSize: '1em' }}
                    >
                      {step.text}
                    </p>

                    {StepIcon && step.icon && (
                      <div
                        draggable
                        onDragStart={(e) =>
                          onDragStart(
                            e,
                            step.icon as string,
                            step.color ?? 'blue',
                            step.label
                          )
                        }
                        className={`rounded-xl bg-white border-2 border-${step.color ?? 'blue'}-100 shadow-sm cursor-grab active:cursor-grabbing hover:scale-110 hover:-rotate-3 transition-all shrink-0 flex flex-col items-center group/sticker`}
                        style={{ padding: '0.5em', gap: '0.25em' }}
                        title="Drag to whiteboard"
                      >
                        <div
                          className={`rounded-lg bg-${step.color ?? 'blue'}-50 text-${step.color ?? 'blue'}-600`}
                          style={{ padding: '0.4em' }}
                        >
                          <StepIcon
                            size={dynamicFontSize * 1.5}
                            strokeWidth={2.5}
                          />
                        </div>
                        {step.label && (
                          <span
                            className="font-black uppercase text-slate-500 text-center leading-none"
                            style={{ fontSize: '0.5em' }}
                          >
                            {step.label}
                          </span>
                        )}
                        <div
                          className="flex items-center opacity-0 group-hover/sticker:opacity-100 transition-opacity"
                          style={{ gap: '0.1em' }}
                        >
                          <Grab
                            size={dynamicFontSize * 0.5}
                            className="text-slate-300"
                          />
                          <span
                            className="font-black uppercase text-slate-400"
                            style={{ fontSize: '0.4em' }}
                          >
                            Drag
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {step.attachedWidget && (
                    <button
                      onClick={() =>
                        addWidget(step.attachedWidget?.type as WidgetType, {
                          config: step.attachedWidget?.config,
                        })
                      }
                      className="self-start bg-brand-blue-light/10 text-brand-blue-primary rounded-lg font-black uppercase tracking-wider flex items-center hover:bg-brand-blue-light/20 transition-colors"
                      style={{
                        padding: '0.5em 1em',
                        gap: '0.5em',
                        fontSize: '0.8em',
                      }}
                    >
                      <Rocket size={dynamicFontSize} />
                      Launch {step.attachedWidget.label}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

// --- SETTINGS VIEW (TEACHER EDITOR) ---
export const InstructionalRoutinesSettings: React.FC<{
  widget: WidgetData;
}> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const { isAdmin } = useAuth();
  const config = widget.config as InstructionalRoutinesConfig;
  const { customSteps = [], scaleMultiplier = 1 } = config;

  const moveStep = (idx: number, dir: 'up' | 'down') => {
    const next = [...customSteps];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updateWidget(widget.id, { config: { ...config, customSteps: next } });
  };

  return (
    <div className="space-y-6">
      {/* Switch Routine Fix: Resets selection and flips back to grid */}
      <button
        onClick={() =>
          updateWidget(widget.id, {
            flipped: false,
            config: { ...config, selectedRoutineId: null },
          })
        }
        className="w-full py-2.5 bg-brand-blue-lighter text-brand-blue-primary rounded-xl text-xxs  uppercase tracking-widest hover:bg-brand-blue-light/20 transition-colors"
      >
        Switch Routine Template
      </button>

      <div className="space-y-3">
        <label className="text-xxs  uppercase text-slate-400 tracking-[0.2em] block mb-2">
          Step Editor
        </label>
        {customSteps.map((step, i) => (
          <div
            key={step.id}
            className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-slate-100 group shadow-sm"
          >
            <div className="flex flex-col gap-1 shrink-0">
              <button
                onClick={() => moveStep(i, 'up')}
                className="text-slate-300 hover:text-brand-blue-primary"
              >
                <ChevronUp size={14} />
              </button>
              <button
                onClick={() => moveStep(i, 'down')}
                className="text-slate-300 hover:text-brand-blue-primary"
              >
                <ChevronDown size={14} />
              </button>
            </div>
            {/* Stable Key Fix: Using step.id prevents focus loss */}
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconPicker
                    currentIcon={step.icon ?? 'Zap'}
                    color={step.color}
                    onSelect={(icon) => {
                      const next = [...customSteps];
                      next[i] = { ...next[i], icon };
                      updateWidget(widget.id, {
                        config: { ...config, customSteps: next },
                      });
                    }}
                  />
                  <span className="text-xxxs font-bold text-slate-400 uppercase">
                    Step {i + 1}
                  </span>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      <span className="text-xxxs font-black uppercase text-slate-400">
                        Label:
                      </span>
                      <input
                        type="text"
                        value={step.label ?? ''}
                        onChange={(e) => {
                          const next = [...customSteps];
                          next[i] = { ...next[i], label: e.target.value };
                          updateWidget(widget.id, {
                            config: { ...config, customSteps: next },
                          });
                        }}
                        placeholder="Keyword"
                        className="w-16 bg-transparent border-none p-0 text-[9px] font-bold text-emerald-600 focus:ring-0"
                      />
                    </div>
                  </div>
                )}
              </div>
              <textarea
                value={step.text}
                onChange={(e) => {
                  const next = [...customSteps];
                  next[i] = { ...next[i], text: e.target.value };
                  updateWidget(widget.id, {
                    config: { ...config, customSteps: next },
                  });
                }}
                rows={2}
                placeholder="Enter student direction..."
                className="w-full text-[11px]  bg-transparent border-none focus:ring-0 p-0 leading-tight resize-none text-slate-800"
              />
              <div className="flex items-center gap-2">
                <span className="text-xxxs font-bold text-slate-400 uppercase">
                  Attached Tool:
                </span>
                <select
                  value={
                    // Robust lookup: match existing config type/label, OR fallback to attached label
                    step.attachedWidget
                      ? (QUICK_TOOLS.find(
                          (t) =>
                            t.type === step.attachedWidget?.type &&
                            t.label === step.attachedWidget.label
                        )?.label ?? step.attachedWidget.label)
                      : 'None'
                  }
                  onChange={(e) => {
                    const selectedTool = QUICK_TOOLS.find(
                      (t) => t.label === e.target.value
                    );
                    const next = [...customSteps];
                    if (
                      selectedTool &&
                      selectedTool.type !== 'none' &&
                      selectedTool.config
                    ) {
                      next[i] = {
                        ...next[i],
                        attachedWidget: {
                          type: selectedTool.type,
                          label: selectedTool.label,
                          config: selectedTool.config,
                        },
                      };
                    } else {
                      // Remove attached widget
                      const { attachedWidget: _unused, ...rest } = next[i];
                      next[i] = rest as RoutineStep;
                    }
                    updateWidget(widget.id, {
                      config: { ...config, customSteps: next },
                    });
                  }}
                  className="text-xxs bg-slate-50 border border-slate-200 rounded p-1"
                >
                  {QUICK_TOOLS.map((t) => (
                    <option key={t.label} value={t.label}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() =>
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    customSteps: customSteps.filter((_, idx) => idx !== i),
                  },
                })
              }
              className="p-2 text-red-400 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: {
                ...config,
                customSteps: [
                  ...customSteps,
                  { id: crypto.randomUUID(), text: '' },
                ],
              },
            })
          }
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-brand-blue-primary hover:text-brand-blue-primary transition-all flex items-center justify-center gap-2 text-xxs  uppercase"
        >
          <Plus className="w-4 h-4" /> Add Next Step
        </button>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl">
        <label className="text-xxs  uppercase text-slate-400 tracking-widest mb-3 block">
          Text Zoom
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={scaleMultiplier}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: {
                ...config,
                scaleMultiplier: parseFloat(e.target.value),
              },
            })
          }
          className="w-full accent-brand-blue-primary"
        />
      </div>
    </div>
  );
};
