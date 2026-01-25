import React, { useMemo } from 'react';
import * as Icons from 'lucide-react';
import { Settings, Trash2, Star, PlusCircle } from 'lucide-react';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { useInstructionalRoutines } from '../../../hooks/useInstructionalRoutines';
import { InstructionalRoutine } from '../../../config/instructionalRoutines';
import {
  WidgetData,
  InstructionalRoutinesConfig,
  RoutineStep,
} from '../../../types';

interface LibraryViewProps {
  widget: WidgetData;
  routines: InstructionalRoutine[];
  onManage: (routine?: InstructionalRoutine) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  widget,
  routines,
  onManage,
}) => {
  const { updateWidget, gradeFilter, clearAllStickers } = useDashboard();
  const { isAdmin } = useAuth();
  const { deleteRoutine } = useInstructionalRoutines();
  const config = widget.config as InstructionalRoutinesConfig;
  const { favorites = [] } = config;

  const displayedRoutines = useMemo(() => {
    const filtered = routines.filter(
      (r) => gradeFilter === 'all' || r.gradeLevels.includes(gradeFilter)
    );
    return filtered.sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [gradeFilter, favorites, routines]);

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

  return (
    <div className="flex flex-col h-full bg-brand-gray-lightest p-4 overflow-hidden">
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="text-xxs font-black uppercase text-slate-400 tracking-widest">
          Library ({gradeFilter.toUpperCase()})
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => onManage()}
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
                        onManage(r);
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
};
