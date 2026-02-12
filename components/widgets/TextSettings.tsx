import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TextConfig } from '../../types';
import { STICKY_NOTE_COLORS } from '../../config/colors';
import { FileText, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { sanitizeHtml } from '../../utils/security';
import { SettingsLabel } from '../common/SettingsLabel';

export const TextSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as TextConfig;

  const colors = [
    { hex: STICKY_NOTE_COLORS.yellow, label: 'yellow' },
    { hex: STICKY_NOTE_COLORS.green, label: 'green' },
    { hex: STICKY_NOTE_COLORS.blue, label: 'blue' },
    { hex: STICKY_NOTE_COLORS.pink, label: 'pink' },
    { hex: STICKY_NOTE_COLORS.gray, label: 'gray' },
  ];

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
    updateWidget(widget.id, {
      config: { ...config, content: sanitizeHtml(content) } as TextConfig,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <SettingsLabel>Templates</SettingsLabel>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((t) => (
            <button
              key={t.name}
              onClick={() => applyTemplate(t.content)}
              className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-all"
            >
              <t.icon className="w-3 h-3 text-indigo-600" />
              <span className="text-xxs  text-slate-800">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <SettingsLabel>Background Color</SettingsLabel>
        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c.hex}
              aria-label={`Select ${c.label} background`}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, bgColor: c.hex } as TextConfig,
                })
              }
              className={`w-8 h-8 rounded-full border-2 transition-all ${config.bgColor === c.hex ? 'border-blue-600 scale-110 shadow-md' : 'border-transparent'}`}
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <SettingsLabel>Font Size</SettingsLabel>
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
          <span className="w-8 text-center font-mono  text-slate-700 text-xs">
            {config.fontSize}
          </span>
        </div>
      </div>
    </div>
  );
};
