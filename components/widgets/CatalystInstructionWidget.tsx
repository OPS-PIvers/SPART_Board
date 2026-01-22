import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, CatalystInstructionConfig } from '../../types';
import { CATALYST_ACTIONS } from '../../config/catalystRoutines';
import * as Icons from 'lucide-react';
import { CheckCircle2, Circle } from 'lucide-react';

export const CatalystInstructionWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as CatalystInstructionConfig;
  const action = CATALYST_ACTIONS.find((a) => a.id === config.routineId);

  if (!action)
    return (
      <div className="p-4 text-center text-red-500 font-bold">
        Routine not found
      </div>
    );

  const RoutineIcon =
    (Icons as unknown as Record<string, React.ElementType>)[action.icon] ??
    Icons.Zap;

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      <div className="p-4 bg-slate-800/50 flex items-center gap-3 border-b border-slate-700">
        <div
          className={`p-1.5 rounded-lg bg-${action.color}-500 text-white shadow-lg`}
        >
          <RoutineIcon size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest leading-none">
            Teacher Guide
          </span>
          <span className="text-xs font-black text-white">{action.label}</span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar bg-gradient-to-b from-slate-900 to-slate-950">
        {action.teacherInstructions.map((step, index) => {
          const isDone = index < config.stepIndex;
          const isCurrent = index === config.stepIndex;

          return (
            <button
              key={index}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, stepIndex: index + 1 },
                })
              }
              className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left group ${
                isCurrent
                  ? 'bg-blue-600/20 border-blue-500/50 text-white ring-1 ring-blue-500/20'
                  : isDone
                    ? 'bg-slate-800/30 border-slate-700/50 text-slate-500'
                    : 'bg-slate-800/10 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <Circle
                    size={16}
                    className={
                      isCurrent
                        ? 'text-blue-400 animate-pulse'
                        : 'text-slate-600'
                    }
                  />
                )}
              </div>
              <span
                className={`text-[11px] font-bold leading-relaxed ${isCurrent ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
              >
                {step}
              </span>
            </button>
          );
        })}
      </div>

      {config.stepIndex >= action.teacherInstructions.length && (
        <div className="p-4 bg-emerald-500/10 border-t border-emerald-500/20 animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={() =>
              updateWidget(widget.id, { config: { ...config, stepIndex: 0 } })
            }
            className="w-full py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-700 shadow-lg shadow-emerald-900/20"
          >
            Reset Routine
          </button>
        </div>
      )}
    </div>
  );
};

export const CatalystInstructionSettings: React.FC<{ widget: WidgetData }> = ({
  widget: _widget,
}) => {
  return (
    <div className="p-4 text-center">
      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
        Guide Mode Controls
      </p>
    </div>
  );
};
