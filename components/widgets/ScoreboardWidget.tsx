import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { useDashboard } from '../../context/useDashboard';
import {
  WidgetData,
  ScoreboardConfig,
  ScoreboardTeam,
  RandomConfig,
  RandomGroup,
  DEFAULT_GLOBAL_STYLE,
} from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { Plus, Trash2, Users, RefreshCw, Trophy } from 'lucide-react';
import { Button } from '../common/Button';
import { ScoreboardItem, TEAM_COLORS } from './ScoreboardItem';

const TeamNameInput: React.FC<{
  value: string;
  onUpdate: (val: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onUpdate, placeholder, className }) => {
  const [localValue, setLocalValue] = React.useState(value);
  const debouncedValue = useDebounce(localValue, 500);

  // Sync with prop changes (e.g. undo/redo)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Sync debounced value to parent
  useEffect(() => {
    if (debouncedValue !== value) {
      onUpdate(debouncedValue);
    }
  }, [debouncedValue, value, onUpdate]);

  return (
    <input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      className={className}
      placeholder={placeholder}
    />
  );
};

const DEFAULT_TEAMS: ScoreboardTeam[] = [
  { id: 'team-a', name: 'Team A', score: 0, color: 'bg-blue-500' },
  { id: 'team-b', name: 'Team B', score: 0, color: 'bg-red-500' },
];

import { WidgetLayout } from './WidgetLayout';

export const ScoreboardWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as ScoreboardConfig;

  // Auto-migration: If no teams array, convert legacy A/B to teams
  useEffect(() => {
    if (!config.teams) {
      const newTeams: ScoreboardTeam[] = [
        {
          id: 'team-a',
          name: config.teamA ?? 'Team A',
          score: config.scoreA ?? 0,
          color: 'bg-blue-500',
        },
        {
          id: 'team-b',
          name: config.teamB ?? 'Team B',
          score: config.scoreB ?? 0,
          color: 'bg-red-500',
        },
      ];
      updateWidget(widget.id, {
        config: { ...config, teams: newTeams },
      });
    }
  }, [config, widget.id, updateWidget]);

  const teams = config.teams ?? DEFAULT_TEAMS;

  // Keep a ref to the latest config to ensure handleUpdateScore is stable
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const handleUpdateScore = useCallback(
    (teamId: string, delta: number) => {
      const currentConfig = configRef.current;
      const currentTeams = currentConfig.teams ?? DEFAULT_TEAMS;
      const newTeams = currentTeams.map((t) =>
        t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t
      );
      updateWidget(widget.id, {
        config: { ...currentConfig, teams: newTeams },
      });
    },
    [widget.id, updateWidget]
  );

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div
          className={`grid grid-cols-[repeat(auto-fit,minmax(min(120px,100%),1fr))] auto-rows-[1fr] h-full w-full gap-3 p-3 bg-transparent overflow-y-auto custom-scrollbar font-${globalStyle.fontFamily}`}
        >
          {teams.map((team) => (
            <ScoreboardItem
              key={team.id}
              team={team}
              onUpdateScore={handleUpdateScore}
            />
          ))}
          {teams.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center text-slate-400 gap-2 h-full">
              <Trophy className="w-12 h-12 opacity-20" />
              <span className="text-sm font-black uppercase tracking-widest">
                No Teams
              </span>
            </div>
          )}
        </div>
      }
    />
  );
};

export const ScoreboardSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, updateDashboard, activeDashboard, addToast } =
    useDashboard();
  const config = widget.config as ScoreboardConfig;
  const teams = config.teams ?? [];

  // Find Random Widget
  const randomWidget = useMemo(
    () => activeDashboard?.widgets.find((w) => w.type === 'random'),
    [activeDashboard]
  );

  const importFromRandom = () => {
    if (!randomWidget) {
      addToast('No Randomizer widget found!', 'error');
      return;
    }

    const randomConfig = randomWidget.config as RandomConfig;
    const lastResult = randomConfig.lastResult;

    if (
      Array.isArray(lastResult) &&
      lastResult.length > 0 &&
      typeof lastResult[0] === 'object' &&
      lastResult[0] !== null &&
      'names' in lastResult[0]
    ) {
      const groups = lastResult as RandomGroup[];
      const newTeams: ScoreboardTeam[] = groups.map((g, i) => {
        // If the random group has an ID, use it to lookup shared name
        let name = `Group ${i + 1}`;
        let linkedGroupId: string | undefined = undefined;

        if (g.id) {
          linkedGroupId = g.id;
          // Try to find shared name
          const shared = activeDashboard?.sharedGroups?.find(
            (sg) => sg.id === g.id
          );
          if (shared) {
            name = shared.name;
          }
        }

        return {
          id: crypto.randomUUID(),
          name,
          score: 0,
          color: TEAM_COLORS[i % TEAM_COLORS.length],
          linkedGroupId,
        };
      });

      updateWidget(widget.id, {
        config: { ...config, teams: newTeams },
      });
      addToast(`Imported ${newTeams.length} groups!`, 'success');
    } else {
      addToast('Randomizer needs to have generated groups first.', 'info');
    }
  };

  const addTeam = () => {
    const newTeam: ScoreboardTeam = {
      id: crypto.randomUUID(),
      name: `Team ${teams.length + 1}`,
      score: 0,
      color: TEAM_COLORS[teams.length % TEAM_COLORS.length],
    };
    updateWidget(widget.id, {
      config: { ...config, teams: [...teams, newTeam] },
    });
  };

  const removeTeam = (id: string) => {
    updateWidget(widget.id, {
      config: { ...config, teams: teams.filter((t) => t.id !== id) },
    });
  };

  const updateTeamName = (id: string, name: string) => {
    const team = teams.find((t) => t.id === id);
    if (team?.linkedGroupId) {
      // Update shared group name
      const sharedGroups = activeDashboard?.sharedGroups ?? [];
      const existing = sharedGroups.find((g) => g.id === team.linkedGroupId);

      let newSharedGroups;
      if (existing) {
        newSharedGroups = sharedGroups.map((g) =>
          g.id === team.linkedGroupId ? { ...g, name } : g
        );
      } else {
        // Should not happen if data is consistent, but safe fallback
        newSharedGroups = [
          ...sharedGroups,
          { id: team.linkedGroupId ?? '', name },
        ];
      }

      updateDashboard({ sharedGroups: newSharedGroups });
    }

    updateWidget(widget.id, {
      config: {
        ...config,
        teams: teams.map((t) => (t.id === id ? { ...t, name } : t)),
      },
    });
  };

  const resetScores = () => {
    if (confirm('Reset all scores to 0?')) {
      updateWidget(widget.id, {
        config: {
          ...config,
          teams: teams.map((t) => ({ ...t, score: 0 })),
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-900">
            <Users className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">
              Import from Randomizer
            </span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={importFromRandom}
            disabled={!randomWidget}
            title={
              !randomWidget ? 'Add a Randomizer widget first' : 'Import Groups'
            }
            icon={<RefreshCw className="w-3 h-3" />}
          >
            Import Groups
          </Button>
        </div>
        {!randomWidget && (
          <div className="text-xxs text-indigo-400 font-medium">
            Tip: Add a Randomizer widget and create groups to import them here.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xxs font-black text-slate-400 uppercase tracking-widest block">
            Teams ({teams.length})
          </label>
          <button
            onClick={resetScores}
            className="text-xxs font-bold text-red-500 hover:text-red-600 underline"
          >
            Reset Scores
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-200"
            >
              <div
                className={`w-3 h-3 rounded-full shrink-0 ${team.color ?? 'bg-slate-300'}`}
              />
              <TeamNameInput
                value={team.name}
                onUpdate={(val) => updateTeamName(team.id, val)}
                className="flex-1 text-xs font-bold text-slate-700 bg-transparent outline-none"
                placeholder="Team Name"
              />
              <div className="text-xs font-mono text-slate-400 w-8 text-right">
                {team.score}
              </div>
              <button
                onClick={() => removeTeam(team.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <Button
          onClick={addTeam}
          className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 hover:border-brand-blue-primary hover:text-brand-blue-primary"
          variant="ghost"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Team
        </Button>
      </div>
    </div>
  );
};
