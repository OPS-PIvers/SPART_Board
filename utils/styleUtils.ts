import React from 'react';

export const getBackgroundStyle = (bg?: string): React.CSSProperties => {
  if (!bg) return {};

  // Check if it's a URL or Base64 image
  if (bg.startsWith('http') || bg.startsWith('data:')) {
    return {
      backgroundImage: `url("${bg}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    };
  }
  return {};
};

export const getBackgroundClass = (bg?: string): string => {
  if (!bg) return '';
  // If it's a URL, don't apply the class
  if (bg.startsWith('http') || bg.startsWith('data:')) return '';
  return bg;
};
