import React from 'react';

export type IconButtonVariant =
  | 'ghost'
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'glass'
  | 'brand-ghost'
  | 'brand-danger-ghost';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  active?: boolean;
  tooltip?: string;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'md',
  active = false,
  className = '',
  tooltip,
  type = 'button',
  disabled,
  ...props
}) => {
  const baseStyles =
    'rounded-full transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles: Record<IconButtonVariant, string> = {
    ghost: active
      ? 'text-indigo-600 bg-indigo-100/60'
      : 'text-slate-600 hover:bg-slate-800/10',
    primary: active
      ? 'bg-brand-blue-dark text-white shadow-inner'
      : 'bg-brand-blue-primary text-white shadow-md hover:bg-brand-blue-dark hover:shadow-lg',
    secondary: active
      ? 'bg-slate-200 text-slate-800'
      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-brand-blue-light hover:text-brand-blue-primary',
    danger: active
      ? 'bg-red-100 text-red-700'
      : 'text-red-600 hover:bg-red-500/20',
    glass: active
      ? 'bg-white/40 text-brand-blue-primary backdrop-blur-md'
      : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-md',
    'brand-ghost': active
      ? 'bg-brand-blue-primary text-white'
      : 'text-brand-blue-primary bg-brand-blue-lighter/50 hover:bg-brand-blue-primary hover:text-white shadow-sm',
    'brand-danger-ghost': active
      ? 'bg-brand-red-primary text-white'
      : 'text-brand-red-primary bg-brand-red-lighter/50 hover:bg-brand-red-primary hover:text-white shadow-sm',
  };

  const sizeStyles: Record<IconButtonSize, string> = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const computedClass = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <button
      type={type}
      className={computedClass}
      title={tooltip}
      disabled={disabled}
      aria-label={tooltip}
      aria-pressed={active}
      {...props}
    >
      {icon}
    </button>
  );
};
