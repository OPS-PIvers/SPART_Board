import React from 'react';
import { WidgetData, CatalystInstructionConfig } from '../../types';

import { WidgetLayout } from './WidgetLayout';

export const CatalystInstructionWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const config = widget.config as CatalystInstructionConfig;
  const title = config.title ?? 'Instruction Guide';
  const instructions = config.instructions ?? '';

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div className="p-4 bg-amber-50 h-full w-full overflow-y-auto text-slate-800 font-serif leading-relaxed custom-scrollbar shadow-inner">
          <h3 className="text-xl font-bold mb-3 text-slate-900 border-b border-amber-200 pb-2 uppercase tracking-tight">
            {title}
          </h3>
          <div className="whitespace-pre-line text-sm">{instructions}</div>
        </div>
      }
    />
  );
};

export const CatalystInstructionSettings: React.FC<{ widget: WidgetData }> = ({
  widget: _widget,
}) => {
  return (
    <div className="p-4 text-center">
      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
        Guide Mode Controls
      </p>
    </div>
  );
};
