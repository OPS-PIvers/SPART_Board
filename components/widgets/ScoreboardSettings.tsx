import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, ScoreboardConfig } from '../../types';
import { RefreshCw, Users } from 'lucide-react';

export const ScoreboardSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as ScoreboardConfig;
  const { teamA = 'Team A', teamB = 'Team B' } = config;

  return (
    <div className="space-y-6">
      {/* Team Names */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Users className="w-3 h-3" /> Team Names
        </label>
        <div className="space-y-3">
          <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100">
            <label className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-1 block">
              Blue Team
            </label>
            <input
              type="text"
              value={teamA}
              onChange={(e) =>
                updateWidget(widget.id, {
                  config: { ...config, teamA: e.target.value },
                })
              }
              className="w-full bg-white border border-blue-200 rounded px-2 py-1 text-sm font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Team A"
            />
          </div>
          <div className="bg-red-50/50 p-2 rounded-lg border border-red-100">
            <label className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-1 block">
              Red Team
            </label>
            <input
              type="text"
              value={teamB}
              onChange={(e) =>
                updateWidget(widget.id, {
                  config: { ...config, teamB: e.target.value },
                })
              }
              className="w-full bg-white border border-red-200 rounded px-2 py-1 text-sm font-bold text-red-900 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              placeholder="Team B"
            />
          </div>
        </div>
      </div>

      {/* Reset Actions */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <RefreshCw className="w-3 h-3" /> Actions
        </label>
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, scoreA: 0, scoreB: 0 },
            })
          }
          className="w-full p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-3 h-3" />
          RESET SCORES
        </button>
      </div>
    </div>
  );
};
