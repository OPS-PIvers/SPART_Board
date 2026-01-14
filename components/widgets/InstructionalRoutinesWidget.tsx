import React, { useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import {
  WidgetData,
  InstructionalRoutinesConfig,
  RoutineStep,
} from '../../types';
import {
  ROUTINES,
  InstructionalRoutine,
} from '../../config/instructionalRoutines';
import * as Icons from 'lucide-react';
import { Star, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- FRONT VIEW (STUDENT FOCUS) ---
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
    const initialSteps: RoutineStep[] = r.defaultSteps.map((text) => ({
      id: uuidv4(),
      text,
    }));
    updateWidget(widget.id, {
      config: { ...config, selectedRoutineId: r.id, customSteps: initialSteps },
    });
  };

  if (!selectedRoutineId || !selectedRoutine) {
    return (
      <div className="flex flex-col h-full bg-brand-gray-lightest p-4">
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
          Library ({gradeFilter.toUpperCase()})
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
                <div className="text-[11px] font-black text-brand-gray-darkest uppercase leading-tight">
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
      <div className="flex items-start justify-between mb-6 shrink-0 border-b border-brand-blue-lighter pb-4">
        <div>
          <h2
            className="font-black text-brand-blue-primary leading-tight"
            style={{ fontSize: `${dynamicFontSize * 1.4}px` }}
          >
            {selectedRoutine.name}
          </h2>
          <span className="text-[10px] font-black text-brand-blue-light uppercase tracking-widest">
            {selectedRoutine.grades} Protocol
          </span>
        </div>
        <div className="p-4 bg-brand-blue-lighter text-brand-red-primary rounded-3xl shadow-sm">
          <RoutineIcon className="w-10 h-10" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="space-y-6">
          {customSteps.map((step, i) => (
            <li
              key={step.id}
              className="flex gap-4 items-start animate-in slide-in-from-left duration-300"
            >
              <span
                className="w-10 h-10 bg-brand-blue-primary text-white rounded-xl flex items-center justify-center font-black shrink-0 shadow-lg"
                style={{ fontSize: `${dynamicFontSize}px` }}
              >
                {i + 1}
              </span>
              <p
                className="font-bold text-brand-gray-darkest leading-relaxed pt-1"
                style={{ fontSize: `${dynamicFontSize}px` }}
              >
                {step.text}
              </p>
            </li>
          ))}
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
        className="w-full py-2.5 bg-brand-blue-lighter text-brand-blue-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#d5d9ec] transition-colors"
      >
        Switch Routine Template
      </button>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">
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
              className="flex-1 text-[11px] font-bold bg-transparent border-none focus:ring-0 p-0 leading-tight resize-none text-slate-800"
            />
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
                customSteps: [...customSteps, { id: uuidv4(), text: '' }],
              },
            })
          }
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-brand-blue-primary hover:text-brand-blue-primary transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase"
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
          className="w-full accent-brand-blue-primary"
        />
      </div>
    </div>
  );
};
