import React from 'react';
import { WidgetType } from '../../../types';
import { TOOLS } from '../../../config/tools';

interface QuickAccessButtonProps {
  type: WidgetType;
  onClick: () => void;
}

export const QuickAccessButton: React.FC<QuickAccessButtonProps> = ({
  type,
  onClick,
}) => {
  const tool = TOOLS.find((t) => t.type === type);
  if (!tool) return null;

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`w-12 h-12 flex items-center justify-center ${tool.color} text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all ring-2 ring-white/20`}
      >
        <tool.icon className="w-6 h-6" />
      </button>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 bg-slate-800 text-white text-xxs font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-modal shadow-2xl border border-white/10 scale-90 group-hover:scale-100">
        {tool.label}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
};
