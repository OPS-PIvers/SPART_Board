import React, { forwardRef } from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  gradientOverlay?: boolean;
  transparency?: number;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className = '',
      gradientOverlay = true,
      transparency = 0.2,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`backdrop-blur-md border border-white/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-3xl ${className}`}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${transparency})`,
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
