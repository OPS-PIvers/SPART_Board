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
        style={{ containerType: 'size', padding: 'min(4px, 1cqmin)' }}
      >
        <div
          className={`font-black uppercase tracking-widest ${styles.label} text-center line-clamp-1 w-full`}
          style={{
            fontSize: 'min(15cqh, 80cqw)',
            marginBottom: 'min(2cqh, 1cqmin)',
            paddingLeft: 'min(8px, 2cqw)',
            paddingRight: 'min(8px, 2cqw)',
          }}
        >
          {team.name}
        </div>
        <div
          className={`font-black ${styles.score} tabular-nums drop-shadow-sm`}
          style={{
            fontSize: 'min(60cqh, 50cqw)',
            lineHeight: 1,
            marginBottom: 'min(4cqh, 2cqmin)',
          }}
        >
          {team.score}
        </div>
        <div
          className="flex opacity-100 transition-opacity"
          style={{ gap: 'min(12px, 3cqw)' }}
        >
          <button
            onClick={() => onUpdateScore(team.id, -1)}
            aria-label="Decrease score"
            className={`bg-white ${styles.button} rounded-lg shadow-sm hover:bg-slate-50 active:scale-95 transition-all`}
            style={{ padding: 'min(8px, 2cqh)' }}
          >
            <Minus
              style={{
                width: 'min(12cqh, 6cqw)',
                height: 'min(12cqh, 6cqw)',
              }}
            />
          </button>
          <button
            onClick={() => onUpdateScore(team.id, 1)}
            aria-label="Increase score"
            className={`${colorClass} text-white rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all`}
            style={{ padding: 'min(8px, 2cqh)' }}
          >
            <Plus
              style={{
                width: 'min(12cqh, 6cqw)',
                height: 'min(12cqh, 6cqw)',
              }}
            />
          </button>
        </div>
      </div>
    );
  },
  (prev, next) => {
    // OPTIMIZATION: Custom equality check to prevent unnecessary re-renders.
    // The parent widget often recreates the 'team' object reference on every render (e.g. from Firestore/State),
    // even if the data hasn't changed. This check ensures we only re-render if actual content changes.
    // WARNING: If ScoreboardTeam interface changes, this check must be updated!
    return (
      prev.team.id === next.team.id &&
      prev.team.name === next.team.name &&
      prev.team.score === next.team.score &&
      prev.team.color === next.team.color &&
      prev.team.linkedGroupId === next.team.linkedGroupId &&
      prev.onUpdateScore === next.onUpdateScore
    );
  }
);

ScoreboardItem.displayName = 'ScoreboardItem';

export { TEAM_COLORS };
