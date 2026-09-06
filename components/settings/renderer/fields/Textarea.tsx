import React from 'react';
import type { FieldProps } from '../FieldProps';
import type { TextareaField as TextareaFieldSchema } from '../../schema/types';

export const TextareaField: React.FC<
  FieldProps<TextareaFieldSchema<string>>
> = ({ field, value, onChange, id, describedBy, disabled }) => (
  <textarea
    id={id}
    value={typeof value === 'string' ? value : ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={field.placeholder}
    maxLength={field.maxLength}
    rows={field.rows ?? 3}
    disabled={disabled}
    aria-describedby={describedBy}
    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
  />
);
