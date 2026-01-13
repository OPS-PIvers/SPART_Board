import React, { useMemo } from 'react';

interface ScalableWidgetProps {
  width: number;
  height: number;
  baseWidth?: number;
  baseHeight?: number;
  children: React.ReactNode;
}

export const ScalableWidget: React.FC<ScalableWidgetProps> = ({
  width,
  height,
  baseWidth = 400,
  baseHeight = 400,
  children,
}) => {
  const scale = useMemo(() => {
    // Avoid division by zero
    if (baseWidth === 0 || baseHeight === 0) return 1;
    const scaleX = width / baseWidth;
    const scaleY = height / baseHeight;
    return Math.min(scaleX, scaleY);
  }, [width, height, baseWidth, baseHeight]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>{children}</div>
      </div>
    </div>
  );
};
