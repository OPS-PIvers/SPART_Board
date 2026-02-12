import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TextConfig, DEFAULT_GLOBAL_STYLE } from '../../types';
import { STICKY_NOTE_COLORS } from '../../config/colors';
import { sanitizeHtml } from '../../utils/security';

import { WidgetLayout } from './WidgetLayout';

export const TextWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as TextConfig;
  const {
    content = '',
    bgColor = STICKY_NOTE_COLORS.yellow,
    fontSize = 18,
  } = config;

  return (
    <WidgetLayout
      padding="p-0"
      header={
        <div
          className="w-full bg-slate-50/50 flex items-center justify-center border-b border-slate-100/50 cursor-move hover:bg-slate-100/80 transition-colors group/text-header"
          style={{ height: 'min(16px, 3.5cqmin)' }}
        >
          <div
            className="bg-slate-300/50 rounded-full group-hover/text-header:bg-slate-400/80 transition-colors"
            style={{
              width: 'min(32px, 8cqmin)',
              height: 'min(4px, 1cqmin)',
            }}
          />
        </div>
      }
      content={
        <div
          className={`h-full w-full font-${globalStyle.fontFamily} outline-none transition-colors overflow-y-auto custom-scrollbar bg-transparent relative`}
          style={{ padding: 'min(16px, 3.5cqmin)' }}
        >
          {/* Background color overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ backgroundColor: bgColor }}
          />
          <div
            className="relative z-10 h-full w-full outline-none"
            style={{
              fontSize: `min(${fontSize}px, ${fontSize * 0.5}cqmin)`,
              lineHeight: 1.5,
            }}
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: content }}
            onBlur={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  content: sanitizeHtml(e.currentTarget.innerHTML),
                } as TextConfig,
              })
            }
          />
        </div>
      }
    />
  );
};
