import React from 'react';

interface GoogleDriveIconProps {
  className?: string;
}

export const GoogleDriveIcon: React.FC<GoogleDriveIconProps> = ({
  className = 'w-5 h-5',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14.75 4L22 16.5L18.75 22L11.5 9.5L14.75 4Z" fill="#FFC107" />
      <path d="M9.25 4L22 4L18.75 9.5L6 9.5L9.25 4Z" fill="#1976D2" />
      <path d="M11.5 9.5L18.75 22L5.25 22L2 16.5L11.5 9.5Z" fill="#4CAF50" />
      <path
        d="M6 9.5L11.5 9.5L5.25 22L2 16.5L6 9.5Z"
        fill="#1B5E20"
        fillOpacity="0.1"
      />
    </svg>
  );
};
