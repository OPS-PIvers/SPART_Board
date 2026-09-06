import React from 'react';
import type { FontFamilyField } from '../../schema/types';
import type { FieldProps } from '../FieldProps';
import { TypographySettings } from '@/components/common/TypographySettings';

type FontFamilyShimConfig = { fontFamily?: string };

// Thin wrapper: renders only the font-family swatch grid (no color picker — that's a separate `color` field).
export const FontFamily: React.FC<FieldProps<FontFamilyField<string>>> = ({
  value,
  onChange,
  id,
  describedBy,
  disabled,
}) => {
  const shimConfig: FontFamilyShimConfig = {
    fontFamily: typeof value === 'string' ? value : undefined,
  };
  const updateConfigShim = (patch: Partial<FontFamilyShimConfig>) => {
    onChange(patch.fontFamily);
  };

  return (
    <div id={id} aria-describedby={describedBy}>
      <fieldset disabled={disabled} className="contents">
        <TypographySettings
          config={shimConfig}
          updateConfig={updateConfigShim}
          showColorPicker={false}
        />
      </fieldset>
    </div>
  );
};
