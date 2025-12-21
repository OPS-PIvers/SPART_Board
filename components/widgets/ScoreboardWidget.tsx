import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetData } from '../../types';
import { Plus, Minus } from 'lucide-react';

export const ScoreboardWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const {
    scoreA = 0,
    scoreB = 0,
    teamA = 'Team A',
    teamB = 'Team B',
  } = (widget.config || {}) as {
    scoreA?: number;
    scoreB?: number;
    teamA?: string;
    teamB?: string;
  };

  const updateScore = (team: 'A' | 'B', delta: number) => {
    if (team === 'A')
      updateWidget(widget.id, {
        config: { ...widget.config, scoreA: Math.max(0, scoreA + delta) },
      });
    else
      updateWidget(widget.id, {
        config: { ...widget.config, scoreB: Math.max(0, scoreB + delta) },
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
