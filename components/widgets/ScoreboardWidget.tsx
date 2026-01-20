import React, { useEffect, useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import {
  WidgetData,
  ScoreboardConfig,
  ScoreboardTeam,
  RandomConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../types';
import { useScaledFont } from '../../hooks/useScaledFont';
import {
  Plus,
  Minus,
  Trash2,
  Users,
  RefreshCw,
  Trophy,
  Download,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../common/Button';

const DEFAULT_TEAMS: ScoreboardTeam[] = [
  { id: 'team-a', name: 'Team A', score: 0, color: 'bg-blue-500' },
  { id: 'team-b', name: 'Team B', score: 0, color: 'bg-red-500' },
];

const TEAM_COLORS = [
  'bg-blue-500',
  'bg-red-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-teal-600', // Changed from 500 to 600 per review
  'bg-cyan-500',
];

const COLOR_STYLES: Record<
  string,
  { label: string; score: string; button: string }
> = {
  'bg-blue-500': {
    label: 'text-blue-600',
    score: 'text-blue-700',
    button: 'text-blue-700',
  },
  'bg-red-500': {
    label: 'text-red-600',
    score: 'text-red-700',
    button: 'text-red-700',
  },
  'bg-green-500': {
    label: 'text-green-600',
    score: 'text-green-700',
    button: 'text-green-700',
  },
  'bg-yellow-500': {
    label: 'text-yellow-600',
    score: 'text-yellow-700',
    button: 'text-yellow-700',
  },
  'bg-purple-500': {
    label: 'text-purple-600',
    score: 'text-purple-700',
    button: 'text-purple-700',
  },
  'bg-pink-500': {
    label: 'text-pink-600',
    score: 'text-pink-700',
    button: 'text-pink-700',
  },
  'bg-indigo-500': {
    label: 'text-indigo-600',
    score: 'text-indigo-700',
    button: 'text-indigo-700',
  },
  'bg-orange-500': {
    label: 'text-orange-600',
    score: 'text-orange-700',
    button: 'text-orange-700',
  },
  'bg-teal-600': {
    label: 'text-teal-600',
    score: 'text-teal-700',
    button: 'text-teal-700',
  },
  'bg-cyan-500': {
    label: 'text-cyan-600',
    score: 'text-cyan-700',
    button: 'text-cyan-700',
  },
};

const getStyles = (colorClass: string) => {
  return (
    COLOR_STYLES[colorClass] ?? {
      label: 'text-slate-600',
      score: 'text-slate-700',
      button: 'text-slate-700',
    }
  );
};

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

  const updateScore = (teamId: string, delta: number) => {
    const newTeams = teams.map((t) =>
      t.id === teamId ? { ...t, score: Math.max(0, t.score + delta) } : t
    );
    updateWidget(widget.id, {
      config: { ...config, teams: newTeams },
    });
  };

  // Re-integrated dynamic font scaling for the grid layout
  const scoreFontSize = useScaledFont(widget.w, widget.h, 0.5, 24, 120);

  return (
    <div
      className={`grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] auto-rows-[1fr] h-full gap-2 p-2 bg-transparent overflow-y-auto font-${globalStyle.fontFamily}`}
    >
      {teams.map((team) => {
        // Parse color base for backgrounds

        const colorClass = team.color ?? 'bg-blue-500';

        const styles = getStyles(colorClass);

        return (
          <div
            key={team.id}
            className={`flex flex-col items-center justify-center ${colorClass}/20 rounded-2xl p-2 border border-white/20 relative group`}
          >
            <div
              className={`text-[10px] font-black uppercase tracking-widest ${styles.label} mb-1 text-center line-clamp-1 w-full px-2`}
            >
              {team.name}
            </div>

            <div
              className={`text-4xl lg:text-5xl font-black ${styles.score} mb-2 tabular-nums drop-shadow-sm`}
              style={{ fontSize: `${scoreFontSize}px`, lineHeight: 1 }}
            >
              {team.score}
            </div>

            <div className="flex gap-2 opacity-100 transition-opacity">
              <button
                onClick={() => updateScore(team.id, -1)}
                className={`p-1.5 bg-white/40 ${styles.button} rounded-lg shadow-sm hover:bg-white/60 active:scale-95 transition-all`}
              >
                <Minus className="w-4 h-4" />
              </button>

              <button
                onClick={() => updateScore(team.id, 1)}
                className={`p-1.5 ${colorClass} text-white rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {teams.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center text-slate-400 gap-2">
          <Trophy className="w-8 h-8 opacity-20" />

          <span className="text-xs font-bold uppercase tracking-widest">
            No Teams
          </span>
        </div>
      )}
    </div>
  );
};

export const ScoreboardSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard, addToast } = useDashboard();
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

    // Check if result is groups (array of objects with names array)
    if (
      Array.isArray(lastResult) &&
      lastResult.length > 0 &&
      typeof lastResult[0] === 'object' &&
      lastResult[0] !== null &&
      'names' in lastResult[0]
    ) {
      const groups = lastResult as { names: string[] }[];
      const newTeams: ScoreboardTeam[] = groups.map((g, i) => ({
        id: crypto.randomUUID(),
        name: `Group ${i + 1}`,
        score: 0,
        color: TEAM_COLORS[i % TEAM_COLORS.length],
      }));

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

  const handleExport = () => {
    const csvHeader = 'Team,Score\n';
    const csvRows = teams
      .map((t) => `"${t.name.replace(/"/g, '""')}",${t.score}`)
      .join('\n');
    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Scoreboard_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast('Scores exported to CSV', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-900">
            <Users className="w-4 h-4" />
            <span className="text-xs  uppercase tracking-wider">
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
          <div className="text-[10px] text-indigo-400 ">
            Tip: Add a Randomizer widget and create groups to import them here.
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-[10px]  text-slate-400 uppercase tracking-widest block">
            Teams ({teams.length})
          </label>
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
              <input
                value={team.name}
                onChange={(e) => updateTeamName(team.id, e.target.value)}
                className="flex-1 text-xs  text-slate-700 bg-transparent outline-none"
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

      <div className="pt-4 border-t border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Actions
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={resetScores}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Scores
          </Button>
          <Button
            onClick={handleExport}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
};
