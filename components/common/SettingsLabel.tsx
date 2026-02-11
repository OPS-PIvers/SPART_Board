import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface SettingsLabelProps {
  children: ReactNode;
  icon?: LucideIcon | React.ElementType;
  className?: string;
  htmlFor?: string;
}

export const SettingsLabel: React.FC<SettingsLabelProps> = ({
  children,
  icon: Icon,
  className = '',
  htmlFor,
}) => {
  const baseClasses =
    'text-xxs font-black text-slate-400 uppercase tracking-widest block mb-2';
  const layoutClasses = Icon ? 'flex items-center gap-2' : '';
  const combinedClasses = [baseClasses, layoutClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <label htmlFor={htmlFor} className={combinedClasses}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </label>
  );
};
