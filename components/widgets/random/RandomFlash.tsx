import React from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { DEFAULT_GLOBAL_STYLE } from '../../../types';

interface RandomFlashProps {
  displayResult: string | string[] | string[][] | null;
  isSpinning: boolean;
  fontSize?: number | string;
}

export const RandomFlash: React.FC<RandomFlashProps> = ({
  displayResult,
  isSpinning,
  fontSize,
}) => {
  const { activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;

  const fontStyle = typeof fontSize === 'number' ? `${fontSize}px` : fontSize;

  return (
    <div
      className={`text-center font-bold px-4 transition-all duration-300 w-full flex items-center justify-center font-${globalStyle.fontFamily} ${
        isSpinning
          ? 'scale-90 opacity-30 grayscale'
          : 'scale-100 text-brand-blue-primary drop-shadow-xl'
      }`}
      style={{ fontSize: fontStyle, height: '100%' }}
    >
      <span className="max-w-full break-words leading-tight uppercase">
        {(displayResult as string) ?? 'Ready?'}
      </span>
    </div>
  );
};
