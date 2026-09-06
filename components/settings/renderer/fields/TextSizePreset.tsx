import React from 'react';
import type { TextSizePresetField } from '../../schema/types';
import type { FieldProps } from '../FieldProps';
import { TextSizePresetSettings } from '@/components/common/TextSizePresetSettings';
import type { TextSizePreset as TextSizePresetValue } from '@/types';

type TextSizePresetShimConfig = {
  textSizePreset?: TextSizePresetValue;
  scaleMultiplier?: number;
};

// Thin wrapper over the shared text-size preset selector.
export const TextSizePreset: React.FC<
  FieldProps<TextSizePresetField<string>>
> = ({ value, onChange, id, describedBy, labelId, disabled }) => {
  const shimConfig: TextSizePresetShimConfig = {
    textSizePreset:
      typeof value === 'string' ? (value as TextSizePresetValue) : undefined,
  };
  const updateConfigShim = (patch: Partial<TextSizePresetShimConfig>) => {
    onChange(patch.textSizePreset);
  };

  return (
    <div id={id}>
      <fieldset disabled={disabled} className="contents">
        <TextSizePresetSettings
          config={shimConfig}
          updateConfig={updateConfigShim}
          hideLabel
          labelId={labelId}
          describedBy={describedBy}
        />
      </fieldset>
    </div>
  );
};
