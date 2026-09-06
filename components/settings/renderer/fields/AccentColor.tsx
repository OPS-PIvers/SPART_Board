import React from 'react';
import type { AccentColorField } from '../../schema/types';
import type { FieldProps } from '../FieldProps';
import { AccentColorSettings } from '@/components/common/AccentColorSettings';
import { resolveLabel } from '../resolveLabel';

const DEFAULT_FALLBACK = '#334155';

// Thin wrapper over the shared accent-color picker (presets + custom + clear-to-default).
export const AccentColor: React.FC<FieldProps<AccentColorField<string>>> = ({
  field,
  value,
  onChange,
  id,
  describedBy,
  disabled,
  ctx,
}) => {
  const label = resolveLabel(ctx.t, ctx.widget.type, field.label);
  const current = typeof value === 'string' ? value : undefined;

  return (
    <div id={id} aria-describedby={describedBy} role="group" aria-label={label}>
      <fieldset disabled={disabled} className="contents">
        <AccentColorSettings
          label={label}
          value={current}
          fallback={DEFAULT_FALLBACK}
          onChange={(color) => onChange(color)}
        />
      </fieldset>
    </div>
  );
};
