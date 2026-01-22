import React, { useState, useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
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
import { useAuth } from '../../context/useAuth';

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
        className="mt-4 flex items-center justify-center gap-2 py-2 text-xxs font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
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
      .map((o) => `"${o.label.replace(/