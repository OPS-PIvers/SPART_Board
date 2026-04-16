/**
 * QuizPeriodSelector — popout checkbox list for selecting class periods
 * on an assignment. Disables unchecking a period if students from that
 * period have already started (checks `responses` for matching `classPeriod`).
 */

import React, { useState, useRef, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import type { ClassRoster, QuizResponse } from '@/types';
import { useClickOutside } from '@/hooks/useClickOutside';

interface QuizPeriodSelectorProps {
  rosters: ClassRoster[];
  selectedPeriodNames: string[];
  /** Live responses for this assignment — used to guard against removing
   *  periods that students have already joined from. */
  responses?: QuizResponse[];
  onSave: (periodNames: string[]) => void;
  onClose: () => void;
}

export const QuizPeriodSelector: React.FC<QuizPeriodSelectorProps> = ({
  rosters,
  selectedPeriodNames,
  responses = [],
  onSave,
  onClose,
}) => {
  const [selected, setSelected] = useState<string[]>(selectedPeriodNames);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  // Build a set of period names that have students who've started
  const lockedPeriods = new Set<string>();
  for (const r of responses) {
    if (r.classPeriod && r.status !== 'joined') {
      lockedPeriods.add(r.classPeriod);
    }
  }

  const handleToggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSave = useCallback(() => {
    onSave(selected);
    onClose();
  }, [selected, onSave, onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
      style={{
        width: 'min(240px, 60cqmin)',
        right: 0,
        top: '100%',
        marginTop: 4,
      }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Class Periods
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-2 space-y-0.5 max-h-48 overflow-y-auto">
        {rosters.map((r) => {
          const checked = selected.includes(r.name);
          const locked = lockedPeriods.has(r.name);
          const joinedCount = responses.filter(
            (resp) => resp.classPeriod === r.name
          ).length;
          return (
            <label
              key={r.id}
              className={`flex items-center gap-2 rounded px-2 py-1.5 transition-colors ${
                locked
                  ? 'cursor-not-allowed opacity-70'
                  : 'cursor-pointer hover:bg-slate-50'
              }`}
              title={
                locked
                  ? `${joinedCount} student(s) have joined from this class`
                  : undefined
              }
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={locked && checked}
                onChange={() => handleToggle(r.name)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
              />
              <span className="text-sm text-slate-800 flex-1">{r.name}</span>
              {locked && (
                <span className="text-xxs text-amber-600 font-medium">
                  {joinedCount} joined
                </span>
              )}
            </label>
          );
        })}
        {rosters.length === 0 && (
          <p className="text-xs text-slate-400 italic px-2 py-2">
            No rosters available. Add rosters in the Class widget.
          </p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-3 py-2">
        <button
          onClick={onClose}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Check className="w-3 h-3" />
          Save
        </button>
      </div>
    </div>
  );
};
