import type { ReactNode } from 'react';
import type { GlobalFeature, WidgetData } from '@/types';
import type { AppearanceKey } from '@/utils/widgetConfigPersistence';

/** Appearance keys a schema may list in `styleKeys` (membership checked at runtime). */
export type { AppearanceKey } from '@/utils/widgetConfigPersistence';

export type TranslateFn = (
  key: string,
  options?: Record<string, unknown>
) => string;

export type FieldCtx = {
  config: Record<string, unknown>;
  widget: WidgetData;
  isAdmin: boolean;
  canAccessFeature: (featureId: GlobalFeature) => boolean;
  t: TranslateFn;
};

/** Mount-stable config writer handed to `Custom.render`. */
export type UpdateConfig = (patch: Record<string, unknown>) => void;

/** Rejects dotted keys at compile time; top-level config keys only. */
export type NoDots<K extends string> = K extends `${string}.${string}`
  ? never
  : K;

export type FieldBase<K extends string> = {
  key: NoDots<K>;
  label: string;
  help?: string;
  visibleWhen?: (ctx: FieldCtx) => boolean;
  disabledWhen?: (ctx: FieldCtx) => boolean;
};

export type FieldOption = {
  value: string | number;
  label: string;
  icon?: ReactNode;
};

export type ToggleField<K extends string> = FieldBase<K> & { type: 'toggle' };

export type TextField<K extends string> = FieldBase<K> & {
  type: 'text';
  placeholder?: string;
  maxLength?: number;
};

export type TextareaField<K extends string> = FieldBase<K> & {
  type: 'textarea';
  placeholder?: string;
  rows?: number;
  maxLength?: number;
};

export type NumberField<K extends string> = FieldBase<K> & {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
};

export type SelectField<K extends string> = FieldBase<K> & {
  type: 'select';
  options: ReadonlyArray<FieldOption>;
};

export type SegmentedField<K extends string> = FieldBase<K> & {
  type: 'segmented';
  options: ReadonlyArray<FieldOption>;
};

export type SliderField<K extends string> = FieldBase<K> & {
  type: 'slider';
  min: number;
  max: number;
  step?: number;
};

export type ColorField<K extends string> = FieldBase<K> & {
  type: 'color';
  presets?: ReadonlyArray<string>;
  allowTransparent?: boolean;
};

export type FontFamilyField<K extends string> = FieldBase<K> & {
  type: 'fontFamily';
};

export type TextSizePresetField<K extends string> = FieldBase<K> & {
  type: 'textSizePreset';
};

export type AccentColorField<K extends string> = FieldBase<K> & {
  type: 'accentColor';
};

export type SurfaceColorField<K extends string> = FieldBase<K> & {
  type: 'surfaceColor';
  opacityKey?: string;
};

export type IconPickerField<K extends string> = FieldBase<K> & {
  type: 'iconPicker';
  /** Lucide icon names to offer; defaults to COMMON_INSTRUCTIONAL_ICONS. */
  icons?: ReadonlyArray<string>;
};

export type EmojiPickerField<K extends string> = FieldBase<K> & {
  type: 'emojiPicker';
  /** Emoji to offer as a flat grid; defaults to the curated classroom set. */
  emoji?: ReadonlyArray<string>;
};

export type ImageUploadField<K extends string> = FieldBase<K> & {
  type: 'imageUpload';
  accept?: string;
};

export type SoundOption = { value: string; label: string };

export type SoundPickerField<K extends string> = FieldBase<K> & {
  type: 'soundPicker';
  options: ReadonlyArray<SoundOption>;
  /** Plays the sound for `value`; omit to hide the per-option play buttons. */
  preview?: (value: string) => void;
};

export type RosterPickerField<K extends string> = FieldBase<K> & {
  type: 'rosterPicker';
};

/** Field types usable inside a `List` row; rows never nest lists or custom fields. */
export type RowField<K extends string = string> =
  | ToggleField<K>
  | TextField<K>
  | TextareaField<K>
  | NumberField<K>
  | SelectField<K>
  | SegmentedField<K>
  | SliderField<K>
  | ColorField<K>
  | FontFamilyField<K>
  | TextSizePresetField<K>
  | AccentColorField<K>
  | SurfaceColorField<K>
  | IconPickerField<K>
  | EmojiPickerField<K>
  | ImageUploadField<K>
  | SoundPickerField<K>
  | RosterPickerField<K>;

/** Row sub-schema: keys address row-object properties, not config paths. */
export type RowSchema<Row> = {
  fields: ReadonlyArray<RowField<Extract<keyof Row, string>>>;
  createRow?: () => Row;
};

export type ListField<
  K extends string,
  Row = Record<string, unknown>,
> = FieldBase<K> & {
  type: 'list';
  row: RowSchema<Row>;
  addLabel?: string;
  maxRows?: number;
  sortable?: boolean;
};

export type CustomField<K extends string> = FieldBase<K> & {
  type: 'custom';
  render: (ctx: FieldCtx & { updateConfig: UpdateConfig }) => ReactNode;
};

export type Field<K extends string = string, Row = Record<string, unknown>> =
  | RowField<K>
  | ListField<K, Row>
  | CustomField<K>;

export type GroupId = 'content' | 'behavior' | 'display';

/** D8 order: content, then behavior, then display. */
export const GROUP_ORDER: ReadonlyArray<GroupId> = [
  'content',
  'behavior',
  'display',
];

export type Group<K extends string = string, Row = Record<string, unknown>> = {
  id: GroupId;
  title?: string;
  fields: ReadonlyArray<Field<K, Row>>;
};

export type WidgetSettingsSchema<C = Record<string, unknown>> = {
  groups: ReadonlyArray<Group<Extract<keyof C, string>>>;
  styleKeys?: ReadonlyArray<AppearanceKey>;
  configVersion?: number;
};
