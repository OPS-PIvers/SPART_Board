import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Collapsible group with a Tab-Switch-Detection-style header row and a
 * hairline top divider. Used inside the assign dialogs to fold secondary
 * settings groups (Answer Feedback, Gamification) under prominent
 * section labels — children inside the section visually demote (callers
 * pass `compact` to their `ToggleRow`s so the labels render in the
 * small uppercase tracking-widest style).
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  label,
  defaultOpen = false,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-slate-200/70 pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between rounded-md py-1 transition-colors"
      >
        <span className="text-sm font-bold text-brand-blue-dark">{label}</span>
        <ChevronRight
          className={`w-4 h-4 text-slate-400 group-hover:text-brand-blue-primary transition-all ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && <div className="space-y-3 pt-2 pl-1">{children}</div>}
    </div>
  );
};
