import React from 'react';
import type { FieldProps } from '../FieldProps';
import type { NumberField as NumberFieldSchema } from '../../schema/types';

export const NumberField: React.FC<FieldProps<NumberFieldSchema<string>>> = ({
  field,
  value,
  onChange,
  id,
  describedBy,
  disabled,
}) => (
  <input
    id={id}
    type="number"
    value={typeof value === 'number' ? value : ''}
    min={field.min}
    max={field.max}
    step={field.step}
    disabled={disabled}
    aria-describedby={describedBy}
    onChange={(e) => {
      const parsed = e.target.valueAsNumber;
      if (!Number.isNaN(parsed)) onChange(parsed);
    }}
    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
  />
);
