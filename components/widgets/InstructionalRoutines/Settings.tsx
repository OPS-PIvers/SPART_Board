import React from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import {
  WidgetData,
  InstructionalRoutinesConfig,
  RoutineStep,
} from '../../../types';
import { Plus } from 'lucide-react';
import { StepRow } from './StepRow';

export const InstructionalRoutinesSettings: React.FC<{
  widget: WidgetData;
}> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const { isAdmin } = useAuth();
  const config = widget.config as InstructionalRoutinesConfig;
  const { customSteps = [], scaleMultiplier = 1 } = config;

  const moveStep = (idx: number, dir: 'up' | 'down') => {
    const next = [...customSteps];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updateWidget(widget.id, { config: { ...config, customSteps: next } });
  };

  const updateStep = (index: number, newStep: RoutineStep) => {
    const next = [...customSteps];
    next[index] = newStep;
    updateWidget(widget.id, { config: { ...config, customSteps: next } });
  };

  const deleteStep = (index: number) => {
    const next = customSteps.filter((_, i) => i !== index);
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
        className="w-full py-2.5 bg-brand-blue-lighter text-brand-blue-primary rounded-xl text-xxs  uppercase tracking-widest hover:bg-brand-blue-light/20 transition-colors"
      >
        Switch Routine Template
      </button>

      <div className="space-y-3">
        <label className="text-xxs  uppercase text-slate-400 tracking-[0.2em] block mb-2">
          Step Editor
        </label>
        {customSteps.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            index={i}
            totalSteps={customSteps.length}
            onUpdate={(updatedStep) => updateStep(i, updatedStep)}
            onDelete={() => deleteStep(i)}
            onMove={(dir) => moveStep(i, dir)}
            isAdmin={!!isAdmin}
          />
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
          className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-brand-blue-primary hover:text-brand-blue-primary transition-all flex items-center justify-center gap-2 text-xxs  uppercase"
        >
          <Plus className="w-4 h-4" /> Add Next Step
        </button>
      </div>

      <div className="bg-slate-50 p-4 rounded-2xl">
        <label className="text-xxs  uppercase text-slate-400 tracking-widest mb-3 block">
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
