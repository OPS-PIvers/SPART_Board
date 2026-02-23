import React, { useMemo, memo } from 'react';

interface ScalableWidgetProps {
  width: number;
  height: number;
  baseWidth: number;
  baseHeight: number;
  canSpread?: boolean;
  padding?: number;
  headerHeight?: number;
  children:
    | React.ReactNode
    | ((props: {
        internalW: number;
        internalH: number;
        scale: number;
      }) => React.ReactNode);
}

const ScalableWidgetComponent: React.FC<ScalableWidgetProps> = ({
  width,
  height,
  baseWidth,
  baseHeight,
  canSpread = true,
  padding = 0,
  headerHeight = 0,
  children,
}) => {
  const { scale, renderScale, internalW, internalH } = useMemo(() => {
    const availableW = Math.max(10, width - padding * 2);
    const availableH = Math.max(10, height - headerHeight - padding * 2);

    if (baseWidth <= 0 || baseHeight <= 0) {
      return {
        scale: 1,
        renderScale: 1,
        internalW: availableW,
        internalH: availableH,
      };
    }

    const scaleX = availableW / baseWidth;
    const scaleY = availableH / baseHeight;
    const scale = Math.min(scaleX, scaleY);

    if (canSpread) {
      // Cap the CSS transform at 1.0 to prevent upscaling blur.
      // When scale >= 1, render at full available resolution with no transform.
      // When scale < 1, render at larger virtual size and downscale (still crisp).
      const renderScale = Math.min(scale, 1);
      return {
        scale,
        renderScale,
        internalW: availableW / renderScale,
        internalH: availableH / renderScale,
      };
    }

    return {
      scale,
      renderScale: scale,
      internalW: baseWidth,
      internalH: baseHeight,
    };
  }, [width, height, baseWidth, baseHeight, canSpread, padding, headerHeight]);

  const renderContent = () => {
    if (typeof children === 'function') {
      return children({ internalW, internalH, scale });
    }
    return children;
  };

  return (
    <div
      className="scalable-widget-container"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: padding,
        boxSizing: 'border-box',
      }}
    >
      <div
        className="scalable-widget-content"
        style={{
          width: internalW,
          height: internalH,
          transform: `scale(${renderScale})`,
          transformOrigin: 'center center',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          willChange: 'transform',
          overflow: 'auto',
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export const ScalableWidget = memo(ScalableWidgetComponent);
