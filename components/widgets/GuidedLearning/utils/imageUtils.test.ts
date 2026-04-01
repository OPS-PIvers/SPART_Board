import { describe, expect, it } from 'vitest';
import {
  calculateImageFootprint,
  toContainerCoords,
  toImageOffset,
} from './imageUtils';

describe('imageUtils', () => {
  it('calculates pillarboxed footprints for square images in wide containers', () => {
    expect(calculateImageFootprint(1000, 1000, 400, 200)).toEqual({
      width: 200,
      height: 200,
      offsetLeft: 100,
      offsetTop: 0,
    });
  });

  it('calculates letterboxed footprints for wide images in tall containers', () => {
    expect(calculateImageFootprint(1600, 900, 300, 400)).toEqual({
      width: 300,
      height: 168.75,
      offsetLeft: 0,
      offsetTop: 115.625,
    });
  });

  it('converts image-relative percentages back into container space', () => {
    const footprint = calculateImageFootprint(1000, 1000, 400, 200);
    const offset = toImageOffset(footprint, 400, 200);

    expect(offset).toEqual({
      left: 25,
      top: 0,
      scaleX: 0.5,
      scaleY: 1,
    });
    expect(toContainerCoords(10, 80, offset)).toEqual({
      xPct: 30,
      yPct: 80,
    });
  });
});
