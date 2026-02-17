import React, { forwardRef } from 'react';

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  variant?: 'default' | 'ghost' | 'error' | 'filled' | 'dark' | 'underline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactElement | React.ComponentType<{ className?: string }>;
  rightIcon?: React.ReactElement | React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'block transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      default:
        'bg-white border border-slate-200 text-slate-900 focus:ring-2 focus:ring-brand-blue-primary placeholder:text-slate-400 rounded-xl',
      ghost:
        'bg-transparent border-transparent hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-blue-primary text-slate-900 placeholder:text-slate-400 rounded-xl',
      error:
        'bg-red-50 border border-red-200 text-red-900 focus:ring-2 focus:ring-red-500 placeholder:text-red-300 rounded-xl',
      filled:
        'bg-slate-100 border-transparent text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-blue-primary placeholder:text-slate-400 rounded-xl',
      dark: 'bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500 rounded-xl',
      underline:
        'bg-transparent border-b border-slate-200 text-slate-900 focus:border-brand-blue-primary hover:border-slate-300 placeholder:text-slate-400 rounded-none px-0 py-0.5 focus:ring-0',
    };

    const textSizeClasses = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-sm',
      lg: 'text-base',
    };

    const paddingClasses = {
      xs: 'py-1 px-2',
      sm: 'py-1.5 px-3',
      md: 'py-2 px-4',
      lg: 'py-3 px-5',
    };

    // Dynamic icon padding based on size
    const iconPaddingMap = {
      xs: { left: 'pl-7', right: 'pr-7' },
      sm: { left: 'pl-8', right: 'pr-8' },
      md: { left: 'pl-9', right: 'pr-9' },
      lg: { left: 'pl-10', right: 'pr-10' },
    };

    // Only apply icon padding if an icon is present
    const paddingLeft = LeftIcon ? iconPaddingMap[size].left : '';
    const paddingRight = RightIcon ? iconPaddingMap[size].right : '';

    const isUnderline = variant === 'underline';

    const combinedInputClasses = [
      baseClasses,
      textSizeClasses[size],
      !isUnderline ? paddingClasses[size] : '', // Skip standard padding for underline variant
      variantClasses[variant],
      paddingLeft,
      paddingRight,
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const iconSizeClasses = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    // Adjust icon color for dark variant
    const iconColorClass =
      variant === 'dark' ? 'text-slate-500' : 'text-slate-400';
    const iconWrapperClasses = `absolute top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center ${iconColorClass}`;

    const renderIcon = (
      Icon: React.ReactElement | React.ComponentType<{ className?: string }>,
      position: 'left' | 'right'
    ) => {
      if (!Icon) return null;

      const positionClass = position === 'left' ? 'left-3' : 'right-3';
      const iconSize = iconSizeClasses[size];

      return (
        <div className={`${iconWrapperClasses} ${positionClass}`}>
          {React.isValidElement(Icon)
            ? React.cloneElement(Icon, {
                className: `${iconSize} ${
                  (Icon.props as { className?: string }).className ?? ''
                }`,
              })
            : // Render as component
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              React.createElement(Icon as React.ComponentType<any>, {
                className: iconSize,
              })}
        </div>
      );
    };

    return (
      <div className={`relative ${fullWidth ? 'w-full' : 'w-max'}`}>
        {renderIcon(LeftIcon, 'left')}
        <input
          ref={ref}
          className={combinedInputClasses}
          disabled={disabled}
          {...props}
        />
        {renderIcon(RightIcon, 'right')}
      </div>
    );
  }
);

Input.displayName = 'Input';
