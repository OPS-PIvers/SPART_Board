import type React from 'react';
import type { Field } from '../../schema/types';
import type { FieldProps } from '../FieldProps';
import { UnsupportedField } from './UnsupportedField';
import { ToggleField } from './Toggle';
import { TextField } from './Text';
import { TextareaField } from './Textarea';
import { NumberField } from './Number';
import { SelectField } from './Select';
import { SegmentedField } from './Segmented';
import { SliderField } from './Slider';

/** Total registry over the field union; items 1a.2-1a.4 replace their own lines. */
export const FIELD_COMPONENTS: Record<Field['type'], React.FC<FieldProps>> = {
  toggle: ToggleField as React.FC<FieldProps>,
  text: TextField as React.FC<FieldProps>,
  textarea: TextareaField as React.FC<FieldProps>,
  number: NumberField as React.FC<FieldProps>,
  select: SelectField as React.FC<FieldProps>,
  segmented: SegmentedField as React.FC<FieldProps>,
  slider: SliderField as React.FC<FieldProps>,
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
