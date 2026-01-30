import React, { ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  variant?: 'default' | 'danger';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  active = false,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-full transition-all flex items-center justify-center';

  // Apply default padding only if not overridden in className
  // This is a heuristic; technically a regex would be better but this covers "p-"
  const defaultPadding = className.includes('p-') ? '' : 'p-1.5';

  let colorStyles = '';
  if (variant === 'danger') {
    colorStyles = 'text-red-600 hover:bg-red-500/20';
  } else if (active) {
    colorStyles = 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100';
  } else {
    colorStyles = 'text-slate-600 hover:bg-slate-800/10';
  }

  return (
    <button
      className={`${baseStyles} ${defaultPadding} ${colorStyles} ${className}`}
      title={label}
      aria-label={label}
      type="button"
      {...props}
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
};
