import React from 'react';
import { WidgetData, CatalystInstructionConfig } from '../../types';
import { DraggableWindow } from '../common/DraggableWindow';
import { useDashboard } from '../../context/useDashboard';

export const CatalystInstructionWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const {
    updateWidget,
    removeWidget,
    duplicateWidget,
    bringToFront,
    addToast,
  } = useDashboard();

  // In our system, the "data" equivalent is widget.config
  const config = widget.config as CatalystInstructionConfig;
  const title = config.title ?? 'Instruction Guide';
  const instructions = config.instructions ?? '';

  return (
    <DraggableWindow
      widget={widget}
      title={`Guide: ${title}`}
      settings={<CatalystInstructionSettings widget={widget} />}
      updateWidget={updateWidget}
      removeWidget={removeWidget}
      duplicateWidget={duplicateWidget}
      bringToFront={bringToFront}
      addToast={addToast}
      globalStyle={{
        fontFamily: 'sans',
        windowTransparency: 0.8,
        windowBorderRadius: '2xl',
        dockTransparency: 0.4,
        dockBorderRadius: 'full',
        dockTextColor: '#334155',
        dockTextShadow: false,
      }}
    >
      <div className="p-6 bg-yellow-50 h-full overflow-y-auto text-slate-800 font-serif leading-relaxed">
        <h3 className="text-xl font-bold mb-4 text-slate-900 border-b border-yellow-200 pb-2">
          {title}
        </h3>
        <div className="whitespace-pre-line text-sm">{instructions}</div>
      </div>
    </DraggableWindow>
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
