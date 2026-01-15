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
    <div className="grid grid-cols-2 h-full gap-4 p-2 bg-transparent">
      <div className="flex flex-col items-center justify-center bg-blue-500/20 rounded-2xl p-4 border border-blue-400/20">
        <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
          {teamA}
        </div>
        <div className="text-5xl font-black text-blue-700 mb-4 tabular-nums drop-shadow-sm">
          {scoreA}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              updateScore('A', -1);
            }}
            className="p-2 bg-white/40 text-blue-700 rounded-lg shadow-sm hover:bg-white/60"
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
      <div className="flex flex-col items-center justify-center bg-red-500/20 rounded-2xl p-4 border border-red-400/20">
        <div className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">
          {teamB}
        </div>
        <div className="text-5xl font-black text-red-700 mb-4 tabular-nums drop-shadow-sm">
          {scoreB}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              updateScore('B', -1);
            }}
            className="p-2 bg-white/40 text-red-700 rounded-lg shadow-sm hover:bg-white/60"
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
