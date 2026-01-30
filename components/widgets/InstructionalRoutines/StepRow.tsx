import React from 'react';
import { RoutineStep } from '../../../types';
import { useDebounce } from '../../../hooks/useDebounce';
import { detectIntent } from './predictiveIntent';
import { QUICK_TOOLS } from './constants';
import { IconPicker } from './IconPicker';
import { ChevronUp, ChevronDown, Trash2, Sparkles, Rocket } from 'lucide-react';

interface StepRowProps {
  step: RoutineStep;
  index: number;
  totalSteps: number;
  onUpdate: (step: RoutineStep) => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down') => void;
  isAdmin: boolean;
}

export const StepRow: React.FC<StepRowProps> = ({
  step,
  index,
  totalSteps,
  onUpdate,
  onDelete,
  onMove,
  isAdmin,
}) => {
  // Debounce the text to avoid spamming regex checks
  const debouncedText = useDebounce(step.text, 500);

  // Derive suggestion directly
  const suggestion = React.useMemo(() => {
    if (step.attachedWidget) return null;
    return detectIntent(debouncedText);
  }, [debouncedText, step.attachedWidget]);

  const attachSuggestion = () => {
    if (!suggestion) return;
    const tool = QUICK_TOOLS.find((t) => t.label === suggestion.toolLabel);
    if (tool && tool.type !== 'none' && tool.config) {
      onUpdate({
        ...step,
        attachedWidget: {
          type: tool.type,
          label: tool.label,
          config: tool.config,
        },
      });
    }
  };

  return (
    <div className="flex gap-2 items-start bg-white p-3 rounded-2xl border border-slate-100 group shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-1 shrink-0 mt-1">
        <button
          onClick={() => onMove('up')}
          className="text-slate-300 hover:text-brand-blue-primary disabled:opacity-30 disabled:hover:text-slate-300"
          disabled={index === 0}
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => onMove('down')}
          className="text-slate-300 hover:text-brand-blue-primary disabled:opacity-30 disabled:hover:text-slate-300"
          disabled={index === totalSteps - 1}
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IconPicker
              currentIcon={step.icon ?? 'Zap'}
              color={step.color}
              onSelect={(icon) => {
                onUpdate({ ...step, icon });
              }}
            />
            <span className="text-xxxs font-bold text-slate-400 uppercase">
              Step {index + 1}
            </span>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                <span className="text-xxxs font-black uppercase text-slate-400">
                  Label:
                </span>
                <input
                  type="text"
                  value={step.label ?? ''}
                  onChange={(e) => {
                    onUpdate({ ...step, label: e.target.value });
                  }}
                  placeholder="Keyword"
                  className="w-16 bg-transparent border-none p-0 text-[9px] font-bold text-emerald-600 focus:ring-0"
                />
              </div>
            </div>
          )}
        </div>

        <textarea
          value={step.text}
          onChange={(e) => {
            onUpdate({ ...step, text: e.target.value });
          }}
          rows={2}
          placeholder="Enter student direction..."
          className="w-full text-[11px] bg-transparent border-none focus:ring-0 p-0 leading-tight resize-none text-slate-800"
        />

        {/* Suggestion UI */}
        {suggestion && !step.attachedWidget && (
          <div className="animate-in fade-in slide-in-from-top-1">
            <button
              onClick={attachSuggestion}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-all w-full justify-center group/btn"
            >
              <Sparkles className="w-3 h-3 text-indigo-500 group-hover/btn:animate-pulse" />
              <span>Attach {suggestion.toolLabel}?</span>
              <div className="ml-auto bg-white/50 px-1.5 py-0.5 rounded text-[9px] text-indigo-400">
                Magic
              </div>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xxxs font-bold text-slate-400 uppercase flex items-center gap-1">
            <Rocket size={10} /> Attached Tool:
          </span>
          <select
            value={
              step.attachedWidget
                ? (QUICK_TOOLS.find(
                    (t) =>
                      t.type === step.attachedWidget?.type &&
                      t.label === step.attachedWidget.label
                  )?.label ?? step.attachedWidget.label)
                : 'None'
            }
            onChange={(e) => {
              const selectedTool = QUICK_TOOLS.find(
                (t) => t.label === e.target.value
              );

              if (
                selectedTool &&
                selectedTool.type !== 'none' &&
                selectedTool.config
              ) {
                onUpdate({
                  ...step,
                  attachedWidget: {
                    type: selectedTool.type,
                    label: selectedTool.label,
                    config: selectedTool.config,
                  },
                });
              } else {
                // Remove attached widget
                const { attachedWidget: _unused, ...rest } = step;
                onUpdate(rest as RoutineStep);
              }
            }}
            className="text-xxs bg-slate-50 border border-slate-200 rounded p-1 flex-1 outline-none focus:border-indigo-500"
          >
            {QUICK_TOOLS.map((t) => (
              <option key={t.label} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onDelete}
        className="p-2 text-red-400 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity mt-1"
        title="Delete Step"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
