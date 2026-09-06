import type { Field, FieldCtx } from '../schema/types';

/** Field components render only the control; FieldRenderer draws the label row and help line. */
export type FieldProps<F extends Field = Field> = {
  field: F;
  value: unknown;
  onChange: (value: unknown) => void;
  id: string;
  describedBy?: string;
  disabled: boolean;
  ctx: FieldCtx;
};
