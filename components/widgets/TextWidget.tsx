import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetData } from '../../types';
import { FileText, MessageSquare, ShieldCheck, Star } from 'lucide-react';

export const TextWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const { content, bgColor, fontSize } = widget.config;

  return (
    <div
      className="h-full w-full p-4 font-handwritten outline-none transition-colors overflow-y-auto custom-scrollbar"
      style={{ backgroundColor: bgColor, fontSize: `${fontSize}px` }}
      contentEditable
      onBlur={(e) =>
        updateWidget(widget.id, {
          config: { ...widget.config, content: e.currentTarget.innerHTML },
        })
      }
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export const TextSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const colors = ['#fef9c3', '#dcfce7', '#dbeafe', '#fce7f3', '#f3f4f6'];

  const templates = [
    {
      name: 'Integrity Code',
      icon: ShieldCheck,
      content:
        '<b>The Integrity Code</b><br/>I promise that the work I am doing today is my own. I have not received unauthorized help, and I will not share assessment details with others.<br/><br/><i>Signed: ________________</i>',
    },
    {
      name: 'Spartan Scholar',
      icon: Star,
      content:
        '<b>Spartan Scholar Code</b><br/>• I am ready to learn.<br/>• I respect my peers.<br/>• I strive for excellence.<br/>• I own my actions.',
    },
    {
      name: 'Speaking Frames',
      icon: MessageSquare,
      content:
        '<b>Speaking Scaffolds</b><br/>• I agree with ___ because...<br/>• I respectfully disagree with ___ since...<br/>• To build on what ___ said...<br/>• Can you explain what you meant by...?',
    },
    {
      name: 'Writing Frame',
      icon: FileText,
      content:
        "<b>Summary Frame</b><br/>In today's lesson, we learned about ____. One important detail was ____. This is significant because ____.",
    },
  ];

  const applyTemplate = (content: string) => {
    updateWidget(widget.id, { config: { ...widget.config, content } });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Templates
        </label>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                applyTemplate(t.content);
              }}
              className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-all"
            >
              <t.icon className="w-3 h-3 text-indigo-500" />
              <span className="text-[9px] font-bold text-slate-700">
                {t.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Background Color
        </label>
        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...widget.config, bgColor: c },
                })
              }
              className={`w-8 h-8 rounded-full border-2 transition-all ${widget.config.bgColor === c ? 'border-blue-600 scale-110 shadow-md' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Font Size
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="12"
            max="48"
            value={widget.config.fontSize}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...widget.config,
                  fontSize: parseInt(e.target.value),
                },
              })
            }
            className="flex-1 accent-blue-600"
          />
          <span className="w-8 text-center font-mono font-bold text-slate-700 text-xs">
            {widget.config.fontSize}
          </span>
        </div>
      </div>
    </div>
  );
};
