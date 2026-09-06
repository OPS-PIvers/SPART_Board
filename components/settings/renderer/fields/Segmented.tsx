import React from 'react';
import type { FieldProps } from '../FieldProps';
import type { SegmentedField as SegmentedFieldSchema } from '../../schema/types';

const NAV_KEYS = [
  'ArrowRight',
  'ArrowDown',
  'ArrowLeft',
  'ArrowUp',
  'Home',
  'End',
];

export const SegmentedField: React.FC<
  FieldProps<SegmentedFieldSchema<string>>
> = ({ field, value, onChange, id, describedBy, labelId, disabled }) => {
  const options = field.options;
  const selectedIndex = options.findIndex((option) => option.value === value);

  // APG radiogroup: one tab stop, arrows move focus and selection.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!NAV_KEYS.includes(e.key)) return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const nodes = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    );
    if (nodes.length === 0) return;
    e.preventDefault();
    const active = nodes.indexOf(document.activeElement as HTMLButtonElement);
    const from = active < 0 ? Math.max(selectedIndex, 0) : active;
    let next: number;
    if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = nodes.length - 1;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
      next = (from + 1) % nodes.length;
    else next = (from - 1 + nodes.length) % nodes.length;
    nodes[next].focus();
    onChange(options[next].value);
  };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      onKeyDown={handleKeyDown}
      className="flex flex-wrap gap-1 bg-slate-100 rounded-lg p-1"
    >
      {options.map((option, index) => {
        const selected = value === option.value;
        const tabbable = selected || (selectedIndex < 0 && index === 0);
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={tabbable ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-blue-primary ${
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
};
