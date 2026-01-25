import React, { useState } from 'react';
import { ArrowLeft, Save, Trash2, PlusCircle } from 'lucide-react';
import { useInstructionalRoutines } from '../../../hooks/useInstructionalRoutines';
import { InstructionalRoutine } from '../../../config/instructionalRoutines';
import { IconPicker } from './IconPicker';

interface LibraryManagerProps {
  initialRoutine: InstructionalRoutine | null;
  onClose: () => void;
}

export const LibraryManager: React.FC<LibraryManagerProps> = ({
  initialRoutine,
  onClose,
}) => {
  const { saveRoutine } = useInstructionalRoutines();
  const [routine, setRoutine] = useState<InstructionalRoutine>(
    initialRoutine ?? {
      id: crypto.randomUUID(),
      name: '',
      grades: 'Universal',
      gradeLevels: ['k-2', '3-5', '6-8', '9-12'],
      icon: 'Zap',
      steps: [{ text: '', icon: 'Zap', color: 'blue', label: 'Step' }],
    }
  );

  const handleSave = async () => {
    if (!routine.name) return;
    await saveRoutine(routine);
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-200 rounded-full"
        >
          <ArrowLeft size={18} />
        </button>
        <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 flex-1">
          {initialRoutine ? 'Edit Routine Template' : 'Add New Routine'}
        </h3>
        <button
          onClick={handleSave}
          disabled={!routine.name}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xxs font-black uppercase tracking-wider hover:bg-blue-700 disabled:opacity-50"
        >
          <Save size={14} />
          Save to Library
        </button>
      </div>

      <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xxxs font-black uppercase text-slate-400 ml-1">
              Routine Name
            </label>
            <input
              type="text"
              value={routine.name}
              onChange={(e) =>
                setRoutine({
                  ...routine,
                  name: e.target.value,
                } as InstructionalRoutine)
              }
              placeholder="e.g. Think-Pair-Share"
              className="w-full bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-1 text-left">
            <label className="text-xxxs font-black uppercase text-slate-400 ml-1">
              Main Icon
            </label>
            <IconPicker
              currentIcon={routine.icon}
              onSelect={(icon) =>
                setRoutine({
                  ...routine,
                  icon,
                } as InstructionalRoutine)
              }
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <label className="text-xxs font-black uppercase text-slate-400 tracking-widest block mb-2">
            Default Steps
          </label>
          {routine.steps.map((step, i) => (
            <div
              key={i}
              className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <IconPicker
                    currentIcon={step.icon ?? 'Zap'}
                    color={step.color}
                    onSelect={(icon) => {
                      const nextSteps = [...routine.steps];
                      nextSteps[i] = { ...step, icon };
                      setRoutine({
                        ...routine,
                        steps: nextSteps,
                      } as InstructionalRoutine);
                    }}
                  />
                  <input
                    type="text"
                    value={step.label ?? ''}
                    onChange={(e) => {
                      const nextSteps = [...routine.steps];
                      nextSteps[i] = { ...step, label: e.target.value };
                      setRoutine({
                        ...routine,
                        steps: nextSteps,
                      } as InstructionalRoutine);
                    }}
                    placeholder="Label"
                    className="w-16 bg-white border-none rounded px-2 py-0.5 text-[9px] font-bold text-emerald-600"
                  />
                  <select
                    value={step.color ?? 'blue'}
                    onChange={(e) => {
                      const nextSteps = [...routine.steps];
                      nextSteps[i] = { ...step, color: e.target.value };
                      setRoutine({
                        ...routine,
                        steps: nextSteps,
                      } as InstructionalRoutine);
                    }}
                    className="bg-white border-none rounded px-2 py-0.5 text-[9px] font-bold text-slate-600"
                  >
                    {[
                      'blue',
                      'amber',
                      'indigo',
                      'green',
                      'slate',
                      'purple',
                      'rose',
                    ].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={step.text}
                  onChange={(e) => {
                    const nextSteps = [...routine.steps];
                    nextSteps[i] = { ...step, text: e.target.value };
                    setRoutine({
                      ...routine,
                      steps: nextSteps,
                    } as InstructionalRoutine);
                  }}
                  rows={1}
                  placeholder="Instruction text..."
                  className="w-full text-[11px] font-bold bg-white border-none rounded-lg px-2 py-1 leading-tight resize-none text-slate-800"
                />
              </div>
              <button
                onClick={() => {
                  const nextSteps = routine.steps.filter((_, idx) => idx !== i);
                  setRoutine({
                    ...routine,
                    steps: nextSteps,
                  } as InstructionalRoutine);
                }}
                className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const nextSteps = [
                ...routine.steps,
                { text: '', icon: 'Zap', color: 'blue', label: 'Step' },
              ];
              setRoutine({
                ...routine,
                steps: nextSteps,
              } as InstructionalRoutine);
            }}
            className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2 text-xxs font-black uppercase"
          >
            <PlusCircle size={14} /> Add Template Step
          </button>
        </div>
      </div>
    </div>
  );
};
