import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateSnapBounds, SNAP_LAYOUT_CONSTANTS } from '@/utils/layoutMath';
import { SnapZone } from '@/config/snapLayouts';

describe('layoutMath', () => {
  beforeEach(() => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1920);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1080);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('calculateSnapBounds', () => {
    const defaultZone: SnapZone = {
      id: 'test-zone',
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    };

    it('should return 0 bounds if window is undefined (SSR)', () => {
      vi.stubGlobal('window', undefined);
      const bounds = calculateSnapBounds(defaultZone);
      expect(bounds).toEqual({ x: 0, y: 0, w: 0, h: 0 });
    });

    it('should calculate bounds correctly without dock element (fallback height)', () => {
      vi.spyOn(document, 'querySelector').mockReturnValue(null);

      const zone: SnapZone = { ...defaultZone, x: 0, y: 0, w: 1, h: 1 };
      const bounds = calculateSnapBounds(zone);

      const { PADDING, DOCK_HEIGHT } = SNAP_LAYOUT_CONSTANTS;
      const expectedWidth = 1920 - PADDING * 2;
      const expectedHeight = 1080 - DOCK_HEIGHT - PADDING * 2;

      expect(bounds.x).toBe(PADDING);
      expect(bounds.y).toBe(PADDING);
      expect(bounds.w).toBe(expectedWidth);
      expect(bounds.h).toBe(expectedHeight);
    });

    it('should use dock element height if present', () => {
      const mockDockElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({ top: 900 }),
      } as unknown as Element;

      vi.spyOn(document, 'querySelector').mockReturnValue(mockDockElement);

      const zone: SnapZone = { ...defaultZone, x: 0, y: 0, w: 1, h: 1 };
      const bounds = calculateSnapBounds(zone);

      const { PADDING } = SNAP_LAYOUT_CONSTANTS;
      const dockReservedHeight = 1080 - 900; // 180
      const expectedWidth = 1920 - PADDING * 2;
      const expectedHeight = 1080 - dockReservedHeight - PADDING * 2;

      expect(bounds.x).toBe(PADDING);
      expect(bounds.y).toBe(PADDING);
      expect(bounds.w).toBe(expectedWidth);
      expect(bounds.h).toBe(expectedHeight);
    });

    it('should use dock element by data-testid if data-role is not found', () => {
      const mockDockElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({ top: 800 }),
      } as unknown as Element;

      vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === '[data-role="dock"]') return null;
        if (selector === '[data-testid="dock"]') return mockDockElement;
        return null;
      });

      const zone: SnapZone = { ...defaultZone, x: 0, y: 0, w: 1, h: 1 };
      const bounds = calculateSnapBounds(zone);

      const { PADDING } = SNAP_LAYOUT_CONSTANTS;
      const dockReservedHeight = 1080 - 800; // 280
      const expectedWidth = 1920 - PADDING * 2;
      const expectedHeight = 1080 - dockReservedHeight - PADDING * 2;

      expect(bounds.x).toBe(PADDING);
      expect(bounds.y).toBe(PADDING);
      expect(bounds.w).toBe(expectedWidth);
      expect(bounds.h).toBe(expectedHeight);
    });

    it('should fall back to DOCK_HEIGHT if reserved height is <= 0', () => {
      const mockDockElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({ top: 1100 }), // Below viewport
      } as unknown as Element;

      vi.spyOn(document, 'querySelector').mockReturnValue(mockDockElement);

      const zone: SnapZone = { ...defaultZone, x: 0, y: 0, w: 1, h: 1 };
      const bounds = calculateSnapBounds(zone);

      const { PADDING, DOCK_HEIGHT } = SNAP_LAYOUT_CONSTANTS;
      const expectedWidth = 1920 - PADDING * 2;
      const expectedHeight = 1080 - DOCK_HEIGHT - PADDING * 2;

      expect(bounds.x).toBe(PADDING);
      expect(bounds.y).toBe(PADDING);
      expect(bounds.w).toBe(expectedWidth);
      expect(bounds.h).toBe(expectedHeight);
    });

    it('should calculate bounds using fallback height if document is undefined (SSR)', () => {
      vi.stubGlobal('document', undefined);

      const zone: SnapZone = { ...defaultZone, x: 0, y: 0, w: 1, h: 1 };
      const bounds = calculateSnapBounds(zone);

      const { PADDING, DOCK_HEIGHT } = SNAP_LAYOUT_CONSTANTS;
      const expectedWidth = 1920 - PADDING * 2;
      const expectedHeight = 1080 - DOCK_HEIGHT - PADDING * 2;

      expect(bounds.x).toBe(PADDING);
      expect(bounds.y).toBe(PADDING);
      expect(bounds.w).toBe(expectedWidth);
      expect(bounds.h).toBe(expectedHeight);
    });

    it('should calculate bounds with gaps for half zones', () => {
      vi.spyOn(document, 'querySelector').mockReturnValue(null);

      const leftZone: SnapZone = {
        ...defaultZone,
        x: 0,
        y: 0,
        w: 0.5,
        h: 1,
      };
      const rightZone: SnapZone = {
        ...defaultZone,
        x: 0.5,
        y: 0,
        w: 0.5,
        h: 1,
      };

      const leftBounds = calculateSnapBounds(leftZone);
      const rightBounds = calculateSnapBounds(rightZone);

      const { PADDING, GAP, DOCK_HEIGHT } = SNAP_LAYOUT_CONSTANTS;
      const safeWidth = 1920 - PADDING * 2;
      const safeHeight = 1080 - DOCK_HEIGHT - PADDING * 2;

      // Left zone should have half a gap subtracted from its width
      expect(leftBounds.w).toBe(Math.round(0.5 * safeWidth - GAP / 2));

      // Right zone should start after half a gap
      expect(rightBounds.x).toBe(
        Math.round(PADDING + 0.5 * safeWidth + GAP / 2)
      );
      // Right zone should have half a gap subtracted from its width
      expect(rightBounds.w).toBe(Math.round(0.5 * safeWidth - GAP / 2));

      // Height should be full safe height
      expect(leftBounds.h).toBe(safeHeight);
      expect(rightBounds.h).toBe(safeHeight);
    });

    it('should clamp safe dimensions to at least 0 on tiny viewports', () => {
      vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(10);
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(10);
      vi.spyOn(document, 'querySelector').mockReturnValue(null);

      const zone: SnapZone = { ...defaultZone, x: 0, y: 0, w: 1, h: 1 };
      const bounds = calculateSnapBounds(zone);

      const { PADDING } = SNAP_LAYOUT_CONSTANTS;

      // Safe dimensions should be 0, not negative
      expect(bounds.w).toBe(0);
      expect(bounds.h).toBe(0);
      expect(bounds.x).toBe(PADDING);
      expect(bounds.y).toBe(PADDING);
    });

    it('should subtract gaps from height for stacked zones', () => {
      vi.spyOn(document, 'querySelector').mockReturnValue(null);

      const topZone: SnapZone = {
        ...defaultZone,
        x: 0,
        y: 0,
        w: 1,
        h: 0.5,
      };
      const bottomZone: SnapZone = {
        ...defaultZone,
        x: 0,
        y: 0.5,
        w: 1,
        h: 0.5,
      };

      const topBounds = calculateSnapBounds(topZone);
      const bottomBounds = calculateSnapBounds(bottomZone);

      const { PADDING, GAP, DOCK_HEIGHT } = SNAP_LAYOUT_CONSTANTS;
      const safeHeight = 1080 - DOCK_HEIGHT - PADDING * 2;

      // Top zone should have half a gap subtracted from its height
      expect(topBounds.h).toBe(Math.round(0.5 * safeHeight - GAP / 2));

      // Bottom zone should start after half a gap
      expect(bottomBounds.y).toBe(
        Math.round(PADDING + 0.5 * safeHeight + GAP / 2)
      );
      // Bottom zone should have half a gap subtracted from its height
      expect(bottomBounds.h).toBe(Math.round(0.5 * safeHeight - GAP / 2));
    });
  });
});
