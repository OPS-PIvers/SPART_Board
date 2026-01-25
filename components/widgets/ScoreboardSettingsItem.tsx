import React from 'react';
import { ScoreboardTeam } from '../../types';
import { Trash2 } from 'lucide-react';

interface ScoreboardSettingsItemProps {
  team: ScoreboardTeam;
  onUpdateName: (id: string, name: string) => void;
  onRemove: (id: string) => void;
}

export const ScoreboardSettingsItem = React.memo<ScoreboardSettingsItemProps>(
  ({ team, onUpdateName, onRemove }) => {
    return (
      <div className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200">
        <div
          className={`w-3 h-3 rounded-full shrink-0 ${team.color ?? 'bg-slate-300'}`}
        />
        <input
          value={team.name}
          onChange={(e) => onUpdateName(team.id, e.target.value)}
          className="flex-1 text-xs font-bold text-slate-700 bg-transparent outline-none"
          placeholder="Team Name"
        />
        <div className="text-xs font-mono text-slate-400 w-8 text-right">
          {team.score}
        </div>
        <button
          onClick={() => onRemove(team.id)}
          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }
);

ScoreboardSettingsItem.displayName = 'ScoreboardSettingsItem';
