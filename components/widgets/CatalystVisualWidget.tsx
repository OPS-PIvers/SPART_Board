import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, CatalystVisualConfig } from '../../types';
import { CATALYST_ROUTINES } from '../../config/catalystRoutines';
import * as Icons from 'lucide-react';
import { RotateCcw } from 'lucide-react';

export const CatalystVisualWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as CatalystVisualConfig;
  const routine = CATALYST_ROUTINES.find((r) => r.id === config.routineId);

  if (!routine)
    return (
      <div className="p-4 text-center text-red-500 font-bold">
        Routine not found
      </div>
    );

  const RoutineIcon =
    (Icons as unknown as Record<string, React.ElementType>)[routine.icon] ??
    Icons.Zap;

  return (
    <div className="flex flex-col h-full bg-white rounded-[3rem] overflow-hidden shadow-2xl border-[12px] border-slate-50 relative group">
      {/* Background Accent */}
      <div className={`absolute inset-0 bg-blue-50 opacity-30`} />

      <div className="relative flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
        <div
          className={`p-10 rounded-[2.5rem] bg-blue-100 text-blue-600 shadow-inner ring-4 ring-white`}
        >
          <RoutineIcon size={120} strokeWidth={2.5} />
        </div>

        <div className="space-y-2">
          <h2
            className={`text-5xl font-black text-blue-700 uppercase tracking-tighter`}
          >
            {routine.title}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
            <span className="text-slate-400 font-black uppercase text-sm tracking-widest">
              Active Routine
            </span>
            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
          </div>
        </div>
      </div>

      {/* Floating Reset Button */}
      <button
        onClick={() =>
          updateWidget(widget.id, { config: { ...config, stepIndex: 0 } })
        }
        className="absolute top-6 right-6 p-3 bg-white border border-slate-100 rounded-2xl text-slate-300 hover:text-blue-500 hover:shadow-lg transition-all opacity-0 group-hover:opacity-100"
        title="Reset routine"
      >
        <RotateCcw size={24} />
      </button>
    </div>
  );
};

export const CatalystVisualSettings: React.FC<{ widget: WidgetData }> = ({
  widget: _widget,
}) => {
  return (
    <div className="p-4 text-center">
      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
        Visual Anchor Mode
      </p>
    </div>
  );
};
