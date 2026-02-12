import React from 'react';
import { ScoreboardTeam } from '../../types';
import { Plus, Minus } from 'lucide-react';

const TEAM_COLORS = [
  'bg-blue-500',
  'bg-red-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-orange-500',
  'bg-teal-600',
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

export const ScoreboardItem = React.memo(
  ({
    team,
    onUpdateScore,
  }: {
    team: ScoreboardTeam;
    onUpdateScore: (id: string, delta: number) => void;
  }) => {
    const colorClass = team.color ?? 'bg-blue-500';
    const styles = getStyles(colorClass);

    return (
      <div
        className={`flex flex-col items-center justify-center ${colorClass}/20 rounded-2xl border border-slate-200 relative group transition-all hover:shadow-md`}
        style={{ containerType: 'size', padding: 'min(8px, 2cqmin)' }}
      >
        <div
          className={`font-black uppercase tracking-widest ${styles.label} text-center line-clamp-1 w-full`}
          style={{
            fontSize: 'min(24px, 8cqmin)',
            marginBottom: 'min(4px, 1cqmin)',
            paddingLeft: 'min(8px, 2cqmin)',
            paddingRight: 'min(8px, 2cqmin)',
          }}
        >
          {team.name}
        </div>
        <div
          className={`font-black ${styles.score} tabular-nums drop-shadow-sm`}
          style={{
            fontSize: 'min(150px, 40cqmin)',
            lineHeight: 1,
            marginBottom: 'min(8px, 2cqmin)',
          }}
        >
          {team.score}
        </div>
        <div
          className="flex opacity-100 transition-opacity"
          style={{ gap: 'min(8px, 2cqmin)' }}
        >
          <button
            onClick={() => onUpdateScore(team.id, -1)}
            aria-label="Decrease score"
            className={`bg-white ${styles.button} rounded-lg shadow-sm hover:bg-slate-50 active:scale-95 transition-all`}
            style={{ padding: 'min(6px, 1.5cqmin)' }}
          >
            <Minus
              style={{
                width: 'min(16px, 4cqmin)',
                height: 'min(16px, 4cqmin)',
              }}
            />
          </button>
          <button
            onClick={() => onUpdateScore(team.id, 1)}
            aria-label="Increase score"
            className={`${colorClass} text-white rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all`}
            style={{ padding: 'min(6px, 1.5cqmin)' }}
          >
            <Plus
              style={{
                width: 'min(16px, 4cqmin)',
                height: 'min(16px, 4cqmin)',
              }}
            />
          </button>
        </div>
      </div>
    );
  }
);

ScoreboardItem.displayName = 'ScoreboardItem';

export { TEAM_COLORS };
