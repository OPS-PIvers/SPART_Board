import React from 'react';
import { GlobalStyle } from '../../../types';

interface DockLabelProps {
  children: React.ReactNode;
  globalStyle: GlobalStyle;
}

/**
 * Custom Label Component for consistent readability
 * Adjusts text color based on background brightness or global settings.
 */
export const DockLabel: React.FC<DockLabelProps> = ({
  children,
  globalStyle,
}) => {
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
