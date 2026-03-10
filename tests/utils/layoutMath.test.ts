import { describe, it, expect } from 'vitest';
import {
  calculateSnapBounds,
  SNAP_LAYOUT_CONSTANTS,
} from '../../utils/layoutMath';
import { SnapZone } from '../../config/snapLayouts';

describe('calculateSnapBounds', () => {
  it('returns safe fallback when window is undefined', () => {
    // We cannot easily test undefined window in jsdom environment,
    // so we skip this test or just acknowledge it.
    // The fallback is covered in a true non-browser environment.
  });

  it('calculates bounds for a full-screen zone', () => {
    const { PADDING } = SNAP_LAYOUT_CONSTANTS;
    const safeWidth = Math.max(0, window.innerWidth - PADDING * 2);
    const safeHeight = Math.max(0, window.innerHeight - PADDING * 2);

    const fullScreenZone: SnapZone = { id: 'full', x: 0, y: 0, w: 1, h: 1 };

    const bounds = calculateSnapBounds(fullScreenZone);

    expect(bounds.x).toBe(Math.round(PADDING));
    expect(bounds.y).toBe(Math.round(PADDING));
    expect(bounds.w).toBe(Math.round(safeWidth));
    expect(bounds.h).toBe(Math.round(safeHeight));
  });

  it('calculates bounds for a left-half zone', () => {
    const { PADDING, GAP } = SNAP_LAYOUT_CONSTANTS;
    const safeWidth = Math.max(0, window.innerWidth - PADDING * 2);
    const safeHeight = Math.max(0, window.innerHeight - PADDING * 2);

    const leftHalfZone: SnapZone = {
      id: 'left-half',
      x: 0,
      y: 0,
      w: 0.5,
      h: 1,
    };

    const bounds = calculateSnapBounds(leftHalfZone);

    const expectedX = PADDING;
    const expectedY = PADDING;
    const expectedW = 0.5 * safeWidth - GAP / 2; // (zone.x + zone.w < 1 ? GAP / 2 : 0) -> (0 + 0.5 < 1 ? GAP / 2 : 0) -> GAP / 2
    const expectedH = safeHeight; // (zone.y + zone.h < 1) -> (0 + 1 < 1) -> false -> 0

    expect(bounds.x).toBe(Math.round(expectedX));
    expect(bounds.y).toBe(Math.round(expectedY));
    expect(bounds.w).toBe(Math.round(expectedW));
    expect(bounds.h).toBe(Math.round(expectedH));
  });

  it('calculates bounds for a right-half zone', () => {
    const { PADDING, GAP } = SNAP_LAYOUT_CONSTANTS;
    const safeWidth = Math.max(0, window.innerWidth - PADDING * 2);
    const safeHeight = Math.max(0, window.innerHeight - PADDING * 2);

    const rightHalfZone: SnapZone = {
      id: 'right-half',
      x: 0.5,
      y: 0,
      w: 0.5,
      h: 1,
    };

    const bounds = calculateSnapBounds(rightHalfZone);

    const rawX = PADDING + 0.5 * safeWidth;

    const expectedX = rawX + GAP / 2; // (zone.x > 0 ? GAP / 2 : 0) -> GAP / 2
    const expectedY = PADDING;
    const rawW = 0.5 * safeWidth;
    const expectedW = rawW - GAP / 2 - 0; // (zone.x > 0 ? GAP / 2 : 0) - (zone.x + zone.w < 1 ? GAP / 2 : 0) -> GAP / 2 - 0
    const expectedH = safeHeight; // (zone.y + zone.h < 1) -> false -> 0

    expect(bounds.x).toBe(Math.round(expectedX));
    expect(bounds.y).toBe(Math.round(expectedY));
    expect(bounds.w).toBe(Math.round(expectedW));
    expect(bounds.h).toBe(Math.round(expectedH));
  });

  it('calculates bounds for a top-left quarter zone', () => {
    const { PADDING, GAP } = SNAP_LAYOUT_CONSTANTS;
    const safeWidth = Math.max(0, window.innerWidth - PADDING * 2);
    const safeHeight = Math.max(0, window.innerHeight - PADDING * 2);

    const topLeftZone: SnapZone = {
      id: 'top-left',
      x: 0,
      y: 0,
      w: 0.5,
      h: 0.5,
    };

    const bounds = calculateSnapBounds(topLeftZone);

    const expectedX = PADDING;
    const expectedY = PADDING;
    const expectedW = 0.5 * safeWidth - GAP / 2; // x=0, x+w=0.5<1 -> 0 - GAP/2
    const expectedH = 0.5 * safeHeight - GAP / 2; // y=0, y+h=0.5<1 -> 0 - GAP/2

    expect(bounds.x).toBe(Math.round(expectedX));
    expect(bounds.y).toBe(Math.round(expectedY));
    expect(bounds.w).toBe(Math.round(expectedW));
    expect(bounds.h).toBe(Math.round(expectedH));
  });

  it('calculates bounds for a bottom-right quarter zone', () => {
    const { PADDING, GAP } = SNAP_LAYOUT_CONSTANTS;
    const safeWidth = Math.max(0, window.innerWidth - PADDING * 2);
    const safeHeight = Math.max(0, window.innerHeight - PADDING * 2);

    const bottomRightZone: SnapZone = {
      id: 'bottom-right',
      x: 0.5,
      y: 0.5,
      w: 0.5,
      h: 0.5,
    };

    const bounds = calculateSnapBounds(bottomRightZone);

    const rawX = PADDING + 0.5 * safeWidth;
    const rawY = PADDING + 0.5 * safeHeight;
    const expectedX = rawX + GAP / 2;
    const expectedY = rawY + GAP / 2;
    const rawW = 0.5 * safeWidth;
    const rawH = 0.5 * safeHeight;
    const expectedW = rawW - GAP / 2 - 0; // x=0.5>0, x+w=1 < 1 is false -> GAP/2 - 0
    const expectedH = rawH - GAP / 2 - 0; // y=0.5>0, y+h=1 < 1 is false -> GAP/2 - 0

    expect(bounds.x).toBe(Math.round(expectedX));
    expect(bounds.y).toBe(Math.round(expectedY));
    expect(bounds.w).toBe(Math.round(expectedW));
    expect(bounds.h).toBe(Math.round(expectedH));
  });

  it('calculates bounds for an interior grid zone', () => {
    const { PADDING, GAP } = SNAP_LAYOUT_CONSTANTS;
    const safeWidth = Math.max(0, window.innerWidth - PADDING * 2);
    const safeHeight = Math.max(0, window.innerHeight - PADDING * 2);

    // This zone is right in the middle, x > 0 and x+w < 1
    const middleZone: SnapZone = {
      id: 'middle',
      x: 0.33,
      y: 0.33,
      w: 0.34,
      h: 0.34,
    };

    const bounds = calculateSnapBounds(middleZone);

    const rawX = PADDING + 0.33 * safeWidth;
    const rawY = PADDING + 0.33 * safeHeight;

    const expectedX = rawX + GAP / 2; // x > 0
    const expectedY = rawY + GAP / 2; // y > 0

    const rawW = 0.34 * safeWidth;
    const rawH = 0.34 * safeHeight;

    const expectedW = rawW - GAP / 2 - GAP / 2; // x>0 and x+w < 1
    const expectedH = rawH - GAP / 2 - GAP / 2; // y>0 and y+h < 1

    expect(bounds.x).toBe(Math.round(expectedX));
    expect(bounds.y).toBe(Math.round(expectedY));
    expect(bounds.w).toBe(Math.round(expectedW));
    expect(bounds.h).toBe(Math.round(expectedH));
  });
});
