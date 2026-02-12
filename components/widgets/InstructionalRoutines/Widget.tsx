import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { useInstructionalRoutines } from '../../../hooks/useInstructionalRoutines';
import {
  WidgetData,
  InstructionalRoutinesConfig,
  RoutineStep,
  WidgetType,
  WidgetConfig,
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
  ArrowDown,
  RefreshCw,
  Info,
} from 'lucide-react';
import { BLOOMS_DATA } from '../../../config/bloomsData';
import { LibraryManager } from './LibraryManager';
import {
  getRoutineColorClasses,
  getRoutineStepBorderClass,
} from './colorHelpers';

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

interface RoutineStepItemProps {
  step: RoutineStep;
  index: number;
  structure: string;
  onDragStart: (
    e: React.DragEvent,
    icon: string | undefined,
    color: string,
    label?: string,
    stickerUrl?: string
  ) => void;
  onStepClick: (
    icon: string | undefined,
    color: string,
    label?: string,
    stickerUrl?: string
  ) => void;
  onAddWidget: (type: WidgetType, config?: WidgetConfig) => void;
}

const RoutineStepItem: React.FC<RoutineStepItemProps> = ({
  step,
  index,
  structure,
  onDragStart,
  onStepClick,
  onAddWidget,
}) => {
  const StepIcon = step.icon
    ? (Icons as unknown as Record<string, React.ElementType>)[step.icon]
    : null;

  const isVisualCue = structure === 'visual-cue';

  return (
    <div
      className={`
        flex animate-in slide-in-from-left duration-300 group
        ${isVisualCue ? 'flex-col items-center bg-slate-50 rounded-2xl border border-slate-100 shadow-sm text-center' : 'items-start'}
      `}
      style={{
        gap: '1em',
        ...(isVisualCue ? { padding: '1em' } : {}),
      }}
    >
      {structure === 'linear' && (
        <span
          className="bg-brand-blue-primary text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{
            width: '2.5em',
            height: '2.5em',
            fontSize: '0.8em',
          }}
        >
          {index + 1}
        </span>
      )}
      {structure === 'cycle' && (
        <span
          className="bg-brand-blue-primary text-white rounded-full flex items-center justify-center shrink-0 shadow-lg"
          style={{
            width: '2.5em',
            height: '2.5em',
            fontSize: '0.8em',
          }}
        >
          {index + 1}
        </span>
      )}

      <div
        className={`flex-1 flex flex-col ${isVisualCue ? 'w-full' : ''}`}
        style={{ gap: '0.5em' }}
      >
        <div
          className={`flex ${isVisualCue ? 'flex-col items-center' : 'items-start justify-between'}`}
          style={{ gap: '1em' }}
        >
          {step.imageUrl && (
            <div
              className={`${isVisualCue ? 'w-full aspect-square' : 'shrink-0'}`}
              style={isVisualCue ? { marginBottom: '0.5em' } : { width: '6em' }}
            >
              <img
                src={step.imageUrl}
                alt="Step Illustration"
                className="w-full h-full object-cover rounded-xl shadow-sm border border-slate-200"
              />
            </div>
          )}

          <p
            className="font-bold text-brand-gray-darkest leading-relaxed"
            style={{ fontSize: '1em', paddingTop: '0.25em' }}
          >
            {step.text}
          </p>

          {(step.stickerUrl ?? (StepIcon && step.icon)) && (
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
                onStepClick(
                  step.icon as string,
                  step.color ?? 'blue',
                  step.label,
                  step.stickerUrl
                )
              }
              className={`
                rounded-xl bg-white border-2 ${getRoutineStepBorderClass(step.color ?? 'blue')} shadow-sm cursor-grab active:cursor-grabbing hover:scale-110 hover:-rotate-3 transition-all shrink-0 flex flex-col items-center group/sticker
                ${isVisualCue ? 'mt-3 w-max' : ''}
              `}
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
                    alt={step.label ?? 'Sticker'}
                    className="object-contain"
                    style={{
                      width: '1.5em',
                      height: '1.5em',
                    }}
                  />
                </div>
              ) : (
                <div
                  className={`rounded-lg ${getRoutineColorClasses(step.color ?? 'blue').bg} ${getRoutineColorClasses(step.color ?? 'blue').text}`}
                  style={{ padding: '0.4em' }}
                >
                  {StepIcon && (
                    <StepIcon
                      style={{ width: '1.5em', height: '1.5em' }}
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
                  style={{ width: '0.5em', height: '0.5em' }}
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
              onAddWidget(
                step.attachedWidget?.type as WidgetType,
                step.attachedWidget?.config
              )
            }
            className={`self-start bg-brand-blue-light/10 text-brand-blue-primary rounded-lg font-black uppercase tracking-wider flex items-center hover:bg-brand-blue-light/20 transition-colors ${isVisualCue ? 'self-center mx-auto' : ''}`}
            style={{
              padding: '0.5em 1em',
              gap: '0.5em',
              fontSize: '0.8em',
            }}
          >
            <Rocket style={{ width: '1em', height: '1.5em' }} />
            Launch {step.attachedWidget.label}
          </button>
        )}
      </div>
    </div>
  );
};

import { WidgetLayout } from '../WidgetLayout';

// ... (RoutineStepItem stays the same)

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

  // Mathematical Scaling (Preferred values for CSS Container Queries)
  const scalingStyles = useMemo(() => {
    if (!selectedRoutineId) {
      // Library view scaling
      return {
        fontSize: `calc(clamp(10px, 4cqmin, 16px) * ${scaleMultiplier})`,
      };
    }

    // Routine view scaling: Estimate total vertical "ems" to fit without scrolling
    // Padding (2em) + Header area (~3.5em)
    let totalVerticalEms = 5.5;

    // Bloom's specific buttons (~3em)
    if (selectedRoutineId === 'blooms-analysis') {
      totalVerticalEms += 3;
    }

    // Steps: each step is roughly 3em including its gap (1em)
    const stepCount = customSteps.length || 1;
    totalVerticalEms += stepCount * 3;

    const vScale = (100 / totalVerticalEms).toFixed(2);
    const hScale = (100 / 20).toFixed(2); // Estimate horizontal capacity (20 chars)

    return {
      fontSize: `calc(min(18px, ${Math.min(parseFloat(vScale), parseFloat(hScale))}cqmin) * ${scaleMultiplier})`,
      '--dynamic-font-size': `calc(min(18px, ${Math.min(parseFloat(vScale), parseFloat(hScale))}cqmin) * ${scaleMultiplier})`,
    } as React.CSSProperties;
  }, [selectedRoutineId, customSteps.length, scaleMultiplier]);

  const displayedRoutines = useMemo(() => {
    const filtered = ROUTINES.filter((r) => {
      if (gradeFilter === 'all') return true;
      return r.gradeLevels?.includes(gradeFilter);
    });
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
      stickerUrl: step.stickerUrl,
      imageUrl: step.imageUrl,
    }));
    updateWidget(widget.id, {
      config: {
        ...config,
        selectedRoutineId: r.id,
        customSteps: initialSteps,
        structure: r.structure,
        audience: r.audience,
      },
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
      <WidgetLayout
        padding="p-0"
        header={
          <div
            className="flex justify-between items-center border-b border-slate-100 bg-slate-50/50 shrink-0"
            style={{ padding: 'min(12px, 2.5cqmin)' }}
          >
            <div
              className="font-black uppercase text-slate-400 tracking-widest"
              style={{ fontSize: 'min(10px, 3cqmin)' }}
            >
              Library ({gradeFilter.toUpperCase()})
            </div>
            <div
              className="flex items-center"
              style={{ gap: 'min(12px, 3cqmin)' }}
            >
              {isAdmin && (
                <button
                  onClick={() => setIsManagingLibrary(true)}
                  className="flex items-center font-black uppercase text-blue-600 hover:text-blue-700 transition-colors"
                  style={{
                    gap: 'min(4px, 1cqmin)',
                    fontSize: 'min(10px, 3cqmin)',
                  }}
                  title="Manage global routine library"
                >
                  <Settings
                    style={{
                      width: 'min(12px, 3cqmin)',
                      height: 'min(12px, 3cqmin)',
                    }}
                  />
                  Manage
                </button>
              )}
              <button
                onClick={clearAllStickers}
                className="flex items-center font-black uppercase text-red-500 hover:text-red-600 transition-colors"
                style={{
                  gap: 'min(4px, 1cqmin)',
                  fontSize: 'min(10px, 3cqmin)',
                }}
                title="Remove all stickers from board"
              >
                <Trash2
                  style={{
                    width: 'min(12px, 3cqmin)',
                    height: 'min(12px, 3cqmin)',
                  }}
                />
                Clear Board
              </button>
            </div>
          </div>
        }
        content={
          <div
            className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-y-auto custom-scrollbar"
            style={{
              ...scalingStyles,
              gap: 'min(12px, 2.5cqmin)',
              padding: 'min(12px, 2.5cqmin)',
              paddingBottom: 'min(16px, 3.5cqmin)',
            }}
          >
            {displayedRoutines.map((r) => {
              const Icon =
                (Icons as unknown as Record<string, React.ElementType>)[
                  r.icon
                ] ?? Icons.HelpCircle;
              const isFav = favorites.includes(r.id);
              const colors =
                ROUTINE_COLORS[r.color || 'blue'] || ROUTINE_COLORS.blue;

              return (
                <div key={r.id} className="relative group/card h-full">
                  <button
                    onClick={() => selectRoutine(r)}
                    className={`w-full h-full relative border rounded-2xl bg-white shadow-sm transition-all duration-300 flex flex-col items-center text-center group-hover/card:shadow-md group-hover/card:-translate-y-1 ${colors.border} ${colors.hoverBorder}`}
                    style={{ padding: 'min(16px, 3.5cqmin)' }}
                  >
                    <div
                      className={`rounded-full transition-transform group-hover/card:scale-110 duration-300 ${colors.bg} ${colors.text}`}
                      style={{
                        padding: 'min(16px, 3.5cqmin)',
                        marginBottom: 'min(12px, 2.5cqmin)',
                      }}
                    >
                      <Icon
                        style={{
                          width: 'min(48px, 12cqmin)',
                          height: 'min(48px, 12cqmin)',
                        }}
                        strokeWidth={2}
                      />
                    </div>
                    <div
                      className="flex flex-col w-full"
                      style={{ gap: 'min(6px, 1.5cqmin)' }}
                    >
                      <div
                        className="font-black text-slate-800 uppercase leading-tight tracking-wide"
                        style={{ fontSize: 'min(16px, 4cqmin)' }}
                      >
                        {r.name}
                      </div>
                      <div
                        className="font-bold text-slate-400 uppercase tracking-wider"
                        style={{ fontSize: 'min(12px, 3cqmin)' }}
                      >
                        {r.grades}
                      </div>
                    </div>
                  </button>
                  <div
                    className="absolute flex flex-col opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
                    style={{
                      top: 'min(8px, 2cqmin)',
                      right: 'min(8px, 2cqmin)',
                      gap: 'min(6px, 1.5cqmin)',
                    }}
                  >
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
                      className={`rounded-full bg-white shadow-md border border-slate-100 hover:scale-110 transition-transform ${
                        isFav
                          ? 'text-amber-400'
                          : 'text-slate-300 hover:text-slate-400'
                      }`}
                      style={{ padding: 'min(6px, 1.5cqmin)' }}
                    >
                      <Star
                        style={{
                          width: 'min(12px, 3cqmin)',
                          height: 'min(12px, 3cqmin)',
                        }}
                        className={isFav ? 'fill-current' : ''}
                      />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRoutine(r);
                            setIsManagingLibrary(true);
                          }}
                          className="rounded-full bg-white shadow-md border border-slate-100 text-blue-400 hover:text-blue-600 hover:scale-110 transition-transform"
                          style={{ padding: 'min(6px, 1.5cqmin)' }}
                        >
                          <PlusCircle
                            style={{
                              width: 'min(12px, 3cqmin)',
                              height: 'min(12px, 3cqmin)',
                            }}
                          />
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
                          className="rounded-full bg-white shadow-md border border-slate-100 text-red-300 hover:text-red-500 hover:scale-110 transition-transform"
                          style={{ padding: 'min(6px, 1.5cqmin)' }}
                        >
                          <Trash2
                            style={{
                              width: 'min(12px, 3cqmin)',
                              height: 'min(12px, 3cqmin)',
                            }}
                          />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        }
      />
    );
  }

  const RoutineIcon =
    (Icons as unknown as Record<string, React.ElementType>)[
      selectedRoutine.icon
    ] ?? Icons.HelpCircle;

  const launchBloomsResource = (type: 'keyWords' | 'questionStarters') => {
    const title =
      type === 'keyWords' ? "Bloom's Key Words" : "Bloom's Sentence Starters";

    let content = `<h3 class="font-black mb-[0.5em] uppercase text-slate-800">${title}</h3>`;

    if (type === 'keyWords') {
      BLOOMS_DATA.keyWords.forEach((levelGroup) => {
        content += `<h4 class="font-extrabold mt-[1em] mb-[0.25em] text-brand-blue-primary text-[0.9em]">${levelGroup.level}</h4><ul class="pl-[1.2em] list-disc text-slate-600 text-[0.85em]">`;
        levelGroup.words.forEach((item) => {
          content += `<li>${item}</li>`;
        });
        content += `</ul>`;
      });
    } else {
      BLOOMS_DATA.questionStarters.forEach((levelGroup) => {
        content += `<h4 class="font-extrabold mt-[1em] mb-[0.25em] text-brand-blue-primary text-[0.9em]">${levelGroup.level}</h4><ul class="pl-[1.2em] list-disc text-slate-600 text-[0.85em]">`;
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

  const structure = config.structure ?? selectedRoutine.structure ?? 'linear';
  const audience = config.audience ?? selectedRoutine.audience ?? 'student';

  return (
    <WidgetLayout
      padding="p-0"
      header={
        <div className="flex flex-col shrink-0 border-b border-brand-blue-lighter bg-slate-50/30">
          <div
            className="flex items-center"
            style={{
              padding: '0.75em',
              gap: '0.75em',
              ...scalingStyles,
            }}
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
              <ArrowLeft
                style={{
                  width: '1.5em',
                  height: '1.5em',
                }}
                className="text-slate-600"
              />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center" style={{ gap: '0.5em' }}>
                <h2
                  className="text-brand-blue-primary leading-tight font-black truncate uppercase tracking-tight"
                  style={{ fontSize: '1.4em' }}
                >
                  {selectedRoutine.name}
                </h2>
                {audience === 'teacher' && (
                  <span
                    className="bg-amber-100 text-amber-700 rounded-full font-black uppercase tracking-tighter flex items-center shrink-0"
                    style={{
                      fontSize: '0.5em',
                      padding: '0.25em 1em',
                      gap: '0.5em',
                    }}
                  >
                    <Info style={{ width: '0.8em', height: '0.8em' }} /> Teacher
                    Focus
                  </span>
                )}
              </div>
              <span
                className="text-brand-blue-light uppercase tracking-widest block mt-[0.2em] font-bold"
                style={{ fontSize: '0.6em' }}
              >
                {selectedRoutine.grades} Protocol •{' '}
                {structure.replace('-', ' ')}
              </span>
            </div>
            <div className="flex items-center" style={{ gap: '0.5em' }}>
              <button
                onClick={clearAllStickers}
                className="bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center shadow-sm"
                style={{ padding: '0.6em' }}
                title="Clear all stickers from board"
              >
                <Trash2 style={{ width: '1.25em', height: '1.25em' }} />
              </button>
              <div
                className="bg-brand-blue-lighter text-brand-red-primary rounded-2xl shadow-sm flex items-center justify-center"
                style={{ padding: '0.8em' }}
              >
                <RoutineIcon style={{ width: '1.8em', height: '1.8em' }} />
              </div>
            </div>
          </div>

          {selectedRoutine.id === 'blooms-analysis' && (
            <div
              className="flex shrink-0"
              style={{
                paddingLeft: '0.75em',
                paddingRight: '0.75em',
                paddingBottom: '0.75em',
                gap: '0.75em',
                ...scalingStyles,
              }}
            >
              <button
                onClick={() => launchBloomsResource('keyWords')}
                className="flex-1 bg-brand-blue-lighter/50 text-brand-blue-primary rounded-xl font-black uppercase tracking-wider hover:bg-brand-blue-lighter transition-colors border border-brand-blue-lighter flex items-center justify-center shadow-sm"
                style={{ padding: '0.8em', gap: '0.5em', fontSize: '0.7em' }}
              >
                <Icons.Key style={{ width: '1.2em', height: '1.2em' }} /> Key
                Words
              </button>
              <button
                onClick={() => launchBloomsResource('questionStarters')}
                className="flex-1 bg-brand-blue-lighter/50 text-brand-blue-primary rounded-xl font-black uppercase tracking-wider hover:bg-brand-blue-lighter transition-colors border border-brand-blue-lighter flex items-center justify-center shadow-sm"
                style={{ padding: '0.8em', gap: '0.5em', fontSize: '0.7em' }}
              >
                <Icons.MessageSquare
                  style={{ width: '1.2em', height: '1.2em' }}
                />{' '}
                Starters
              </button>
            </div>
          )}
        </div>
      }
      content={
        <div
          className="flex-1 overflow-y-auto custom-scrollbar"
          style={{ padding: '1em', ...scalingStyles }}
        >
          <div
            className={`
              ${structure === 'visual-cue' ? 'grid grid-cols-2' : 'flex flex-col'}
            `}
            style={{ gap: structure === 'visual-cue' ? '0.75em' : '1em' }}
          >
            {customSteps.map((step, i) => {
              return (
                <React.Fragment key={step.id}>
                  <RoutineStepItem
                    step={step}
                    index={i}
                    structure={structure}
                    onDragStart={onDragStart}
                    onStepClick={handleStepClick}
                    onAddWidget={(type, config) => addWidget(type, { config })}
                  />
                  {structure === 'cycle' && i < customSteps.length - 1 && (
                    <div
                      className="flex justify-center text-slate-300"
                      style={{ marginTop: '-0.5em', marginBottom: '-0.5em' }}
                    >
                      <ArrowDown style={{ width: '1.5em', height: '1.5em' }} />
                    </div>
                  )}
                  {structure === 'cycle' && i === customSteps.length - 1 && (
                    <div
                      className="flex justify-center"
                      style={{ marginTop: '0.5em' }}
                    >
                      <div
                        className="flex flex-col items-center text-blue-500/50"
                        style={{ gap: '0.25em' }}
                      >
                        <RefreshCw
                          style={{ width: '1.5em', height: '1.5em' }}
                          className="animate-spin-slow"
                        />
                        <span
                          className="font-black uppercase tracking-widest"
                          style={{ fontSize: '0.6em' }}
                        >
                          Repeat
                        </span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      }
    />
  );
};
