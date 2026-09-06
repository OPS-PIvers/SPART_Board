import type React from 'react';
import type { Field } from '../../schema/types';
import type { FieldProps } from '../FieldProps';
import { UnsupportedField } from './UnsupportedField';
import { Color } from './Color';
import { FontFamily } from './FontFamily';
import { TextSizePreset } from './TextSizePreset';
import { AccentColor } from './AccentColor';
import { SurfaceColor } from './SurfaceColor';

/** Total registry over the field union; items 1a.2-1a.4 replace their own lines. */
export const FIELD_COMPONENTS: Record<Field['type'], React.FC<FieldProps>> = {
  toggle: UnsupportedField,
  text: UnsupportedField,
  textarea: UnsupportedField,
  number: UnsupportedField,
  select: UnsupportedField,
  segmented: UnsupportedField,
  slider: UnsupportedField,
  color: Color as React.FC<FieldProps>,
  fontFamily: FontFamily as React.FC<FieldProps>,
  textSizePreset: TextSizePreset as React.FC<FieldProps>,
  accentColor: AccentColor as React.FC<FieldProps>,
  surfaceColor: SurfaceColor as React.FC<FieldProps>,
  iconPicker: UnsupportedField,
  emojiPicker: UnsupportedField,
  imageUpload: UnsupportedField,
  soundPicker: UnsupportedField,
  rosterPicker: UnsupportedField,
  list: UnsupportedField,
  custom: UnsupportedField,
};
