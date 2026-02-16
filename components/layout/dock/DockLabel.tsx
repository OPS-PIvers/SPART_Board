import React from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { DEFAULT_GLOBAL_STYLE } from '../../../types';

/**
 * Custom Label Component for consistent readability
 * Adjusts text color based on background brightness or global settings.
 */
export const DockLabel = ({ children }: { children: React.ReactNode }) => {
  const { activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;

  return (
    <span
      className={`text-xxs font-black uppercase tracking-tighter whitespace-nowrap transition-colors duration-300 font-${globalStyle.fontFamily}`}
      style={{
        color: globalStyle.dockTextColor,
        textShadow: globalStyle.dockTextShadow
          ? '0 1px 3px rgba(0,0,0,0.9)'
          : 'none',
      }}
    >
      {children}
    </span>
  );
};
