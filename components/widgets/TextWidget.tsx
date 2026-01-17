import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TextConfig } from '../../types';
import { FileText, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { STICKY_NOTE_COLORS } from '../../config/colors';

export const TextWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as TextConfig;
  const {
    content = '',
    bgColor = STICKY_NOTE_COLORS.yellow,
    fontSize = 18,
  } = config;

  return (
    <div
      className="h-full w-full p-4 font-handwritten outline-none transition-colors overflow-y-auto custom-scrollbar bg-transparent relative"
      contentEditable
      onBlur={(e) =>
        updateWidget(widget.id, {
          config: {
            ...config,
            content: e.currentTarget.innerHTML,
          } as TextConfig,
        })
      }
    >
      {/* Background color overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{ backgroundColor: bgColor }}
      />
      <div
        className="relative z-10 h-full w-full"
        style={{ fontSize: `${fontSize}px` }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export const TextSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as TextConfig;
  const colors = Object.values(STICKY_NOTE_COLORS);

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
    updateWidget(widget.id, { config: { ...config, content } as TextConfig });
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
              onClick={() => applyTemplate(t.content)}
              className="flex items-center gap-2 p-2 bg-white/50 border border-white/30 rounded-lg text-left hover:bg-white/70 transition-all"
            >
              <t.icon className="w-3 h-3 text-indigo-600" />
              <span className="text-[9px] font-bold text-slate-800">
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
                  config: { ...config, bgColor: c } as TextConfig,
                })
              }
              className={`w-8 h-8 rounded-full border-2 transition-all ${config.bgColor === c ? 'border-blue-600 scale-110 shadow-md' : 'border-transparent'}`}
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
            value={config.fontSize}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  fontSize: parseInt(e.target.value),
                } as TextConfig,
              })
            }
            className="flex-1 accent-blue-600"
          />
          <span className="w-8 text-center font-mono font-bold text-slate-700 text-xs">
            {config.fontSize}
          </span>
        </div>
      </div>
    </div>
  );
};
