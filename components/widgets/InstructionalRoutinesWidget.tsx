import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, InstructionalRoutinesConfig } from '../../types';
import {
  ROUTINES,
  InstructionalRoutine,
} from '../../config/instructionalRoutines';
import * as Icons from 'lucide-react';
import { ChevronLeft, Info } from 'lucide-react';

export const InstructionalRoutinesWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, gradeFilter } = useDashboard();
  const config = widget.config as InstructionalRoutinesConfig;
  const { selectedRoutineId, customSteps } = config;

  const selectedRoutine = ROUTINES.find((r) => r.id === selectedRoutineId);

  const filteredRoutines = ROUTINES.filter(
    (r) =>
      gradeFilter === 'all' || r.gradeLevels.includes(gradeFilter as GradeLevel)
  );

  const selectRoutine = (routine: InstructionalRoutine) => {
    updateWidget(widget.id, {
      config: {
        ...config,
        selectedRoutineId: routine.id,
        customSteps: [...routine.steps],
      },
    });
  };

  const updateStep = (index: number, value: string) => {
    const nextSteps = [...(customSteps ?? [])];
    nextSteps[index] = value;
    updateWidget(widget.id, { config: { ...config, customSteps: nextSteps } });
  };

  if (!selectedRoutineId || !selectedRoutine) {
    return (
      <div className="flex flex-col h-full bg-white p-4">
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">
          Select a Routine ({gradeFilter.toUpperCase()})
        </div>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-1">
          {filteredRoutines.map((r) => {
            const IconComp =
              Icons[r.icon as keyof typeof Icons] ?? Icons.HelpCircle;
            return (
              <button
                key={r.id}
                onClick={() => selectRoutine(r)}
                className="p-3 border-2 border-slate-50 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/30 transition-all text-left group"
              >
                <IconComp className="w-5 h-5 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-[11px] font-bold text-slate-800 leading-tight">
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

  const RoutineIcon =
    Icons[selectedRoutine.icon as keyof typeof Icons] ?? Icons.HelpCircle;

  return (
    <div className="flex flex-col h-full bg-white p-5">
      <button
        onClick={() =>
          updateWidget(widget.id, {
            config: { ...config, selectedRoutineId: null },
          })
        }
        className="flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-widest mb-4"
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
        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
          <RoutineIcon className="w-8 h-8" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
          Student Steps
        </h3>
        <ul className="space-y-4">
          {(customSteps ?? selectedRoutine.steps).map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm">
                {i + 1}
              </span>
              <textarea
                value={step}
                onChange={(e) => updateStep(i, e.target.value)}
                rows={2}
                className="text-sm font-bold text-slate-700 w-full bg-transparent border-none focus:ring-0 resize-none p-0 leading-snug"
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2 shrink-0">
        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[9px] text-blue-800 leading-relaxed font-bold uppercase tracking-tight">
          Teacher: Click on steps above to customize for your students.
        </p>
      </div>
    </div>
  );
};
