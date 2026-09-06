import React from 'react';
import type { SurfaceColorField } from '../../schema/types';
import type { FieldProps } from '../FieldProps';
import { SurfaceColorSettings } from '@/components/common/SurfaceColorSettings';
import { resolveLabel } from '../resolveLabel';

type SurfaceColorShimConfig = { cardColor?: string; cardOpacity?: number };

// Thin wrapper over the shared surface color+opacity picker; opacity writes a second key via updateConfig.
export const SurfaceColor: React.FC<FieldProps<SurfaceColorField<string>>> = ({
  field,
  value,
  onChange,
  id,
  describedBy,
  labelId,
  disabled,
  ctx,
  updateConfig,
}) => {
  const opacityKey = field.opacityKey ?? 'cardOpacity';
  const rawOpacity = ctx.config[opacityKey];

  const shimConfig: SurfaceColorShimConfig = {
    cardColor: typeof value === 'string' ? value : undefined,
    cardOpacity: typeof rawOpacity === 'number' ? rawOpacity : undefined,
  };

  const updateConfigShim = (patch: Partial<SurfaceColorShimConfig>) => {
    if ('cardColor' in patch) onChange(patch.cardColor);
    if ('cardOpacity' in patch)
      updateConfig?.({ [opacityKey]: patch.cardOpacity });
  };

  return (
    <div id={id}>
      <fieldset disabled={disabled} className="contents">
        <SurfaceColorSettings
          config={shimConfig}
          updateConfig={updateConfigShim}
          label={resolveLabel(ctx.t, ctx.widget.type, field.label)}
          hideLabel
          labelId={labelId}
          describedBy={describedBy}
        />
      </fieldset>
    </div>
  );
};
