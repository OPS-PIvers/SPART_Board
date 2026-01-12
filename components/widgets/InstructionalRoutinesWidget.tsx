import React, { useMemo } from 'react';
import { useDashboard } from '@/context/useDashboard';
import { WidgetData, InstructionalRoutinesConfig } from '@/types';
import { ROUTINES, InstructionalRoutine } from '@/config/instructionalRoutines';
import * as Icons from 'lucide-react';
import { ChevronLeft, Info, Star } from 'lucide-react';

export const InstructionalRoutinesWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, gradeFilter } = useDashboard();
  const config = widget.config as InstructionalRoutinesConfig;
  const { selectedRoutineId, customSteps, favorites = [] } = config;

  const selectedRoutine = ROUTINES.find((r) => r.id === selectedRoutineId);

  const displayedRoutines = useMemo(() => {
    const filtered = ROUTINES.filter(
      (r) => gradeFilter === 'all' || r.gradeLevels.includes(gradeFilter as any)
    );
    return filtered.sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [gradeFilter, favorites]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const next = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : [...favorites, id];
    updateWidget(widget.id, { config: { ...config, favorites: next } });
  };

  const selectRoutine = (r: InstructionalRoutine) => {
    updateWidget(widget.id, {
      config: { ...config, selectedRoutineId: r.id, customSteps: [...r.steps] },
    });
  };

  const updateStep = (idx: number, val: string) => {
    const nextSteps = [...(customSteps || [])];
    nextSteps[idx] = val;
    updateWidget(widget.id, { config: { ...config, customSteps: nextSteps } });
  };

  if (!selectedRoutineId || !selectedRoutine) {
    return (
      <div className="flex flex-col h-full bg-white p-4">
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
          Library ({gradeFilter.toUpperCase()})
        </div>
        <div className="grid grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-1">
          {displayedRoutines.map((r) => {
            const Icon = (Icons as any)[r.icon] || Icons.HelpCircle;
            const isFav = favorites.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => selectRoutine(r)}
                className="relative p-3 border-2 border-slate-50 rounded-xl hover:border-indigo-500 text-left transition-all group bg-white shadow-sm hover:shadow-md"
              >
                <div
                  onClick={(e) => toggleFavorite(e, r.id)}
                  className="absolute top-2 right-2 p-1 rounded-md hover:bg-slate-100 transition-colors z-10"
                >
                  <Star
                    className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                  />
                </div>
                <Icon className="w-5 h-5 text-red-500 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-[11px] font-bold text-slate-800 leading-tight pr-4">
                  {r.name}
                </div>
                <div className="text-[8px] font-black text-slate-400 mt-1 uppercase">
                  {r.grades}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const RoutineIcon = (Icons as any)[selectedRoutine.icon] || Icons.HelpCircle;

  return (
    <div className="flex flex-col h-full bg-white p-5 animate-in fade-in zoom-in-95 duration-200">
      <button
        onClick={() =>
          updateWidget(widget.id, {
            config: { ...config, selectedRoutineId: null },
          })
        }
        className="flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-indigo-600 uppercase mb-4 transition-colors"
      >
        <ChevronLeft className="w-3 h-3" /> Change Routine
      </button>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">
            {selectedRoutine.name}
          </h2>
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
            {selectedRoutine.grades} Routine
          </span>
        </div>
        <div className="p-3 bg-red-50 text-red-600 rounded-2xl shadow-sm">
          <RoutineIcon className="w-8 h-8" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
          Steps for Students
        </h3>
        <ul className="space-y-4">
          {(customSteps || []).map((step, i) => (
            <li key={i} className="flex gap-3 group">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                {i + 1}
              </span>
              <textarea
                value={step}
                onChange={(e) => updateStep(i, e.target.value)}
                rows={2}
                className="text-sm font-bold text-slate-700 w-full bg-transparent border-none focus:ring-0 p-0 leading-snug resize-none focus:bg-yellow-50 transition-colors rounded"
              />
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2 shrink-0">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-blue-800 leading-relaxed font-bold uppercase tracking-tight">
          Teacher: Click on steps to edit them for your class.
        </p>
      </div>
    </div>
  );
};
