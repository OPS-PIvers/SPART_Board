import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { useScaledFont } from '../../hooks/useScaledFont';
import { WidgetData, PollConfig, DEFAULT_GLOBAL_STYLE } from '../../types';
import {
  RotateCcw,
  Plus,
  Trash2,
  Download,
  Type,
  Users,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { MagicInput } from '../common/MagicInput';
import { generatePoll, GeneratedPoll } from '../../utils/ai';

export const PollWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as PollConfig;
  const { question = 'Vote Now!', options = [] } = config;

  const vote = (index: number) => {
    const newOptions = [...options];
    newOptions[index] = {
      ...newOptions[index],
      votes: newOptions[index].votes + 1,
    };
    updateWidget(widget.id, {
      config: { ...config, options: newOptions } as PollConfig,
    });
  };

  const handleReset = () => {
    if (!confirm('Are you sure you want to reset the poll?')) return;
    updateWidget(widget.id, {
      config: {
        ...config,
        options: options.map((o) => ({ ...o, votes: 0 })),
      } as PollConfig,
    });
  };

  const total = options.reduce((sum, o) => sum + o.votes, 0);

  const questionSize = useScaledFont(widget.w, widget.h, 0.4, 14, 32);
  const labelSize = useScaledFont(widget.w, widget.h, 0.25, 10, 18);

  return (
    <div className={`flex flex-col h-full p-4 font-${globalStyle.fontFamily}`}>
      <div
        className="font-black uppercase text-slate-800 mb-4 tracking-tight border-b pb-2"
        style={{ fontSize: `${questionSize}px` }}
      >
        {question}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
        {options.map((o, i: number) => {
          const percent = total === 0 ? 0 : Math.round((o.votes / total) * 100);

          return (
            <button
              key={i}
              onClick={() => {
                vote(i);
              }}
              className="w-full text-left group"
            >
              <div
                className="flex justify-between mb-1 uppercase tracking-wider text-slate-600"
                style={{ fontSize: `${labelSize}px` }}
              >
                <span>{o.label}</span>

                <span>
                  {o.votes} ({percent}%)
                </span>
              </div>

              <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200">
                <div
                  className="h-full bg-indigo-500 transition-all duration-500 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
      <button
        onClick={handleReset}
        className="mt-4 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
      >
        <RotateCcw className="w-3 h-3" /> Reset Poll
      </button>
    </div>
  );
};

interface OptionInputProps {
  label: string;
  index: number;
  onSave: (index: number, val: string) => void;
}

const OptionInput: React.FC<OptionInputProps> = ({ label, index, onSave }) => {
  const [val, setVal] = useState(label);

  return (
    <input
      type="text"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onSave(index, val)}
      className="flex-1 p-2 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
      placeholder={`Option ${index + 1}`}
    />
  );
};

export const PollSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, addToast, rosters, activeRosterId } = useDashboard();
  const { canAccessFeature } = useAuth();
  const config = (widget.config || {}) as PollConfig;
  const { question = 'Vote Now!', options = [] } = config;

  const activeRoster = useMemo(
    () => rosters.find((r) => r.id === activeRosterId),
    [rosters, activeRosterId]
  );

  // Question local state
  // Using key={question} on input allows removing the useEffect sync
  const [localQuestion, setLocalQuestion] = useState(question);

  const saveQuestion = () => {
    if (localQuestion !== question) {
      updateWidget(widget.id, {
        config: { ...config, question: localQuestion } as PollConfig,
      });
    }
  };

  const importFromRoster = () => {
    if (!activeRoster) {
      addToast('No active class roster selected!', 'error');
      return;
    }

    if (
      options.length > 0 &&
      !confirm('This will replace current options. Continue?')
    ) {
      return;
    }

    const newOptions = activeRoster.students.map((s) => ({
      label: `${s.firstName} ${s.lastName}`.trim(),
      votes: 0,
    }));

    updateWidget(widget.id, {
      config: { ...config, options: newOptions } as PollConfig,
    });
    addToast(`Imported ${newOptions.length} students!`, 'success');
  };

  const handleExport = () => {
    // CSV Export Logic
    // Wrap fields in quotes to handle commas/newlines
    const csvHeader = 'Option,Votes\n';
    const csvRows = options
      .map((o) => `"${o.label.replace(/"/g, '""')}",${o.votes}`)
      .join('\n');
    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Poll_Results_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast('Results exported to CSV', 'success');
  };

  const addOption = () => {
    const newOption = { label: `Option ${options.length + 1}`, votes: 0 };
    updateWidget(widget.id, {
      config: { ...config, options: [...options, newOption] } as PollConfig,
    });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    updateWidget(widget.id, {
      config: { ...config, options: newOptions } as PollConfig,
    });
  };

  const updateOptionLabel = (index: number, label: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], label };
    updateWidget(widget.id, {
      config: { ...config, options: newOptions } as PollConfig,
    });
  };

  const handleReset = () => {
    if (!confirm('Are you sure you want to reset the poll?')) return;
    updateWidget(widget.id, {
      config: {
        ...config,
        options: options.map((o) => ({ ...o, votes: 0 })),
      } as PollConfig,
    });
  };

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-900">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Import from Class
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={importFromRoster}
            disabled={!activeRoster}
            title={
              !activeRoster
                ? 'Select a class in the Classes widget'
                : `Import ${activeRoster.name}`
            }
            icon={<RefreshCw className="w-3 h-3" />}
          >
            Import Class
          </Button>
        </div>
        {!activeRoster && (
          <div className="text-[10px] text-indigo-400 font-medium">
            Tip: Select a class in the Classes widget to import student names.
          </div>
        )}
      </div>

      {/* Magic Generator */}
      {canAccessFeature('smart-poll') && (
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
            Magic Generator
          </label>
          <MagicInput<GeneratedPoll>
            onGenerate={generatePoll}
            onSuccess={(result) => {
              const newOptions = result.options.map((opt) => ({
                label: opt,
                votes: 0,
              }));
              updateWidget(widget.id, {
                config: {
                  ...config,
                  question: result.question,
                  options: newOptions,
                } as PollConfig,
              });
              setLocalQuestion(result.question);
              addToast('Poll generated magically!', 'success');
            }}
            placeholder="e.g. Photosynthesis, Civil War, 3rd Grade Math..."
            buttonLabel="Magic Poll"
          />
        </div>
      )}

      {/* Question Edit */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
          <Type className="w-3 h-3" /> Question
        </label>
        <input
          key={question} // Force reset when prop changes
          type="text"
          value={localQuestion}
          onChange={(e) => setLocalQuestion(e.target.value)}
          onBlur={saveQuestion}
          className="w-full p-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Enter your question..."
        />
      </div>

      {/* Options List */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
          Options
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          {options.map((option, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <OptionInput
                key={`${option.label}-${idx}`} // Use label as key to reset internal state when external data changes
                index={idx}
                label={option.label}
                onSave={updateOptionLabel}
              />
              <button
                onClick={() => removeOption(idx)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove Option"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={addOption}
          className="mt-3 w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 border border-dashed border-slate-300 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Add Option
        </button>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Actions
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={handleReset}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
          <Button
            onClick={handleExport}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
};
