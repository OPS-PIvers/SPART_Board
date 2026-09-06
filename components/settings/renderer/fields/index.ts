import type React from 'react';
import type { Field } from '../../schema/types';
import type { FieldProps } from '../FieldProps';
import { UnsupportedField } from './UnsupportedField';

/** Total registry over the field union; items 1a.2-1a.4 replace their own lines. */
export const FIELD_COMPONENTS: Record<Field['type'], React.FC<FieldProps>> = {
  toggle: UnsupportedField,
  text: UnsupportedField,
  textarea: UnsupportedField,
  number: UnsupportedField,
  select: UnsupportedField,
  segmented: UnsupportedField,
  slider: UnsupportedField,
  color: UnsupportedField,
  fontFamily: UnsupportedField,
  textSizePreset: UnsupportedField,
  accentColor: UnsupportedField,
  surfaceColor: UnsupportedField,
  iconPicker: UnsupportedField,
  emojiPicker: UnsupportedField,
  imageUpload: UnsupportedField,
  soundPicker: UnsupportedField,
  rosterPicker: UnsupportedField,
  list: UnsupportedField,
  custom: UnsupportedField,
};
