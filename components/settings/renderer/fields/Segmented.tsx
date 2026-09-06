import React from 'react';
import type { FieldProps } from '../FieldProps';
import type { SegmentedField as SegmentedFieldSchema } from '../../schema/types';

export const SegmentedField: React.FC<
  FieldProps<SegmentedFieldSchema<string>>
> = ({ field, value, onChange, id, describedBy, disabled }) => (
  <div
    id={id}
    role="radiogroup"
    aria-describedby={describedBy}
    className="flex flex-wrap gap-1 bg-slate-100 rounded-lg p-1"
  >
    {field.options.map((option) => {
      const selected = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-md transition-colors ${
            selected
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {option.icon}
          {option.label}
        </button>
      );
    })}
  </div>
);
