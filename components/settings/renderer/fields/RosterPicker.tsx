import React from 'react';
import type { FieldProps } from '../FieldProps';
import type { RosterPickerField as RosterPickerFieldSchema } from '../../schema/types';
import { useDashboard } from '@/context/useDashboard';
import { handleRadioGroupKeyDown } from '@/components/common/radioGroupKeyNav';
import { resolveLabel } from '../resolveLabel';

type RosterMode = 'class' | 'custom';
const MODES: ReadonlyArray<RosterMode> = ['class', 'custom'];

// Auto/Custom roster-mode switch (RosterModeControl semantics) plus the active class name.
export const RosterPicker: React.FC<
  FieldProps<RosterPickerFieldSchema<string>>
> = ({ value, onChange, id, describedBy, labelId, disabled, ctx }) => {
  const { activeRosterId, rosters } = useDashboard();
  const activeRoster = rosters.find((roster) => roster.id === activeRosterId);
  const mode: RosterMode = value === 'custom' ? 'custom' : 'class';
  const t = (leaf: string) => resolveLabel(ctx.t, ctx.widget.type, leaf);
  const labels: Record<RosterMode, string> = {
    class: t('rosterAuto'),
    custom: t('rosterCustom'),
  };

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      className="flex flex-col gap-1.5"
    >
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={(e) => handleRadioGroupKeyDown(e, MODES, onChange)}
        className="flex gap-1 bg-slate-100 rounded-lg p-1"
      >
        {MODES.map((option) => {
          const selected = mode === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              disabled={disabled}
              onClick={() => onChange(option)}
              className={`flex-1 text-xs px-2 py-1.5 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-blue-primary ${
                selected
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {labels[option]}
            </button>
          );
        })}
      </div>
      {mode === 'class' && (
        <p
          data-testid="roster-picker-status"
          className={`px-2 py-1.5 rounded-lg border text-xxs font-semibold truncate ${
            activeRoster
              ? 'bg-blue-50 border-blue-100 text-blue-800'
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          {activeRoster
            ? `${t('rosterActive')}: ${activeRoster.name}`
            : t('rosterNone')}
        </p>
      )}
    </div>
  );
};
