import { useMemo } from 'react';

/**
 * Hook to calculate a scaled font size based on widget dimensions.
 * @param widgetWidth Current width of the widget
 * @param widgetHeight Current height of the widget
 * @param baseFactor A multiplier to adjust the scaling sensitivity (default 1)
 * @param minSize Minimum font size in pixels (default 12)
 * @param maxSize Maximum font size in pixels (default 120)
 */
export const useScaledFont = (
  widgetWidth: number,
  widgetHeight: number,
  baseFactor: number = 1,
  minSize: number = 12,
  maxSize: number = 120
) => {
  return useMemo(() => {
    // We use the smaller of the two dimensions to prevent text from overflowing
    // when the window is very narrow or very short.
    const minDim = Math.min(widgetWidth, widgetHeight);

    // Base calculation: roughly 10% of the minimum dimension,
    // multiplied by the specific component's baseFactor.
    const scaledSize = minDim * 0.1 * baseFactor;

    return Math.max(minSize, Math.min(maxSize, scaledSize));
  }, [widgetWidth, widgetHeight, baseFactor, minSize, maxSize]);
};
