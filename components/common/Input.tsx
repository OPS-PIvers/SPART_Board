import React, { forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size'
> {
  variant?: 'default' | 'ghost' | 'error' | 'filled' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode | LucideIcon;
  rightIcon?: React.ReactNode | LucideIcon;
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
      'block rounded-xl transition-all outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      default:
        'bg-white border border-slate-200 text-slate-900 focus:ring-brand-blue-primary placeholder:text-slate-400',
      ghost:
        'bg-transparent border-transparent hover:bg-slate-50 focus:bg-white focus:ring-brand-blue-primary text-slate-900 placeholder:text-slate-400',
      error:
        'bg-red-50 border border-red-200 text-red-900 focus:ring-red-500 placeholder:text-red-300',
      filled:
        'bg-slate-100 border-transparent text-slate-900 focus:bg-white focus:ring-brand-blue-primary placeholder:text-slate-400',
      dark: 'bg-slate-800 border border-slate-700 text-white focus:ring-indigo-500 placeholder:text-slate-500',
    };

    const sizeClasses = {
      xs: 'text-xs py-1 px-2',
      sm: 'text-sm py-1.5 px-3',
      md: 'text-sm py-2 px-4',
      lg: 'text-base py-3 px-5',
    };

    // Icon padding adjustments
    const paddingLeft = LeftIcon ? 'pl-9' : '';
    const paddingRight = RightIcon ? 'pr-9' : '';

    const combinedInputClasses = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
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
      Icon: React.ReactNode | LucideIcon,
      position: 'left' | 'right'
    ) => {
      if (!Icon) return null;

      const positionClass = position === 'left' ? 'left-3' : 'right-3';

      return (
        <div className={`${iconWrapperClasses} ${positionClass}`}>
          {React.isValidElement(Icon) ? (
            Icon
          ) : (
            // @ts-expect-error - Icon is a component type here if not a valid element
            <Icon className={iconSizeClasses[size]} />
          )}
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
