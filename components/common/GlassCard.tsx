import React, { forwardRef } from 'react';
import { DEFAULT_GLOBAL_STYLE, GlobalStyle } from '../../types';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  gradientOverlay?: boolean;
  transparency?: number;
  cornerRadius?: string;
  globalStyle?: GlobalStyle;
  allowInvisible?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className = '',
      gradientOverlay = true,
      transparency: propTransparency,
      cornerRadius: propCornerRadius,
      globalStyle: propGlobalStyle,
      allowInvisible = false,
      style,
      ...props
    },
    ref
  ) => {
    const globalStyle = propGlobalStyle ?? DEFAULT_GLOBAL_STYLE;

    // Determine values, prioritizing props over global settings
    const finalTransparency =
      propTransparency ?? globalStyle.windowTransparency;

    const isInvisible = allowInvisible && finalTransparency <= 0.001;

    const finalRadiusClass = propCornerRadius
      ? `rounded-${propCornerRadius}`
      : globalStyle.windowBorderRadius === 'none'
        ? 'rounded-none'
        : `rounded-${globalStyle.windowBorderRadius}`;

    return (
      <div
        ref={ref}
        className={`${isInvisible ? '' : 'backdrop-blur-md border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]'} ${finalRadiusClass} ${className}`}
        style={{
          backgroundColor: isInvisible
            ? 'transparent'
            : `rgba(255, 255, 255, ${finalTransparency})`,
          ...style,
        }}
        {...props}
      >
        {/* Glossy gradient overlay */}
        {gradientOverlay && !isInvisible && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-[inherit] -z-10" />
        )}
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
