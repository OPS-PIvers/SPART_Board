import React, { useMemo } from 'react';
import { useDashboard } from '@/context/useDashboard';
import { WidgetData, InstructionalRoutinesConfig } from '@/types';
import { ROUTINES } from '@/config/instructionalRoutines';
import * as Icons from 'lucide-react';
import { Star, Trash2, Plus, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- FRONT VIEW ---
export const InstructionalRoutinesWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, gradeFilter } = useDashboard();
  const config = widget.config as InstructionalRoutinesConfig;
  const {
    selectedRoutineId,
    customSteps = [],
    favorites = [],
    scaleMultiplier = 1,
  } = config;

  const selectedRoutine = ROUTINES.find((r) => r.id === selectedRoutineId);

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

  if (!selectedRoutineId || !selectedRoutine) {
    return (
      <div className="flex flex-col h-full bg-[#f3f3f3] p-4">
        <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar">
          {displayedRoutines.map((r) => {
            const Icon =
              (Icons as unknown as Record<string, React.ElementType>)[r.icon] ??
              Icons.HelpCircle;
            const isFav = favorites.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() =>
                  updateWidget(widget.id, {
                    config: {
                      ...config,
                      selectedRoutineId: r.id,
                      customSteps: [...r.defaultSteps],
                    },
                  })
                }
                className="relative p-4 border-2 border-white rounded-2xl bg-white shadow-sm hover:border-[#2d3f89] transition-all text-left group"
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
                  className={`absolute top-2 right-2 w-4 h-4 ${isFav ? 'fill-[#4356a0] text-[#4356a0]' : 'text-slate-200 hover:text-slate-400'}`}
                />
                <Icon className="w-8 h-8 text-[#ad2122] mb-2" />
                <div className="text-[11px] font-black text-[#1a1a1a] uppercase leading-tight">
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
    <div className="flex flex-col h-full bg-white p-6 animate-in fade-in duration-200 overflow-hidden">
      <div className="flex items-start justify-between mb-6 shrink-0 border-b border-[#eaecf5] pb-4">
        <div>
          <h2
            className="font-black text-[#2d3f89] leading-tight"
            style={{ fontSize: `${dynamicFontSize * 1.4}px` }}
          >
            {selectedRoutine.name}
          </h2>
          <span className="text-[10px] font-black text-[#4356a0] uppercase tracking-widest">
            {selectedRoutine.grades} Protocol
          </span>
        </div>
        <div className="p-4 bg-[#eaecf5] text-[#ad2122] rounded-3xl shadow-sm">
          <RoutineIcon className="w-10 h-10" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="space-y-6">
          {customSteps.map((step, i) => (
            <li
              key={i}
              className="flex gap-4 items-start animate-in slide-in-from-left duration-300"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <span
                className="w-10 h-10 bg-[#2d3f89] text-white rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg"
                style={{ fontSize: `${dynamicFontSize}px` }}
              >
                {i + 1}
              </span>
              <p
                className="font-bold text-[#1a1a1a] leading-relaxed pt-1"
                style={{ fontSize: `${dynamicFontSize}px` }}
              >
                {step}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// --- SETTINGS VIEW (The Editor) ---
export const InstructionalRoutinesSettings: React.FC<{
  widget: WidgetData;
}> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as InstructionalRoutinesConfig;
  const { customSteps = [], scaleMultiplier = 1 } = config;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = customSteps.indexOf(active.id as string);
      const newIndex = customSteps.indexOf(over.id as string);
      updateWidget(widget.id, {
        config: {
          ...config,
          customSteps: arrayMove(customSteps, oldIndex, newIndex),
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() =>
          updateWidget(widget.id, {
            config: { ...config, selectedRoutineId: null },
          })
        }
        className="w-full py-2.5 bg-[#eaecf5] text-[#2d3f89] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d5d9ec] transition-colors"
      >
        Switch Routine Template
      </button>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">
          Step Editor
        </label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={customSteps}
            strategy={verticalListSortingStrategy}
          >
            {customSteps.map((step, i) => (
              <SortableStepItem
                key={step}
                id={step}
                step={step}
                onUpdate={(val: string) => {
                  const next = [...customSteps];
                  next[i] = val;
                  updateWidget(widget.id, {
                    config: { ...config, customSteps: next },
                  });
                }}
                onDelete={() => {
                  updateWidget(widget.id, {
                    config: {
                      ...config,
                      customSteps: customSteps.filter((_, idx) => idx !== i),
                    },
                  });
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: {
                ...config,
                customSteps: [
                  ...customSteps,
                  `New Step ${customSteps.length + 1}`,
                ],
              },
            })
          }
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-[#2d3f89] hover:text-[#2d3f89] transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase"
        >
          <Plus className="w-4 h-4" /> Add Next Step
        </button>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 block">
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
          className="w-full accent-[#2d3f89]"
        />
      </div>
    </div>
  );
};

interface SortableStepItemProps {
  id: string;
  step: string;
  onUpdate: (val: string) => void;
  onDelete: () => void;
}

const SortableStepItem = ({
  id,
  step,
  onUpdate,
  onDelete,
}: SortableStepItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 group shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-[#2d3f89]"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <textarea
        value={step}
        onChange={(e) => onUpdate(e.target.value)}
        rows={2}
        className="flex-1 text-[11px] font-bold bg-transparent border-none focus:ring-0 p-0 leading-tight resize-none text-slate-800"
      />
      <button
        onClick={onDelete}
        className="p-2 text-red-400 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
