import React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  /**
   * Tailwind class for the active background color.
   * Defaults to 'bg-brand-blue-primary'.
   */
  activeColor?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  className = '',
  size = 'md',
  activeColor = 'bg-brand-blue-primary',
}) => {
  const sizes = {
    xs: {
      button: 'w-8 h-4',
      knob: 'w-3 h-3',
      translate: 'translate-x-4',
      padding: 'top-0.5 left-0.5',
    },
    sm: {
      button: 'w-10 h-5',
      knob: 'w-3 h-3',
      translate: 'translate-x-5',
      padding: 'top-1 left-1',
    },
    md: {
      button: 'w-12 h-6',
      knob: 'w-4 h-4',
      translate: 'translate-x-6',
      padding: 'top-1 left-1',
    },
  };

  const currentSize = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`
        ${currentSize.button}
        rounded-full relative transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-primary
        ${checked ? activeColor : 'bg-slate-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <span
        className={`
          absolute ${currentSize.padding}
          bg-white rounded-full shadow transition-transform duration-200 ease-in-out
          ${currentSize.knob}
          ${checked ? currentSize.translate : 'translate-x-0'}
        `}
      />
    </button>
  );
};
