import React, { useMemo, memo } from 'react';

interface ScalableWidgetProps {
  width: number;
  height: number;
  baseWidth: number;
  baseHeight: number;
  canSpread?: boolean;
  padding?: number;
  headerHeight?: number;
  contentScaleMultiplier?: number;
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
  contentScaleMultiplier = 1,
  children,
}) => {
  const safeContentScaleMultiplier =
    Number.isFinite(contentScaleMultiplier) && contentScaleMultiplier > 0
      ? contentScaleMultiplier
      : 1;

  const { scale, renderScale, internalW, internalH } = useMemo(() => {
    const availableW = Math.max(10, width - padding * 2);
    const availableH = Math.max(10, height - headerHeight - padding * 2);

    if (baseWidth <= 0 || baseHeight <= 0) {
      return {
        scale: 1 * safeContentScaleMultiplier,
        renderScale: 1 * safeContentScaleMultiplier,
        internalW: availableW / safeContentScaleMultiplier,
        internalH: availableH / safeContentScaleMultiplier,
      };
    }

    const scaleX = availableW / baseWidth;
    const scaleY = availableH / baseHeight;
    const baseScale = Math.min(scaleX, scaleY);
    const scale = baseScale * safeContentScaleMultiplier;

    if (canSpread) {
      // Cap the CSS transform at 1.0 * safeContentScaleMultiplier to prevent upscaling blur.
      // When baseScale >= 1, render at full available resolution with no transform.
      // When baseScale < 1, render at larger virtual size and downscale (still crisp).
      const renderScale = Math.min(baseScale, 1) * safeContentScaleMultiplier;
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
  }, [
    width,
    height,
    baseWidth,
    baseHeight,
    canSpread,
    padding,
    headerHeight,
    safeContentScaleMultiplier,
  ]);

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
          transform: `scale(calc(${renderScale} * var(--transient-zoom, 1)))`,
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
