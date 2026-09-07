import React from 'react';
import type { FieldProps } from '../FieldProps';
import type { SelectField as SelectFieldSchema } from '@/components/settings/schema/types';

export const SelectField: React.FC<FieldProps<SelectFieldSchema<string>>> = ({
  field,
  value,
  onChange,
  id,
  describedBy,
  disabled,
}) => {
  const current =
    typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  return (
    <select
      id={id}
      value={current}
      disabled={disabled}
      aria-describedby={describedBy}
      onChange={(e) => {
        const option = field.options.find(
          (o) => String(o.value) === e.target.value
        );
        onChange(option ? option.value : e.target.value);
      }}
      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
      {field.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
