import React from 'react';
import { GuidedLearningPublicStep } from '@/types';

export const BannerInteraction: React.FC<{
  step: GuidedLearningPublicStep;
}> = ({ step }) => {
  if (!step.text) return null;
  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-3">
      <div className="mx-auto max-w-3xl bg-slate-900/85 border border-white/20 text-white rounded-xl px-4 py-3 shadow-xl">
        {step.label && (
          <div className="font-bold text-sm mb-1">{step.label}</div>
        )}
        <div className="text-sm whitespace-pre-wrap">{step.text}</div>
      </div>
    </div>
  );
};
