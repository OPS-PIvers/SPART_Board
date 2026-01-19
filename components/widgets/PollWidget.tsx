import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, PollConfig } from '../../types';
import { RotateCcw, Plus, Trash2 } from 'lucide-react';
import { MagicInput } from '../common/MagicInput';

export const PollWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
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

  const total = options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="text-sm font-black uppercase text-slate-800 mb-4 tracking-tight border-b pb-2">
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
              <div className="flex justify-between text-[10px] font-bold mb-1 uppercase tracking-wider text-slate-600">
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
        onClick={() =>
          updateWidget(widget.id, {
            config: {
              ...config,
              options: options.map((o) => ({ ...o, votes: 0 })),
            } as PollConfig,
          })
        }
        className="mt-4 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
      >
        <RotateCcw className="w-3 h-3" /> Reset Poll
      </button>
    </div>
  );
};

// Internal component for performance-optimized inputs
const BufferedInput: React.FC<{
  value: string;
  onCommit: (val: string) => void;
  className?: string;
  placeholder?: string;
}> = ({ value: initialValue, onCommit, className, placeholder }) => {
  const [value, setValue] = useState(initialValue);

  // Sync with external changes (e.g. AI generation)
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value !== initialValue) {
          onCommit(value);
        }
      }}
      className={className}
      placeholder={placeholder}
    />
  );
};

export const PollSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as PollConfig;
  const { question = '', options = [] } = config;

  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    if (!newOption.trim()) return;
    updateWidget(widget.id, {
      config: {
        ...config,
        options: [...options, { label: newOption, votes: 0 }],
      } as PollConfig,
    });
    setNewOption('');
  };

  const removeOption = (index: number) => {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    updateWidget(widget.id, {
      config: { ...config, options: newOptions } as PollConfig,
    });
  };

  const handleMagicGenerate = (data: {
    question: string;
    options: string[];
  }) => {
    if (
      typeof data.question !== 'string' ||
      !Array.isArray(data.options) ||
      !data.options.every((opt) => typeof opt === 'string')
    ) {
      console.error('Invalid data format from AI:', data);
      return;
    }

    updateWidget(widget.id, {
      config: {
        ...config,
        question: data.question,
        options: data.options.map((opt) => ({ label: opt, votes: 0 })),
      } as PollConfig,
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Poll Question
        </label>
        <BufferedInput
          value={question}
          onCommit={(val) =>
            updateWidget(widget.id, {
              config: { ...config, question: val } as PollConfig,
            })
          }
          className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
          placeholder="e.g. Favorite Color?"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>Options</span>
          <span className="text-indigo-500">{options.length}</span>
        </label>

        <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 group">
              <BufferedInput
                value={opt.label}
                onCommit={(val) => {
                  const newOptions = [...options];
                  newOptions[i] = { ...newOptions[i], label: val };
                  updateWidget(widget.id, {
                    config: { ...config, options: newOptions } as PollConfig,
                  });
                }}
                className="flex-1 p-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={() => removeOption(i)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addOption()}
            className="flex-1 p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add option..."
          />
          <button
            onClick={addOption}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 block">
          Magic Generation
        </label>
        <MagicInput
          onGenerate={handleMagicGenerate}
          schema={{
            question: 'The poll question',
            options: ['Option 1', 'Option 2', 'Option 3'],
          }}
          placeholder="e.g. 4 options for a math quiz about fractions"
          buttonLabel="Generate Poll"
        />
      </div>
    </div>
  );
};
