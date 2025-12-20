import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData } from '../../types';
import { RotateCcw } from 'lucide-react';

export const PollWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const { question = 'Vote Now!', options = [] } = widget.config as {
    question?: string;
    options?: { label: string; votes: number }[];
  };

  const vote = (index: number) => {
    const newOptions = [...options];
    newOptions[index].votes += 1;
    updateWidget(widget.id, {
      config: { ...widget.config, options: newOptions },
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
  const total = options.reduce((sum: number, o: any) => sum + o.votes, 0);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="text-sm font-black uppercase text-slate-800 mb-4 tracking-tight border-b pb-2">
        {question}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {options.map((o: any, i: number) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
                {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                <span>{o.label}</span>
                <span>
                  {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
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
              ...widget.config,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
              options: options.map((o: any) => ({ ...o, votes: 0 })),
            },
          })
        }
        className="mt-4 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
      >
        <RotateCcw className="w-3 h-3" /> Reset Poll
      </button>
    </div>
  );
};
