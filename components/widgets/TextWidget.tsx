
import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetData } from '../../types';

export const TextWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const { content, bgColor, fontSize } = widget.config;

  return (
    <div 
      className="h-full w-full p-4 font-handwritten outline-none transition-colors"
      style={{ backgroundColor: bgColor, fontSize: `${fontSize}px` }}
      contentEditable
      onBlur={(e) => updateWidget(widget.id, { config: { ...widget.config, content: e.currentTarget.innerHTML } })}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export const TextSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const colors = ['#fef9c3', '#dcfce7', '#dbeafe', '#fce7f3', '#f3f4f6'];

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Background Color</label>
        <div className="flex gap-2">
          {colors.map(c => (
            <button 
              key={c}
              onClick={() => updateWidget(widget.id, { config: { ...widget.config, bgColor: c } })}
              className={`w-8 h-8 rounded-full border-2 transition-all ${widget.config.bgColor === c ? 'border-blue-600 scale-110 shadow-md' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Font Size</label>
        <input 
          type="range" min="12" max="48" 
          value={widget.config.fontSize}
          onChange={(e) => updateWidget(widget.id, { config: { ...widget.config, fontSize: parseInt(e.target.value) } })}
          className="w-full accent-blue-600"
        />
      </div>
    </div>
  );
};
