import React, { useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
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
  ROUTINES,
  InstructionalRoutine,
} from '../../config/instructionalRoutines';
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
} from 'lucide-react';
import { WIDGET_DEFAULTS } from '../../config/widgetDefaults';

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
export const InstructionalRoutinesWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, gradeFilter, addWidget, clearAllStickers } = useDashboard();
  const config = widget.config as InstructionalRoutinesConfig;
  const {
    selectedRoutineId,
    customSteps = [],
    favorites = [],
    scaleMultiplier = 1,
  } = config;

  const selectedRoutine = ROUTINES.find((r) => r.id === selectedRoutineId);

  // Mathematical Scaling
  const dynamicFontSize = useMemo(() => {
    const baseSize = Math.min(widget.w / 18, widget.h / 12);
    return Math.max(12, baseSize * scaleMultiplier);
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
  }, [gradeFilter, favorites]);

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

  if (!selectedRoutineId || !selectedRoutine) {
    return (
      <div className="flex flex-col h-full bg-brand-gray-lightest p-4">
        <div className="flex justify-between items-center mb-3">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Library ({gradeFilter.toUpperCase()})
          </div>
          <button
            onClick={clearAllStickers}
            className="flex items-center gap-1 text-[10px] font-black uppercase text-red-500 hover:text-red-600 transition-colors"
            title="Remove all stickers from board"
          >
            <Trash2 size={12} />
            Clear Board
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar">
          {displayedRoutines.map((r) => {
            const Icon =
              (Icons as unknown as Record<string, React.ElementType>)[r.icon] ??
              Icons.HelpCircle;
            const isFav = favorites.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => selectRoutine(r)}
                className="relative p-4 border-2 border-white rounded-2xl bg-white shadow-sm hover:border-brand-blue-primary transition-all text-left"
              >
                <Star
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = isFav
                      ? favorites.filter((f) => f !== r.id)
                      : [...favorites, r.id];
                    updateWidget(widget.id, {
                      config: { ...config, favorites: next },
                    });
                  }}
                  className={`absolute top-2 right-2 w-4 h-4 ${isFav ? 'fill-brand-blue-light text-brand-blue-light' : 'text-slate-200 hover:text-slate-400'}`}
                />
                <Icon className="w-8 h-8 text-brand-red-primary mb-2" />
                <div className="text-[11px]  text-brand-gray-darkest uppercase leading-tight">
                  {r.name}
                </div>
              </button>
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

  return (
    <div className="flex flex-col h-full bg-white p-6 animate-in fade-in duration-200 overflow-hidden relative">
      <div className="flex items-center gap-3 mb-6 shrink-0 border-b border-brand-blue-lighter pb-4">
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, selectedRoutineId: null },
            })
          }
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          title="Back to Library"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <h2
            className=" text-brand-blue-primary leading-tight"
            style={{ fontSize: `${dynamicFontSize * 1.4}px` }}
          >
            {selectedRoutine.name}
          </h2>
          <span className="text-[10px]  text-brand-blue-light uppercase tracking-widest">
            {selectedRoutine.grades} Protocol
          </span>
        </div>
        <button
          onClick={clearAllStickers}
          className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
          title="Clear all stickers from board"
        >
          <Trash2 size={18} />
        </button>
        <div className="p-4 bg-brand-blue-lighter text-brand-red-primary rounded-3xl shadow-sm">
          <RoutineIcon className="w-8 h-8" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="space-y-8">
          {customSteps.map((step, i) => {
            const StepIcon = step.icon
              ? (Icons as unknown as Record<string, React.ElementType>)[
                  step.icon
                ]
              : null;
            return (
              <li
                key={step.id}
                className="flex gap-4 items-start animate-in slide-in-from-left duration-300 group"
              >
                <span
                  className="w-8 h-8 bg-brand-blue-primary text-white rounded-xl flex items-center justify-center  shrink-0 shadow-lg"
                  style={{ fontSize: `${dynamicFontSize * 0.8}px` }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-4">
                    <p
                      className="font-bold text-brand-gray-darkest leading-relaxed pt-1"
                      style={{ fontSize: `${dynamicFontSize}px` }}
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
                        className={`p-2 rounded-xl bg-white border-2 border-${step.color ?? 'blue'}-100 shadow-sm cursor-grab active:cursor-grabbing hover:scale-110 hover:-rotate-3 transition-all shrink-0 flex flex-col items-center gap-1 group/sticker`}
                        title="Drag to whiteboard"
                      >
                        <div
                          className={`p-1.5 rounded-lg bg-${step.color ?? 'blue'}-50 text-${step.color ?? 'blue'}-600`}
                        >
                          <StepIcon size={18} strokeWidth={2.5} />
                        </div>
                        {step.label && (
                          <span className="text-[8px] font-black uppercase text-slate-500 text-center leading-none">
                            {step.label}
                          </span>
                        )}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/sticker:opacity-100 transition-opacity">
                          <Grab size={8} className="text-slate-300" />
                          <span className="text-[6px] font-black uppercase text-slate-400">
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
                      className="self-start px-3 py-1.5 bg-brand-blue-light/10 text-brand-blue-primary rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-brand-blue-light/20 transition-colors"
                    >
                      <Rocket size={12} />
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
        className="w-full py-2.5 bg-brand-blue-lighter text-brand-blue-primary rounded-xl text-[10px]  uppercase tracking-widest hover:bg-brand-blue-light/20 transition-colors"
      >
        Switch Routine Template
      </button>

      <div className="space-y-3">
        <label className="text-[10px]  uppercase text-slate-400 tracking-[0.2em] block mb-2">
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
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {step.icon && (
                  <span
                    className={`text-${step.color ?? 'blue'}-600 bg-${step.color ?? 'blue'}-50 p-1 rounded`}
                  >
                    {(Icons as unknown as Record<string, React.ElementType>)[
                      step.icon
                    ]
                      ? React.createElement(
                          (
                            Icons as unknown as Record<
                              string,
                              React.ElementType
                            >
                          )[step.icon],
                          { size: 12 }
                        )
                      : null}
                  </span>
                )}
                <span className="text-[8px]  text-slate-400 uppercase">
                  Step {i + 1}
                </span>
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
                <span className="text-[8px] font-bold text-slate-400 uppercase">
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
                  className="text-[10px] bg-slate-50 border border-slate-200 rounded p-1"
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
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-brand-blue-primary hover:text-brand-blue-primary transition-all flex items-center justify-center gap-2 text-[10px]  uppercase"
        >
          <Plus className="w-4 h-4" /> Add Next Step
        </button>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl">
        <label className="text-[10px]  uppercase text-slate-400 tracking-widest mb-3 block">
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
