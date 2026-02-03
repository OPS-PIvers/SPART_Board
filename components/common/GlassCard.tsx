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
      style,
      ...props
    },
    ref
  ) => {
    const globalStyle = propGlobalStyle ?? DEFAULT_GLOBAL_STYLE;

    // Determine values, prioritizing props over global settings
    const finalTransparency =
      propTransparency ?? globalStyle.windowTransparency;

    const finalRadiusClass = propCornerRadius
      ? `rounded-${propCornerRadius}`
      : globalStyle.windowBorderRadius === 'none'
        ? 'rounded-none'
        : `rounded-${globalStyle.windowBorderRadius}`;

    // Scale intensity of glass effects based on transparency
    // We normalize to the default transparency so it looks consistent at 80%
    const factor = finalTransparency / DEFAULT_GLOBAL_STYLE.windowTransparency;

    return (
      <div
        ref={ref}
        className={`${finalRadiusClass} ${className}`}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${finalTransparency})`,
          border: `1px solid rgba(255, 255, 255, ${Math.min(1, 0.3 * factor)})`,
          boxShadow: `0 8px 32px 0 rgba(0, 0, 0, ${Math.min(1, 0.36 * factor)})`,
          backdropFilter:
            finalTransparency > 0 ? `blur(${12 * factor}px)` : 'none',
          ...style,
        }}
        {...props}
      >
        {/* Glossy gradient overlay */}
        {gradientOverlay && (
          <div
            className="absolute inset-0 pointer-events-none rounded-[inherit] -z-10"
            style={{
              background: `linear-gradient(to bottom right, rgba(255, 255, 255, ${Math.min(1, 0.2 * factor)}), transparent)`,
            }}
          />
        )}
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
