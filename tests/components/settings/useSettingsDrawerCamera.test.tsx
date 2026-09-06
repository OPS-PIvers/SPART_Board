import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import React from 'react';
import {
  computeDrawerPan,
  useSettingsDrawerCamera,
  type UseSettingsDrawerCameraArgs,
} from '@/components/settings/useSettingsDrawerCamera';
import {
  registerPanGetter,
  registerPanSetter,
} from '@/components/settings/panSetterRegistry';
import type { Point } from '@/utils/zoomPanMath';

const VW = 1280;
const VH = 800;
const DRAWER = 420;

const Probe: React.FC<UseSettingsDrawerCameraArgs> = (props) => {
  useSettingsDrawerCamera(props);
  return null;
};

let pan: Point;
let panCalls: Point[];
let unregisterSetter: () => void;
let unregisterGetter: () => void;

// Mirrors real DashboardView: the setter always produces a NEW object and
// fires 'board-pan' on every call, even when x/y are unchanged by value —
// only reads through the dedicated getter avoid triggering it. A mock that
// no-ops on unchanged values hides the bug where reading pan through the
// setter's identity-updater path gets misclassified as a user pan.
const setupHost = (): void => {
  pan = { x: 0, y: 0 };
  panCalls = [];
  unregisterSetter = registerPanSetter((next) => {
    const value = typeof next === 'function' ? next(pan) : next;
    pan = { x: value.x, y: value.y };
    panCalls.push(pan);
    window.dispatchEvent(new CustomEvent('board-pan'));
  });
  unregisterGetter = registerPanGetter(() => pan);
};

const reducedMotion = (matches: boolean): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  );
};

const flushFrames = async (count = 4): Promise<void> => {
  for (let i = 0; i < count; i += 1) {
    await act(async () => {
      await new Promise((resolve) =>
        requestAnimationFrame(() => resolve(null))
      );
    });
  }
};

const baseProps: UseSettingsDrawerCameraArgs = {
  widgetId: 'w1',
  open: true,
  originatedLocally: true,
  placement: 'right',
  needsPan: true,
  rect: { left: 700, top: 100, width: 500, height: 300 },
  drawerWidth: DRAWER,
  zoom: 1,
};

describe('computeDrawerPan', () => {
  const rect = { left: 700, top: 100, width: 500, height: 300 };

  it.each([0.5, 1, 2])(
    'shifts the widget into the free band at zoom %s',
    (zoom) => {
      const currentPan = { x: 0, y: 0 };
      const next = computeDrawerPan({
        rect,
        currentPan,
        zoom,
        viewportWidth: VW,
        viewportHeight: VH,
        drawerWidth: DRAWER,
        side: 'right',
      });
      const bandMax = VW - DRAWER;
      const targetLeft = bandMax - rect.width;
      // Pan is a viewport-space translation, so the delta is zoom-independent
      // once clamping allows it.
      const expected = Math.max(
        -Math.max(0, (VW * (zoom / 0.5 - 1)) / 2),
        targetLeft - rect.left
      );
      expect(next.x).toBeCloseTo(expected, 5);
      expect(next.y).toBe(0);
    }
  );

  it('aligns the left edge when the widget is wider than the band', () => {
    const next = computeDrawerPan({
      rect: { left: 300, top: 0, width: 1000, height: 300 },
      currentPan: { x: 0, y: 0 },
      zoom: 2,
      viewportWidth: VW,
      viewportHeight: VH,
      drawerWidth: DRAWER,
      side: 'right',
    });
    expect(next.x).toBeCloseTo(-300, 5);
  });

  it('clamps to the pan range', () => {
    const next = computeDrawerPan({
      rect: { left: 1200, top: 0, width: 400, height: 300 },
      currentPan: { x: 0, y: 0 },
      zoom: 1,
      viewportWidth: VW,
      viewportHeight: VH,
      drawerWidth: DRAWER,
      side: 'right',
    });
    expect(next.x).toBeGreaterThanOrEqual(-VW / 2);
  });
});

describe('useSettingsDrawerCamera', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: VW,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: VH,
      configurable: true,
    });
    setupHost();
    reducedMotion(true);
  });

  afterEach(() => {
    unregisterSetter();
    unregisterGetter();
    vi.unstubAllGlobals();
  });

  it('auto-pans on open and restores the camera on close', async () => {
    const view = render(<Probe {...baseProps} />);
    await flushFrames();
    expect(panCalls.length).toBeGreaterThan(0);
    expect(pan.x).toBeLessThan(0);

    view.rerender(<Probe {...baseProps} open={false} />);
    await flushFrames();
    expect(pan).toEqual({ x: 0, y: 0 });
  });

  it('does not restore after a manual pan while open', async () => {
    const view = render(<Probe {...baseProps} />);
    await flushFrames();
    const afterAutoPan = pan.x;
    expect(afterAutoPan).toBeLessThan(0);

    act(() => {
      pan = { x: afterAutoPan - 120, y: 0 };
      window.dispatchEvent(new CustomEvent('board-pan'));
    });

    view.rerender(<Probe {...baseProps} open={false} />);
    await flushFrames();
    expect(pan.x).toBe(afterAutoPan - 120);
  });

  it('never pans for a remote flip (originatedLocally false)', async () => {
    render(<Probe {...baseProps} originatedLocally={false} />);
    await flushFrames();
    expect(panCalls).toHaveLength(0);
  });

  it('never pans when the drawer is a bottom sheet', async () => {
    render(<Probe {...baseProps} placement="bottom" />);
    await flushFrames();
    expect(panCalls).toHaveLength(0);
  });

  it('does not pan when the chosen side needs none', async () => {
    render(<Probe {...baseProps} needsPan={false} />);
    await flushFrames();
    expect(panCalls).toHaveLength(0);
  });

  it('discards the saved camera on camera-reset', async () => {
    const view = render(<Probe {...baseProps} />);
    await flushFrames();
    const afterAutoPan = pan.x;

    act(() => {
      window.dispatchEvent(new CustomEvent('camera-reset'));
    });
    view.rerender(<Probe {...baseProps} open={false} />);
    await flushFrames();
    expect(pan.x).toBe(afterAutoPan);
  });

  it('skips the restore when the widget drag closed the drawer', async () => {
    const view = render(<Probe {...baseProps} />);
    await flushFrames();
    const afterAutoPan = pan.x;

    view.rerender(<Probe {...baseProps} open={false} restoreOnClose={false} />);
    await flushFrames();
    expect(pan.x).toBe(afterAutoPan);
  });

  it('never pans when only the drawer width changes (D24)', async () => {
    const view = render(<Probe {...baseProps} needsPan={false} />);
    await flushFrames();
    view.rerender(<Probe {...baseProps} needsPan={false} drawerWidth={560} />);
    await flushFrames();
    expect(panCalls).toHaveLength(0);
  });

  it('animates across frames when motion is allowed', async () => {
    reducedMotion(false);
    render(<Probe {...baseProps} />);
    await flushFrames(10);
    expect(panCalls.length).toBeGreaterThan(1);
  });

  it('restores exactly once with no user-pan misclassification (open with needsPan, then close)', async () => {
    const view = render(<Probe {...baseProps} />);
    await flushFrames();
    const afterAutoPan = pan.x;
    const callsAfterOpen = panCalls.length;
    expect(afterAutoPan).toBeLessThan(0);

    view.rerender(<Probe {...baseProps} open={false} />);
    await flushFrames();

    // Exactly one settle at the restored value: the read-only pan probe
    // during auto-pan must not have been misclassified as a user pan.
    expect(pan).toEqual({ x: 0, y: 0 });
    expect(panCalls.length).toBeGreaterThan(callsAfterOpen);
    expect(panCalls[panCalls.length - 1]).toEqual({ x: 0, y: 0 });
  });

  it('records the new board id when a board switch and open land in the same commit', async () => {
    const view = render(
      <Probe {...baseProps} open={false} boardId="board-a" />
    );
    act(() => {
      view.rerender(<Probe {...baseProps} open boardId="board-b" />);
    });
    await flushFrames();

    view.rerender(<Probe {...baseProps} open={false} boardId="board-b" />);
    await flushFrames();
    // Restore fires because the close boardId matches the board that was
    // current (board-b) when the drawer opened, not a stale board-a capture.
    expect(pan).toEqual({ x: 0, y: 0 });
  });
});
