import React from 'react';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
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
    sm: {
      button: 'w-10 h-5',
      knob: 'w-3 h-3',
      translate: 'translate-x-5',
      padding: 'top-1 left-1',
    },
    md: {
      button: 'w-11 h-6',
      knob: 'w-4 h-4',
      translate: 'translate-x-5',
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
        rounded-full relative transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-primary
        ${checked ? activeColor : 'bg-slate-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
        flex-shrink-0
      `}
    >
      {/* State Labels */}
      <span className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none select-none">
        <span
          className={`text-[8px] font-black leading-none text-white transition-opacity duration-200 ${
            checked ? 'opacity-100' : 'opacity-0'
          }`}
        >
          ON
        </span>
        <span
          className={`text-[8px] font-black leading-none text-slate-700 transition-opacity duration-200 ${
            !checked ? 'opacity-100' : 'opacity-0'
          }`}
        >
          OFF
        </span>
      </span>

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
