import React from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { DEFAULT_GLOBAL_STYLE } from '../../../types';
import { PASTEL_PALETTE } from '../../../config/colors';

const WHEEL_COLORS = PASTEL_PALETTE;

interface RandomWheelProps {
  students: string[];
  rotation: number;
  wheelSize?: number;
  displayResult: string | string[] | string[][] | null;
  isSpinning: boolean;
  fontSize?: number;
}

export const RandomWheel: React.FC<RandomWheelProps> = ({
  students,
  rotation,
  wheelSize,
  displayResult,
  isSpinning,
  fontSize: resultFontSize,
}) => {
  const { activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const radius = 120;
  const centerX = 150;
  const centerY = 150;
  const totalNames = students.length;
  const sliceAngle = 360 / totalNames;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center p-2 overflow-hidden font-${globalStyle.fontFamily} font-${globalStyle.fontWeight ?? 'bold'}`}
    >
      {/* Static Pointer Arrow (Top Center) */}

      <div className="absolute top-2 z-20 flex flex-col items-center">
        <div
          className="w-10 h-8 bg-red-600 shadow-lg"
          style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }}
        ></div>
      </div>

      <svg
        viewBox="0 0 300 300"
        className="w-full h-full drop-shadow-2xl transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1)"
        style={{
          transform: `rotate(${rotation}deg)`,
          maxWidth: wheelSize,
          maxHeight: wheelSize,
        }}
      >
        {students.map((name, i) => {
          const startAngle = i * sliceAngle;
          const endAngle = (i + 1) * sliceAngle;

          // Path calculation
          const x1 =
            centerX + radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
          const y1 =
            centerY + radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
          const x2 =
            centerX + radius * Math.cos((Math.PI * (endAngle - 90)) / 180);
          const y2 =
            centerY + radius * Math.sin((Math.PI * (endAngle - 90)) / 180);

          const largeArcFlag = sliceAngle > 180 ? 1 : 0;
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z',
          ].join(' ');

          // Radial Text Position: Mid-angle of the slice
          const midAngle = startAngle + sliceAngle / 2;

          // Dynamic Font Scaling
          const nameFactor = Math.max(1, name.length / 10);
          const classFactor = Math.max(1, totalNames / 15);
          const fontSize = Math.max(
            5,
            14 / (nameFactor * 0.4 + classFactor * 0.6)
          );

          return (
            <g key={i}>
              <path
                d={pathData}
                fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
                stroke="white"
                strokeWidth="1"
              />
              {/* Radial Label Group */}
              <g transform={`rotate(${midAngle}, ${centerX}, ${centerY})`}>
                <text
                  x={centerX + radius * 0.85}
                  y={centerY}
                  fill="white"
                  fontSize={fontSize}
                  fontWeight="700"
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="select-none pointer-events-none drop-shadow-sm uppercase tracking-tighter"
                  transform={`rotate(90, ${centerX + radius * 0.85}, ${centerY})`}
                >
                  {name}
                </text>
              </g>
            </g>
          );
        })}
        {/* Center Cap */}
        <circle
          cx={centerX}
          cy={centerY}
          r="8"
          fill="white"
          className="shadow-md"
        />
      </svg>

      {/* Winner Result Overlay (Only when not spinning) */}
      {!isSpinning && displayResult && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 z-30">
          <div
            className="bg-white/95 backdrop-blur px-8 py-4 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border-4 border-indigo-500  text-indigo-900 animate-bounce text-center max-w-full break-words"
            style={{
              fontSize: `${resultFontSize ?? 24}px`,
              lineHeight: 1.1,
            }}
          >
            {displayResult as string}
          </div>
        </div>
      )}
    </div>
  );
};
