import React, { forwardRef } from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  gradientOverlay?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className = '', gradientOverlay = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`backdrop-blur-md bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] rounded-3xl ${className}`}
        {...props}
      >
        {/* Glossy gradient overlay */}
        {gradientOverlay && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-[inherit] -z-10" />
        )}
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
