import React from 'react';
import { Plus } from 'lucide-react';
import { useDashboard } from '@/context/useDashboard';
import { resolveLabel } from '../resolveLabel';
import type { FieldProps } from '../FieldProps';

// Card body: the inner control, plus an explanation and one-tap add while the partner is off the board.
export const PartnerWidget: React.FC<FieldProps> = ({
  field,
  ctx,
  id,
  labelId,
  renderField,
}) => {
  const { activeDashboard, addWidget } = useDashboard();
  if (field.type !== 'partnerWidget' || !renderField) return null;
  const partnerField = field;
  const present = !!activeDashboard?.widgets.some(
    (w) => w.type === partnerField.partner
  );
  const name = ctx.toolLabel?.(partnerField.partner) ?? partnerField.partner;
  return (
    <div
      id={id}
      role="group"
      aria-labelledby={labelId}
      data-partner={partnerField.partner}
      data-partner-present={present}
      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1"
    >
      {renderField(partnerField.control, !present)}
      {!present && (
        <div className="flex flex-col gap-2 pb-2">
          <p className="text-xxs text-slate-600">
            {resolveLabel(ctx.t, ctx.widget.type, partnerField.missingHelp)}
          </p>
          <button
            type="button"
            onClick={() => addWidget(partnerField.partner)}
            className="self-start inline-flex items-center gap-1.5 rounded-lg bg-brand-blue-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-blue-light focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-blue-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            {ctx.t('widgetSettings.common.partner.add', { name })}
          </button>
        </div>
      )}
    </div>
  );
};
