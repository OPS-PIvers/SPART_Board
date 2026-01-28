import React from 'react';

interface TimeToolVisualProps {
  /**
   * Progress of the timer, from 0 to 1.
   * 1 means full circle, 0 means empty.
   */
  progress: number;

  /**
   * Hex color string for the progress stroke.
   */
  color: string;
}

const VIEWBOX_SIZE = 220;
const CENTER = VIEWBOX_SIZE / 2;
const RADIUS = 95;
const STROKE_WIDTH = 10;
// 2 * PI * R
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const TimeToolVisual: React.FC<TimeToolVisualProps> = ({
  progress,
  color,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  // Calculate offset.
  // Full circle (progress 1) -> offset 0
  // Empty circle (progress 0) -> offset CIRCUMFERENCE
  const strokeDashoffset = CIRCUMFERENCE - clampedProgress * CIRCUMFERENCE;

  return (
    <svg
      className="absolute"
      width={VIEWBOX_SIZE}
      height={VIEWBOX_SIZE}
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      role="timer-visual"
      aria-label="Timer progress indicator"
    >
      <circle
        className="opacity-10"
        stroke="currentColor"
        strokeWidth={STROKE_WIDTH}
        fill="transparent"
        r={RADIUS}
        cx={CENTER}
        cy={CENTER}
      />
      <circle
        className="transition-all duration-300"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        fill="transparent"
        r={RADIUS}
        cx={CENTER}
        cy={CENTER}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={strokeDashoffset}
        style={{
          transform: 'rotate(-90deg)',
          transformOrigin: '50% 50%',
        }}
      />
    </svg>
  );
};
