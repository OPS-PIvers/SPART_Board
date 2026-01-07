import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, ScoreboardConfig } from '../../types';
import { Plus, Minus } from 'lucide-react';

export const ScoreboardWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as ScoreboardConfig;
  const { scoreA = 0, scoreB = 0, teamA = 'Team A', teamB = 'Team B' } = config;

  const updateScore = (team: 'A' | 'B', delta: number) => {
    if (team === 'A')
      updateWidget(widget.id, {
        config: { ...config, scoreA: Math.max(0, scoreA + delta) },
      });
    else
      updateWidget(widget.id, {
        config: { ...config, scoreB: Math.max(0, scoreB + delta) },
      });
  };

  return (
    <div className="grid grid-cols-2 h-full gap-4 p-2">
      <div className="flex flex-col items-center justify-center bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">
          {teamA}
        </div>
        <div className="text-5xl font-black text-blue-700 mb-4 tabular-nums">
          {scoreA}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              updateScore('A', -1);
            }}
            className="p-2 bg-white text-blue-600 rounded-lg shadow-sm hover:bg-blue-100"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              updateScore('A', 1);
            }}
            className="p-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center bg-red-50 rounded-2xl p-4 border border-red-100">
        <div className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">
          {teamB}
        </div>
        <div className="text-5xl font-black text-red-700 mb-4 tabular-nums">
          {scoreB}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              updateScore('B', -1);
            }}
            className="p-2 bg-white text-red-600 rounded-lg shadow-sm hover:bg-red-100"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              updateScore('B', 1);
            }}
            className="p-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ScoreboardSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as ScoreboardConfig;
  const { teamA = 'Team A', teamB = 'Team B' } = config;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Team Names
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={teamA}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, teamA: e.target.value },
              })
            }
            placeholder="Team A Name"
            className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-700"
          />
          <input
            type="text"
            value={teamB}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, teamB: e.target.value },
              })
            }
            placeholder="Team B Name"
            className="w-full px-3 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-red-700"
          />
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
        <h4 className="text-[10px] font-black text-slate-700 uppercase mb-2">
          Instructions
        </h4>
        <p className="text-[9px] text-slate-600 leading-normal font-medium">
          Use the <b>+</b> and <b>-</b> buttons on the main widget to update the
          score. Scores cannot go below zero.
        </p>
      </div>
    </div>
  );
};
