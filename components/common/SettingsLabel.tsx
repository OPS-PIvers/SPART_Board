import React, { ReactNode, useContext } from 'react';
import { LucideIcon } from 'lucide-react';
import {
  SettingsLabelToneContext,
  SettingsLabelTone,
} from './SettingsLabelToneContext';

interface SettingsLabelProps {
  children: ReactNode;
  icon?: LucideIcon | React.ElementType;
  className?: string;
  htmlFor?: string;
  // 'span' renders a heading for a group of sibling controls (checkbox/chip groups) — a bare <label> would be orphaned; pair with role="group" + aria-labelledby={id}.
  as?: 'label' | 'span';
  id?: string;
  tone?: SettingsLabelTone;
}

export const SettingsLabel: React.FC<SettingsLabelProps> = ({
  children,
  icon: Icon,
  className = '',
  htmlFor,
  as = 'label',
  id,
  tone,
}) => {
  const contextTone = useContext(SettingsLabelToneContext);
  const resolvedTone = tone ?? contextTone;
  const toneClass =
    resolvedTone === 'drawer' ? 'text-slate-700' : 'text-slate-400';
  const baseClasses = `text-xxs font-black ${toneClass} uppercase tracking-widest block mb-2`;
  const layoutClasses = Icon ? 'flex items-center gap-2' : '';
  const combinedClasses = [baseClasses, layoutClasses, className]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </>
  );

  // Default to <label>: it keeps the implicit nesting/`for=` association a real form-control label needs; use as="span" for group headings where a <label> would be orphaned.
  if (as === 'span') {
    return (
      <span id={id} className={combinedClasses}>
        {content}
      </span>
    );
  }
  return (
    <label htmlFor={htmlFor} id={id} className={combinedClasses}>
      {content}
    </label>
  );
};
