import React from 'react';
import type {
  FieldCtx,
  UpdateConfig,
} from '@/components/settings/schema/types';
import { sanitizeHtml } from '@/utils/security';
import { TEXT_WIDGET_TEMPLATES } from './constants';

type TemplateGridProps = {
  ctx: FieldCtx & { updateConfig: UpdateConfig };
};

// Module-level component the schema's Custom field renders — ctx.updateConfig is mount-stable.
export const TemplateGrid: React.FC<TemplateGridProps> = ({ ctx }) => {
  const groupLabel = ctx.t('widgetSettings.text.templates');

  return (
    <div
      className="grid grid-cols-2 gap-2"
      role="group"
      aria-label={groupLabel}
    >
      {TEXT_WIDGET_TEMPLATES.map((template) => (
        <button
          key={template.name}
          type="button"
          onClick={() =>
            ctx.updateConfig({ content: sanitizeHtml(template.content) })
          }
          className="flex items-center gap-2 p-2 bg-white border border-slate-200 rounded-lg text-left hover:bg-slate-50 transition-all"
        >
          <template.icon className="w-3 h-3 text-indigo-600" />
          <span className="text-xxs text-slate-800">{template.name}</span>
        </button>
      ))}
    </div>
  );
};
