import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { useInstructionalRoutines } from '../../../hooks/useInstructionalRoutines';
import {
  WidgetData,
  InstructionalRoutinesConfig,
  RoutineStep,
  WidgetType,
} from '../../../types';
import {
  ROUTINES as DEFAULT_ROUTINES,
  InstructionalRoutine,
} from '../../../config/instructionalRoutines';
import * as Icons from 'lucide-react';
import {
  Star,
  Trash2,
  ArrowLeft,
  Grab,
  Rocket,
  Settings,
  PlusCircle,
} from 'lucide-react';
import { BLOOMS_DATA } from '../../../config/bloomsData';
import { LibraryManager } from './LibraryManager';

// Color mapping for routines
const ROUTINE_COLORS: Record<
  string,
  { bg: string; text: string; border: string; hoverBorder: string }
> = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    hoverBorder: 'hover:border-blue-300',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
    hoverBorder: 'hover:border-indigo-300',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    border: 'border-violet-100',
    hoverBorder: 'hover:border-violet-300',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-100',
    hoverBorder: 'hover:border-purple-300',
  },
  fuchsia: {
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-600',
    border: 'border-fuchsia-100',
    hoverBorder: 'hover:border-fuchsia-300',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    border: 'border-pink-100',
    hoverBorder: 'hover:border-pink-300',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-100',
    hoverBorder: 'hover:border-rose-300',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-100',
    hoverBorder: 'hover:border-red-300',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-100',
    hoverBorder: 'hover:border-orange-300',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-100',
    hoverBorder: 'hover:border-amber-300',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-100',
    hoverBorder: 'hover:border-yellow-300',
  },
  lime: {
    bg: 'bg-lime-50',
    text: 'text-lime-600',
    border: 'border-lime-100',
    hoverBorder: 'hover:border-lime-300',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-100',
    hoverBorder: 'hover:border-green-300',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-100',
    hoverBorder: 'hover:border-emerald-300',
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-100',
    hoverBorder: 'hover:border-teal-300',
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    border: 'border-cyan-100',
    hoverBorder: 'hover:border-cyan-300',
  },
  sky: {
    bg: 'bg-sky-50',
    text: 'text-sky-600',
    border: 'border-sky-100',
    hoverBorder: 'hover:border-sky-300',
  },
  slate: {
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-100',
    hoverBorder: 'hover:border-slate-300',
  },
  zinc: {
    bg: 'bg-zinc-50',
    text: 'text-zinc-600',
    border: 'border-zinc-100',
    hoverBorder: 'hover:border-zinc-300',
  },
  stone: {
    bg: 'bg-stone-50',
    text: 'text-stone-600',
    border: 'border-stone-100',
    hoverBorder: 'hover:border-stone-300',
  },
  neutral: {
    bg: 'bg-neutral-50',
    text: 'text-neutral-600',
    border: 'border-neutral-100',
    hoverBorder: 'hover:border-neutral-300',
  },
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

  const handleStepClick = (
    icon: string | undefined,
    color: string,
    label?: string,
    stickerUrl?: string
  ) => {
    const w = 150;
    const h = 150;
    addWidget('sticker', {
      x: 100,
      y: 100,
      w,
      h,
      config: {
        icon: stickerUrl ? undefined : icon,
        url: stickerUrl,
        color,
        label,
        rotation: 0,
      },
    });
  };

  const selectedRoutine = ROUTINES.find((r) => r.id === selectedRoutineId);

  // Mathematical Scaling
  const dynamicFontSize = useMemo(() => {
    if (!selectedRoutineId) {
      // Library view scaling
      const baseSize = Math.min(widget.w / 24, widget.h / 24);
      return Math.max(8, baseSize * scaleMultiplier);
    }

    // Routine view scaling: Estimate total vertical "ems" to fit without scrolling
    // Padding (3em) + Header area (~4.5em)
    let totalVerticalEms = 7.5;

    // Bloom's specific buttons (~4em)
    if (selectedRoutineId === 'blooms-analysis') {
      totalVerticalEms += 4;
    }

    // Steps: each step is roughly 3.5em including its gap (1.5em)
    // We use a slightly more conservative estimate to ensure it fits
    const stepCount = customSteps.length || 1;
    totalVerticalEms += stepCount * 3.6;

    const heightFactor = widget.h / totalVerticalEms;
    const widthFactor = widget.w / 22; // Estimate horizontal capacity

    const baseSize = Math.min(widthFactor, heightFactor);
    return Math.max(8, baseSize * scaleMultiplier);
  }, [
    widget.w,
    widget.h,
    scaleMultiplier,
    selectedRoutineId,
    customSteps.length,
  ]);

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
    icon: string | undefined,
    color: string,
    label?: string,
    stickerUrl?: string
  ) => {
    e.dataTransfer.setData(
      'application/spart-sticker',
      JSON.stringify({ icon, color, label, url: stickerUrl })
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
      color: 'blue',
      steps: [{ text: '', icon: 'Zap', color: 'blue', label: 'Step' }],
    };

    const handleSave = async () => {
      if (!routine.name) return;
      await saveRoutine(routine);
      setIsManagingLibrary(false);
      setEditingRoutine(null);
    };

    return (
      <LibraryManager
        routine={routine}
        onChange={setEditingRoutine}
        onSave={handleSave}
        onCancel={() => {
          setIsManagingLibrary(false);
          setEditingRoutine(null);
        }}
      />
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
            const colors =
              ROUTINE_COLORS[r.color || 'blue'] || ROUTINE_COLORS.blue;

            return (
              <div key={r.id} className="relative group/card h-full">
                <button
                  onClick={() => selectRoutine(r)}
                  className={`w-full h-full relative p-4 border rounded-xl bg-white shadow-sm transition-all duration-300 flex flex-col items-center text-center group-hover/card:shadow-md group-hover/card:-translate-y-1 ${colors.border} ${colors.hoverBorder}`}
                >
                  <div
                    className={`p-3 rounded-full mb-3 transition-transform group-hover/card:scale-110 duration-300 ${colors.bg} ${colors.text}`}
                  >
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col gap-1 w-full">
                    <div className="text-[11px] font-black text-slate-800 uppercase leading-tight tracking-wide">
                      {r.name}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      {r.grades}
                    </div>
                  </div>
                </button>
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
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
                    className={`p-1.5 rounded-full bg-white shadow-md border border-slate-100 hover:scale-110 transition-transform ${
                      isFav
                        ? 'text-amber-400'
                        : 'text-slate-300 hover:text-slate-400'
                    }`}
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
                        className="p-1.5 rounded-full bg-white shadow-md border border-slate-100 text-blue-400 hover:text-blue-600 hover:scale-110 transition-transform"
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
                        className="p-1.5 rounded-full bg-white shadow-md border border-slate-100 text-red-300 hover:text-red-500 hover:scale-110 transition-transform"
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

                    {(step.stickerUrl || (StepIcon && step.icon)) && (
                      <div
                        draggable
                        onDragStart={(e) =>
                          onDragStart(
                            e,
                            step.icon as string,
                            step.color ?? 'blue',
                            step.label,
                            step.stickerUrl
                          )
                        }
                        onClick={() =>
                          handleStepClick(
                            step.icon as string,
                            step.color ?? 'blue',
                            step.label,
                            step.stickerUrl
                          )
                        }
                        className={`rounded-xl bg-white border-2 border-${step.color ?? 'blue'}-100 shadow-sm cursor-grab active:cursor-grabbing hover:scale-110 hover:-rotate-3 transition-all shrink-0 flex flex-col items-center group/sticker`}
                        style={{ padding: '0.5em', gap: '0.25em' }}
                        title="Drag or Click to add to whiteboard"
                      >
                        {step.stickerUrl ? (
                          <div
                            className="rounded-lg bg-transparent"
                            style={{ padding: '0.4em' }}
                          >
                            <img
                              src={step.stickerUrl}
                              alt={step.label || 'Sticker'}
                              className="object-contain"
                              style={{
                                width: dynamicFontSize * 1.5,
                                height: dynamicFontSize * 1.5,
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className={`rounded-lg bg-${step.color ?? 'blue'}-50 text-${step.color ?? 'blue'}-600`}
                            style={{ padding: '0.4em' }}
                          >
                            {StepIcon && (
                              <StepIcon
                                size={dynamicFontSize * 1.5}
                                strokeWidth={2.5}
                              />
                            )}
                          </div>
                        )}

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
