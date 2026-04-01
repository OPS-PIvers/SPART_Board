/**
 * Utility functions for handling image footprint and coordinate conversion
 * in the Guided Learning widget.
 */

export interface ImageFootprint {
  width: number;
  height: number;
  offsetLeft: number;
  offsetTop: number;
}

export interface ImageOffset {
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
}

/**
 * Calculates the actual rendered footprint (draw size and offsets)
 * of an image using `object-contain` within a container.
 */
export function calculateImageFootprint(
  naturalWidth: number,
  naturalHeight: number,
  containerWidth: number,
  containerHeight: number
): ImageFootprint | null {
  if (
    naturalWidth === 0 ||
    naturalHeight === 0 ||
    containerWidth === 0 ||
    containerHeight === 0
  ) {
    return null;
  }

  const imageAspect = naturalWidth / naturalHeight;
  const containerAspect = containerWidth / containerHeight;

  const width =
    imageAspect > containerAspect
      ? containerWidth
      : containerHeight * imageAspect;
  const height =
    imageAspect > containerAspect
      ? containerWidth / imageAspect
      : containerHeight;

  return {
    width,
    height,
    offsetLeft: (containerWidth - width) / 2,
    offsetTop: (containerHeight - height) / 2,
  };
}

/**
 * Converts a measured image footprint into container-relative offsets/scales.
 */
export function toImageOffset(
  footprint: ImageFootprint | null,
  containerWidth: number,
  containerHeight: number
): ImageOffset | null {
  if (!footprint || containerWidth === 0 || containerHeight === 0) {
    return null;
  }

  return {
    left: (footprint.offsetLeft / containerWidth) * 100,
    top: (footprint.offsetTop / containerHeight) * 100,
    scaleX: footprint.width / containerWidth,
    scaleY: footprint.height / containerHeight,
  };
}

/**
 * Converts image-relative percentage coordinates (0-100) back to
 * container-relative percentage coordinates (0-100).
 */
export function toContainerCoords(
  xPct: number,
  yPct: number,
  imgOffset: ImageOffset | null
): { xPct: number; yPct: number } {
  if (!imgOffset) return { xPct, yPct };

  return {
    xPct: imgOffset.left + xPct * imgOffset.scaleX,
    yPct: imgOffset.top + yPct * imgOffset.scaleY,
  };
}
