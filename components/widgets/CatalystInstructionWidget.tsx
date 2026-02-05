import React from 'react';
import { WidgetData, CatalystInstructionConfig } from '../../types';

export const CatalystInstructionWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const config = widget.config as CatalystInstructionConfig;
  const title = config.title ?? 'Instruction Guide';
  const instructions = config.instructions ?? '';

  return (
    <div className="p-3 bg-yellow-50 h-full overflow-y-auto text-slate-800 font-serif leading-relaxed">
      <h3 className="text-xl font-bold mb-3 text-slate-900 border-b border-yellow-200 pb-2">
        {title}
      </h3>
      <div className="whitespace-pre-line text-sm">{instructions}</div>
    </div>
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
