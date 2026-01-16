import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, ScoreboardConfig } from '../../types';
import { RefreshCw, Type } from 'lucide-react';

export const ScoreboardSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = (widget.config || {}) as ScoreboardConfig;
  const { teamA = 'Team A', teamB = 'Team B' } = config;

  return (
    <div className="space-y-6">
      {/* Team Names */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Type className="w-3 h-3" /> Team Names
        </label>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Team A (Blue)</label>
            <input
              type="text"
              value={teamA}
              onChange={(e) =>
                updateWidget(widget.id, {
                  config: { ...config, teamA: e.target.value },
                })
              }
              className="w-full p-2 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-all"
              placeholder="Enter name for Team A"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Team B (Red)</label>
            <input
              type="text"
              value={teamB}
              onChange={(e) =>
                updateWidget(widget.id, {
                  config: { ...config, teamB: e.target.value },
                })
              }
              className="w-full p-2 text-sm border-2 border-slate-200 rounded-lg focus:border-red-500 focus:outline-none transition-all"
              placeholder="Enter name for Team B"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          Actions
        </label>
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, scoreA: 0, scoreB: 0 },
            })
          }
          className="w-full p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-wide"
        >
          <RefreshCw className="w-4 h-4" />
          Reset Scores
        </button>
      </div>
    </div>
  );
};
