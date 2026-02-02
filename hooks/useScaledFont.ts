import { useMemo } from 'react';

type ScalingMode = 'min' | 'max' | 'width' | 'height' | 'average';

/**
 * Hook to calculate a scaled font size based on widget dimensions.
 * @param widgetWidth Current width of the widget
 * @param widgetHeight Current height of the widget
 * @param baseFactor A multiplier to adjust the scaling sensitivity (default 1)
 * @param options Configuration for scaling limits and mode
 */
export const useScaledFont = (
  widgetWidth: number,
  widgetHeight: number,
  baseFactor: number = 1,
  options: {
    minSize?: number;
    maxSize?: number;
    mode?: ScalingMode;
  } = {}
) => {
  const { minSize = 12, maxSize = 120, mode = 'min' } = options;

  return useMemo(() => {
    let referenceDim: number;

    switch (mode) {
      case 'width':
        referenceDim = widgetWidth;
        break;
      case 'height':
        referenceDim = widgetHeight;
        break;
      case 'max':
        referenceDim = Math.max(widgetWidth, widgetHeight);
        break;
      case 'average':
        referenceDim = (widgetWidth + widgetHeight) / 2;
        break;
      case 'min':
      default:
        referenceDim = Math.min(widgetWidth, widgetHeight);
        break;
    }

    // Base calculation: roughly 10% of the reference dimension,
    // multiplied by the specific component's baseFactor.
    const scaledSize = referenceDim * 0.1 * baseFactor;

    return Math.max(minSize, Math.min(maxSize, scaledSize));
  }, [widgetWidth, widgetHeight, baseFactor, minSize, maxSize, mode]);
};
