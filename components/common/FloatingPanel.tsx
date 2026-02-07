import React, { HTMLAttributes } from 'react';

interface FloatingPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'solid' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shape?: 'default' | 'pill' | 'square';
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  children,
  className = '',
  variant = 'solid',
  padding = 'md',
  shape = 'default',
  ...props
}) => {
  const baseStyles =
    'z-popover overflow-hidden animate-in fade-in zoom-in-95 duration-200 border shadow-xl';

  const variantStyles = {
    solid: 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
    glass:
      'bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/40 dark:border-slate-700/40',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-1.5',
    md: 'p-3',
    lg: 'p-4',
  };

  const shapeStyles = {
    default: 'rounded-2xl',
    pill: 'rounded-full',
    square: 'rounded-none',
  };

  const computedClass = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${shapeStyles[shape]} ${className}`;

  return (
    <div className={computedClass} {...props}>
      {children}
    </div>
  );
};
