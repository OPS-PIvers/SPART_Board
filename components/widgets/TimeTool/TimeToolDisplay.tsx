import React from 'react';
import { WidgetData, TimeToolConfig } from '../../../types';
import { STANDARD_COLORS } from '../../../config/colors';
import { useTimeToolTicker } from './useTimeTool';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatTimer = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatStopwatch = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  const ms = Math.floor((totalSeconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
};

// ─── Progress Ring ──────────────────────────────────────────────────────────

const ProgressRing: React.FC<{
  progress: number; // 0 to 1
  ringColor: string;
}> = ({ progress, ringColor }) => {
  const CIRCUMFERENCE = 2 * Math.PI * 95;
  const offset = CIRCUMFERENCE - progress * CIRCUMFERENCE;

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 220 220"
      preserveAspectRatio="xMidYMid meet"
    >
      <circle
        className="opacity-5"
        stroke="currentColor"
        strokeWidth="12"
        fill="transparent"
        r="95"
        cx="110"
        cy="110"
      />
      <circle
        className="transition-all duration-100 ease-linear"
        stroke={ringColor}
        strokeWidth="12"
        strokeLinecap="round"
        fill="transparent"
        r="95"
        cx="110"
        cy="110"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
    </svg>
  );
};

// ─── Component ──────────────────────────────────────────────────────────────

interface TimeToolDisplayProps {
  widget: WidgetData;
  onStop: (finalTime: number) => void;
  onEdit: () => void;
}

export const TimeToolDisplay: React.FC<TimeToolDisplayProps> = ({
  widget,
  onStop,
  onEdit,
}) => {
  const config = widget.config as TimeToolConfig;
  const displayTime = useTimeToolTicker(widget, onStop);

  const { mode, duration, theme, visualType, isRunning } = config;
  const isVisual = visualType === 'visual';

  const getTimeColor = () => {
    if (mode !== 'timer') return 'text-brand-blue-primary';
    if (displayTime <= 60) return 'text-brand-red-primary';
    if (duration > 0 && displayTime / duration <= 0.25) return 'text-amber-500';
    return theme === 'light' ? 'text-slate-900' : 'text-white';
  };

  const getRingColor = () => {
    if (displayTime <= 60) return STANDARD_COLORS.red;
    if (duration > 0 && displayTime / duration <= 0.25)
      return STANDARD_COLORS.amber;
    return STANDARD_COLORS.blue;
  };

  const progress =
    mode === 'timer' && duration > 0 ? displayTime / duration : 1;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4 py-2">
      {/* Time display area */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center">
        <div
          className="relative flex items-center justify-center"
          style={{
            width: isVisual ? 'min(90%, 90cqmin)' : 'auto',
            aspectRatio: isVisual ? '1' : undefined,
          }}
        >
          {isVisual && (
            <ProgressRing progress={progress} ringColor={getRingColor()} />
          )}
          <button
            onClick={() => {
              if (!isRunning && mode === 'timer') onEdit();
            }}
            disabled={isRunning || mode !== 'timer'}
            className={`relative z-10 tabular-nums select-none font-black font-sans leading-none transition-transform ${getTimeColor()} ${
              !isRunning && mode === 'timer'
                ? 'cursor-pointer hover:scale-105 active:scale-95'
                : 'cursor-default'
            }`}
            style={{
              fontSize: isVisual ? '28cqmin' : '45cqmin',
            }}
          >
            {mode === 'stopwatch'
              ? formatStopwatch(displayTime)
              : formatTimer(displayTime)}
          </button>
        </div>
      </div>
    </div>
  );
};
