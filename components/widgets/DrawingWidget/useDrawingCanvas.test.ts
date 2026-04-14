import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useDrawingCanvas } from './useDrawingCanvas';
import type {
  ArrowObject,
  DrawableObject,
  EllipseObject,
  LineObject,
  PathObject,
  RectObject,
} from '@/types';

interface MockCtx {
  clearRect: Mock;
  beginPath: Mock;
  moveTo: Mock;
  lineTo: Mock;
  stroke: Mock;
  fill: Mock;
  fillRect: Mock;
  strokeRect: Mock;
  ellipse: Mock;
  closePath: Mock;
  save: Mock;
  restore: Mock;
  canvas: { width: number; height: number };
  lineCap: string;
  lineJoin: string;
  globalCompositeOperation: string;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
}

const makeMockCtx = (): MockCtx => ({
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  ellipse: vi.fn(),
  closePath: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  canvas: { width: 800, height: 600 },
  lineCap: 'round',
  lineJoin: 'round',
  globalCompositeOperation: 'source-over',
  strokeStyle: '#000000',
  fillStyle: '#000000',
  lineWidth: 1,
});

const makeCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas;
};

const pathObj = (overrides: Partial<PathObject> = {}): PathObject => ({
  id: 'obj-1',
  kind: 'path',
  z: 0,
  points: [
    { x: 0, y: 0 },
    { x: 10, y: 10 },
  ],
  color: '#f00',
  width: 4,
  ...overrides,
});

describe('useDrawingCanvas', () => {
  let mockCtx: MockCtx;

  beforeEach(() => {
    mockCtx = makeMockCtx();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      mockCtx as unknown as CanvasRenderingContext2D
    );
    vi.spyOn(
      HTMLCanvasElement.prototype,
      'getBoundingClientRect'
    ).mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders existing path objects on mount', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const objects: DrawableObject[] = [
      pathObj({
        points: [
          { x: 3, y: 3 },
          { x: 7, y: 7 },
        ],
      }),
    ];

    renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#000',
        width: 4,
        objects,
        onObjectComplete: vi.fn(),
        canvasSize: { width: 800, height: 600 },
        nextZ: 1,
      })
    );

    expect(mockCtx.clearRect).toHaveBeenCalled();
    expect(mockCtx.moveTo).toHaveBeenCalledWith(3, 3);
    expect(mockCtx.lineTo).toHaveBeenCalledWith(7, 7);
    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('ignores empty path objects (fewer than 2 points)', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const objects: DrawableObject[] = [pathObj({ points: [{ x: 0, y: 0 }] })];

    renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#000',
        width: 4,
        objects,
        onObjectComplete: vi.fn(),
        canvasSize: { width: 800, height: 600 },
        nextZ: 1,
      })
    );

    // Clear + set up draw, but never strokes a degenerate path
    expect(mockCtx.stroke).not.toHaveBeenCalled();
  });

  it('renders in z-order (low z first so higher z overlays)', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const objects: DrawableObject[] = [
      pathObj({
        id: 'b',
        z: 5,
        points: [
          { x: 100, y: 100 },
          { x: 200, y: 200 },
        ],
      }),
      pathObj({
        id: 'a',
        z: 1,
        points: [
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ],
      }),
    ];

    renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#000',
        width: 4,
        objects,
        onObjectComplete: vi.fn(),
        canvasSize: { width: 800, height: 600 },
        nextZ: 6,
      })
    );

    const moveCalls = mockCtx.moveTo.mock.calls;
    // First moveTo should be the low-z object (z:1 at 1,1), then the high-z one
    expect(moveCalls[0]).toEqual([1, 1]);
    expect(moveCalls[1]).toEqual([100, 100]);
  });

  it('uses destination-out composite op for eraser paths', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const objects: DrawableObject[] = [
      pathObj({
        color: 'eraser',
        points: [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
        ],
      }),
    ];

    renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#000',
        width: 4,
        objects,
        onObjectComplete: vi.fn(),
        canvasSize: { width: 800, height: 600 },
        nextZ: 1,
      })
    );

    expect(mockCtx.stroke).toHaveBeenCalled();
  });

  it('on pointerup emits a new PathObject with kind=path, supplied id, and nextZ', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();
    const generateId = vi.fn(() => 'deterministic-id');

    const { result } = renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#123',
        width: 7,
        objects: [],
        onObjectComplete,
        canvasSize: { width: 800, height: 600 },
        generateId,
        nextZ: 42,
      })
    );

    const mkEvent = (clientX: number, clientY: number) =>
      ({
        clientX,
        clientY,
        pointerId: 1,
      }) as unknown as React.PointerEvent;

    act(() => result.current.handleStart(mkEvent(2, 3)));
    act(() => result.current.handleMove(mkEvent(5, 6)));
    act(() => result.current.handleEnd());

    expect(onObjectComplete).toHaveBeenCalledTimes(1);
    const emitted = onObjectComplete.mock.calls[0][0] as PathObject;
    expect(emitted).toMatchObject({
      id: 'deterministic-id',
      kind: 'path',
      z: 42,
      color: '#123',
      width: 7,
    });
    expect(emitted.points).toEqual([
      { x: 2, y: 3 },
      { x: 5, y: 6 },
    ]);
  });

  it('does not emit a path when pointer barely moves (<2 points)', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();

    const { result } = renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#000',
        width: 4,
        objects: [],
        onObjectComplete,
        canvasSize: { width: 800, height: 600 },
        nextZ: 0,
      })
    );

    const mkEvent = (x: number, y: number) =>
      ({ clientX: x, clientY: y }) as unknown as React.PointerEvent;
    act(() => result.current.handleStart(mkEvent(1, 1)));
    act(() => result.current.handleEnd());

    expect(onObjectComplete).not.toHaveBeenCalled();
  });

  it('is a no-op when disabled (student view)', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();

    const { result } = renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#000',
        width: 4,
        objects: [],
        onObjectComplete,
        disabled: true,
        canvasSize: { width: 800, height: 600 },
        nextZ: 0,
      })
    );

    const mkEvent = (x: number, y: number) =>
      ({ clientX: x, clientY: y }) as unknown as React.PointerEvent;
    act(() => result.current.handleStart(mkEvent(0, 0)));
    act(() => result.current.handleMove(mkEvent(10, 10)));
    act(() => result.current.handleEnd());

    expect(onObjectComplete).not.toHaveBeenCalled();
    expect(result.current.isDrawing).toBe(false);
  });

  it('divides pointer coordinates by the supplied scale factor', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();

    const { result } = renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#000',
        width: 4,
        objects: [],
        onObjectComplete,
        scale: 2, // half the on-screen coords
        canvasSize: { width: 800, height: 600 },
        nextZ: 0,
      })
    );

    const mkEvent = (x: number, y: number) =>
      ({ clientX: x, clientY: y }) as unknown as React.PointerEvent;
    act(() => result.current.handleStart(mkEvent(100, 200)));
    act(() => result.current.handleMove(mkEvent(300, 400)));
    act(() => result.current.handleEnd());

    const emitted = onObjectComplete.mock.calls[0][0] as PathObject;
    expect(emitted.points).toEqual([
      { x: 50, y: 100 },
      { x: 150, y: 200 },
    ]);
  });

  // --- 2.1b: Shape tool tests ---

  const mkEvent = (clientX: number, clientY: number) =>
    ({ clientX, clientY }) as unknown as React.PointerEvent;

  it('rect drag right-down emits a RectObject with correct {x, y, w, h}', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();
    const generateId = vi.fn(() => 'rect-id');

    const { result } = renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#f00',
        width: 2,
        objects: [],
        onObjectComplete,
        canvasSize: { width: 800, height: 600 },
        generateId,
        nextZ: 1,
        activeTool: 'rect',
      })
    );

    act(() => result.current.handleStart(mkEvent(10, 20)));
    act(() => result.current.handleMove(mkEvent(110, 70)));
    act(() => result.current.handleEnd());

    expect(onObjectComplete).toHaveBeenCalledTimes(1);
    const emitted = onObjectComplete.mock.calls[0][0] as RectObject;
    expect(emitted.kind).toBe('rect');
    expect(emitted.id).toBe('rect-id');
    expect(emitted.z).toBe(1);
    expect(emitted.x).toBe(10);
    expect(emitted.y).toBe(20);
    expect(emitted.w).toBe(100);
    expect(emitted.h).toBe(50);
    expect(emitted.stroke).toBe('#f00');
    expect(emitted.strokeWidth).toBe(2);
  });

  it('rect drag up-left (inverted) produces normalized w >= 0 and h >= 0', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();

    const { result } = renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#000',
        width: 1,
        objects: [],
        onObjectComplete,
        canvasSize: { width: 800, height: 600 },
        nextZ: 0,
        activeTool: 'rect',
      })
    );

    // Drag from (200, 150) to (50, 30) — up-left
    act(() => result.current.handleStart(mkEvent(200, 150)));
    act(() => result.current.handleMove(mkEvent(50, 30)));
    act(() => result.current.handleEnd());

    const emitted = onObjectComplete.mock.calls[0][0] as RectObject;
    expect(emitted.x).toBe(50);
    expect(emitted.y).toBe(30);
    expect(emitted.w).toBe(150);
    expect(emitted.h).toBe(120);
    expect(emitted.w).toBeGreaterThanOrEqual(0);
    expect(emitted.h).toBeGreaterThanOrEqual(0);
  });

  it('ellipse drag emits an EllipseObject with correct geometry', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();

    const { result } = renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#0f0',
        width: 3,
        objects: [],
        onObjectComplete,
        canvasSize: { width: 800, height: 600 },
        nextZ: 0,
        activeTool: 'ellipse',
      })
    );

    act(() => result.current.handleStart(mkEvent(40, 50)));
    act(() => result.current.handleMove(mkEvent(140, 100)));
    act(() => result.current.handleEnd());

    const emitted = onObjectComplete.mock.calls[0][0] as EllipseObject;
    expect(emitted.kind).toBe('ellipse');
    expect(emitted.x).toBe(40);
    expect(emitted.y).toBe(50);
    expect(emitted.w).toBe(100);
    expect(emitted.h).toBe(50);
  });

  it('line drag emits a LineObject with {x1, y1, x2, y2}', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();

    const { result } = renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#00f',
        width: 2,
        objects: [],
        onObjectComplete,
        canvasSize: { width: 800, height: 600 },
        nextZ: 5,
        activeTool: 'line',
      })
    );

    act(() => result.current.handleStart(mkEvent(10, 10)));
    act(() => result.current.handleMove(mkEvent(90, 50)));
    act(() => result.current.handleEnd());

    const emitted = onObjectComplete.mock.calls[0][0] as LineObject;
    expect(emitted.kind).toBe('line');
    expect(emitted.x1).toBe(10);
    expect(emitted.y1).toBe(10);
    expect(emitted.x2).toBe(90);
    expect(emitted.y2).toBe(50);
    expect(emitted.z).toBe(5);
  });

  it('arrow drag emits an ArrowObject', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();

    const { result } = renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#ff0',
        width: 3,
        objects: [],
        onObjectComplete,
        canvasSize: { width: 800, height: 600 },
        nextZ: 0,
        activeTool: 'arrow',
      })
    );

    act(() => result.current.handleStart(mkEvent(20, 20)));
    act(() => result.current.handleMove(mkEvent(80, 60)));
    act(() => result.current.handleEnd());

    const emitted = onObjectComplete.mock.calls[0][0] as ArrowObject;
    expect(emitted.kind).toBe('arrow');
    expect(emitted.x1).toBe(20);
    expect(emitted.y1).toBe(20);
    expect(emitted.x2).toBe(80);
    expect(emitted.y2).toBe(60);
  });

  it('degenerate shape (start === end) does not emit an object', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();

    for (const activeTool of ['rect', 'ellipse', 'line', 'arrow'] as const) {
      onObjectComplete.mockClear();
      const { result } = renderHook(() =>
        useDrawingCanvas({
          canvasRef,
          color: '#000',
          width: 2,
          objects: [],
          onObjectComplete,
          canvasSize: { width: 800, height: 600 },
          nextZ: 0,
          activeTool,
        })
      );

      // Pointer down and immediately up at same position
      act(() => result.current.handleStart(mkEvent(50, 50)));
      act(() => result.current.handleEnd());

      expect(onObjectComplete).not.toHaveBeenCalled();
    }
  });

  it('shapeFill: true emits RectObject with fill === color', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();

    const { result } = renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#abc',
        width: 2,
        objects: [],
        onObjectComplete,
        canvasSize: { width: 800, height: 600 },
        nextZ: 0,
        activeTool: 'rect',
        shapeFill: true,
      })
    );

    act(() => result.current.handleStart(mkEvent(0, 0)));
    act(() => result.current.handleMove(mkEvent(100, 100)));
    act(() => result.current.handleEnd());

    const emitted = onObjectComplete.mock.calls[0][0] as RectObject;
    expect(emitted.fill).toBe('#abc');
  });

  it('shapeFill: false emits RectObject with fill === undefined', () => {
    const canvas = makeCanvas();
    const canvasRef = { current: canvas };
    const onObjectComplete = vi.fn();

    const { result } = renderHook(() =>
      useDrawingCanvas({
        canvasRef,
        color: '#abc',
        width: 2,
        objects: [],
        onObjectComplete,
        canvasSize: { width: 800, height: 600 },
        nextZ: 0,
        activeTool: 'rect',
        shapeFill: false,
      })
    );

    act(() => result.current.handleStart(mkEvent(0, 0)));
    act(() => result.current.handleMove(mkEvent(100, 100)));
    act(() => result.current.handleEnd());

    const emitted = onObjectComplete.mock.calls[0][0] as RectObject;
    expect(emitted.fill).toBeUndefined();
  });
});
