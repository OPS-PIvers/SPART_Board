import React from 'react';

interface RandomFlashProps {
  displayResult: string | string[] | string[][] | null;
  isSpinning: boolean;
  fontSize?: number;
}

export const RandomFlash: React.FC<RandomFlashProps> = ({
  displayResult,
  isSpinning,
  fontSize,
}) => {
  return (
    <div
      className={`text-center font-bold px-4 transition-all duration-300 w-full flex items-center justify-center ${
        isSpinning
          ? 'scale-90 opacity-30 grayscale'
          : 'scale-100 text-brand-blue-primary drop-shadow-xl'
      }`}
      style={{ fontSize: `${fontSize}px`, height: '100%' }}
    >
      <span className="max-w-full break-words leading-tight uppercase">
        {(displayResult as string) ?? 'Ready?'}
      </span>
    </div>
  );
};
