import React from 'react';
import type { SurfaceColorField } from '../../schema/types';
import type { FieldProps } from '../FieldProps';
import { SurfaceColorSettings } from '@/components/common/SurfaceColorSettings';
import { useDashboard } from '@/context/useDashboard';
import { resolveLabel } from '../resolveLabel';

type SurfaceColorShimConfig = { cardColor?: string; cardOpacity?: number };

// Thin wrapper over the shared surface color+opacity picker.
// NOTE: `onChange` (from FieldProps) can only write `field.key` (the color half).
// `opacityKey` names a second, independent top-level config key that FieldProps has
// no write channel for, so the opacity half is written directly via `updateWidget`
// here. This is a stopgap documented in the item's `concerns`; a cleaner fix would
// give regular fields the same mount-stable `updateConfig` that `custom` fields get.
export const SurfaceColor: React.FC<FieldProps<SurfaceColorField<string>>> = ({
  field,
  value,
  onChange,
  id,
  describedBy,
  disabled,
  ctx,
}) => {
  const { updateWidget } = useDashboard();
  const opacityKey = field.opacityKey ?? 'cardOpacity';
  const rawOpacity = ctx.config[opacityKey];

  const shimConfig: SurfaceColorShimConfig = {
    cardColor: typeof value === 'string' ? value : undefined,
    cardOpacity: typeof rawOpacity === 'number' ? rawOpacity : undefined,
  };

  const updateConfigShim = (patch: Partial<SurfaceColorShimConfig>) => {
    if ('cardColor' in patch) onChange(patch.cardColor);
    if ('cardOpacity' in patch) {
      updateWidget(ctx.widget.id, {
        config: { ...ctx.widget.config, [opacityKey]: patch.cardOpacity },
      });
    }
  };

  return (
    <div id={id} aria-describedby={describedBy}>
      <fieldset disabled={disabled} className="contents">
        <SurfaceColorSettings
          config={shimConfig}
          updateConfig={updateConfigShim}
          label={resolveLabel(ctx.t, ctx.widget.type, field.label)}
        />
      </fieldset>
    </div>
  );
};
