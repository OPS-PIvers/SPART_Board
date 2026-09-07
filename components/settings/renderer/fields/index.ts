import type React from 'react';
import type { Field } from '../../schema/types';
import type { FieldProps } from '../FieldProps';
import { ToggleField } from './Toggle';
import { TextField } from './Text';
import { TextareaField } from './Textarea';
import { NumberField } from './Number';
import { SelectField } from './Select';
import { SegmentedField } from './Segmented';
import { SliderField } from './Slider';
import { Color } from './Color';
import { FontFamily } from './FontFamily';
import { TextSizePreset } from './TextSizePreset';
import { AccentColor } from './AccentColor';
import { SurfaceColor } from './SurfaceColor';
import { List } from './List';
import { Custom } from './Custom';
import { IconPicker } from './IconPicker';
import { EmojiPicker } from './EmojiPicker';
import { ImageUpload } from './ImageUpload';
import { SoundPicker } from './SoundPicker';
import { RosterPicker } from './RosterPicker';

/** Total registry over the field union. */
export const FIELD_COMPONENTS: Record<Field['type'], React.FC<FieldProps>> = {
  toggle: ToggleField as React.FC<FieldProps>,
  text: TextField as React.FC<FieldProps>,
  textarea: TextareaField as React.FC<FieldProps>,
  number: NumberField as React.FC<FieldProps>,
  select: SelectField as React.FC<FieldProps>,
  segmented: SegmentedField as React.FC<FieldProps>,
  slider: SliderField as React.FC<FieldProps>,
  color: Color as React.FC<FieldProps>,
  fontFamily: FontFamily as React.FC<FieldProps>,
  textSizePreset: TextSizePreset as React.FC<FieldProps>,
  accentColor: AccentColor as React.FC<FieldProps>,
  surfaceColor: SurfaceColor as React.FC<FieldProps>,
  iconPicker: IconPicker as React.FC<FieldProps>,
  emojiPicker: EmojiPicker as React.FC<FieldProps>,
  imageUpload: ImageUpload as React.FC<FieldProps>,
  soundPicker: SoundPicker as React.FC<FieldProps>,
  rosterPicker: RosterPicker as React.FC<FieldProps>,
  list: List,
  custom: Custom,
};
