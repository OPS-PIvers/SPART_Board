import React from 'react';

/**
 * Utility to provide accessibility attributes and keyboard support for interactive elements
 * that are not natively buttons (e.g., clickable divs).
 *
 * @param onClick The click handler to be executed on click or Enter/Space press.
 * @returns An object containing the required props to be spread onto the element.
 */
export const getButtonAccessibilityProps = (onClick: () => void) => {
  return {
    role: 'button',
    tabIndex: 0,
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
  };
};
