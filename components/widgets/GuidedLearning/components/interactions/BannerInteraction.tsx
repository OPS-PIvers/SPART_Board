import React from 'react';
import { GuidedLearningPublicStep } from '@/types';

export const BannerInteraction: React.FC<{
  step: GuidedLearningPublicStep;
}> = ({ step }) => {
  if (!step.text) return null;
  return (
    <div
      className="absolute top-0 left-0 right-0 z-30 pointer-events-none"
      style={{ padding: 'min(12px, 3cqmin)' }}
    >
      <div
        className="mx-auto bg-slate-900/85 border border-white/20 text-white rounded-xl shadow-xl"
        style={{
          maxWidth: 'min(48rem, 90cqmin)',
          paddingInline: 'min(16px, 4cqmin)',
          paddingBlock: 'min(12px, 3cqmin)',
        }}
      >
        {step.label && (
          <div
            className="font-bold"
            style={{
              fontSize: 'min(14px, 5.5cqmin)',
              marginBottom: 'min(4px, 1cqmin)',
            }}
          >
            {step.label}
          </div>
        )}
        <div
          className="whitespace-pre-wrap"
          style={{ fontSize: 'min(14px, 5.5cqmin)' }}
        >
          {step.text}
        </div>
      </div>
    </div>
  );
};
