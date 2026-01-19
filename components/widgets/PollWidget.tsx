import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { useScaledFont } from '../../hooks/useScaledFont';
import { WidgetData, PollConfig, DEFAULT_GLOBAL_STYLE } from '../../types';
import { RotateCcw } from 'lucide-react';

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

  const total = options.reduce((sum, o) => sum + o.votes, 0);

  const questionSize = useScaledFont(widget.w, widget.h, 0.4, 14, 32);
  const labelSize = useScaledFont(widget.w, widget.h, 0.25, 10, 18);

  return (
    <div
      className={`flex flex-col h-full p-4 font-${globalStyle.fontFamily} font-${globalStyle.fontWeight ?? 'bold'}`}
    >
      <div
        className="uppercase text-slate-800 mb-4 tracking-tight border-b pb-2"
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
        onClick={() =>
          updateWidget(widget.id, {
            config: {
              ...config,
              options: options.map((o) => ({ ...o, votes: 0 })),
            } as PollConfig,
          })
        }
        className="mt-4 flex items-center justify-center gap-2 py-2 text-[10px]  uppercase text-slate-400 hover:text-indigo-600 transition-colors"
      >
        <RotateCcw className="w-3 h-3" /> Reset Poll
      </button>
    </div>
  );
};
