import type { ReactNode } from 'react';
import type { Field, FieldCtx, UpdateConfig } from '../schema/types';

/** Field components render only the control; FieldRenderer draws the label row and help line. */
export type FieldProps<F extends Field = Field> = {
  field: F;
  value: unknown;
  onChange: (value: unknown) => void;
  id: string;
  describedBy?: string;
  disabled: boolean;
  ctx: FieldCtx;
  /** List fields only: renders one row's sub-schema fields via FieldRenderer. */
  renderRow?: (
    row: Record<string, unknown>,
    rowIndex: number,
    onRowChange: (nextRow: Record<string, unknown>) => void
  ) => ReactNode;
  /** Custom fields only: the mount-stable patch writer handed to `render`. */
  updateConfig?: UpdateConfig;
};
