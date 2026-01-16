import React, { forwardRef } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { DEFAULT_GLOBAL_STYLE } from '../../types';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  gradientOverlay?: boolean;
  transparency?: number;
  cornerRadius?: string;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className = '',
      gradientOverlay = true,
      transparency: propTransparency,
      cornerRadius: propCornerRadius,
      style,
      ...props
    },
    ref
  ) => {
    const { activeDashboard } = useDashboard();
    const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;

    // Determine values, prioritizing props over global settings
    const finalTransparency =
      propTransparency ?? globalStyle.windowTransparency;
    const finalRadiusClass = propCornerRadius
      ? `rounded-${propCornerRadius}`
      : globalStyle.windowBorderRadius === 'none'
        ? 'rounded-none'
        : `rounded-${globalStyle.windowBorderRadius}`;

    return (
      <div
        ref={ref}
        className={`backdrop-blur-md border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ${finalRadiusClass} ${className}`}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${finalTransparency})`,
          ...style,
        }}
        {...props}
      >
        {/* Glossy gradient overlay */}
        {gradientOverlay && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none rounded-[inherit] -z-10" />
        )}
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
