import React, { HTMLAttributes, forwardRef } from 'react';

interface FloatingPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'solid' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shape?: 'default' | 'pill' | 'square';
  overflow?: 'hidden' | 'visible';
}

export const FloatingPanel = forwardRef<HTMLDivElement, FloatingPanelProps>(
  (
    {
      children,
      className = '',
      variant = 'solid',
      padding = 'md',
      shape = 'default',
      overflow = 'visible',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'z-popover animate-in fade-in zoom-in-95 duration-200 border shadow-xl';

    const variantStyles = {
      solid:
        'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
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

    const computedClass = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${shapeStyles[shape]} overflow-${overflow} ${className}`;

    return (
      <div ref={ref} className={computedClass} {...props}>
        {children}
      </div>
    );
  }
);

FloatingPanel.displayName = 'FloatingPanel';
