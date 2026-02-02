import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock PointerEvent globally since JSDOM doesn't fully support it
class MockPointerEvent extends Event {
  clientX: number;
  clientY: number;
  pointerId: number;
  constructor(type: string, props: PointerEventInit = {}) {
    super(type, { bubbles: true, ...props });
    this.clientX = props.clientX ?? 0;
    this.clientY = props.clientY ?? 0;
    this.pointerId = props.pointerId ?? 1;
  }
}
window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;

// Mock Pointer Capture methods on Element.prototype
Object.assign(Element.prototype, {
  setPointerCapture: vi.fn(),
  releasePointerCapture: vi.fn(),
  hasPointerCapture: vi.fn(() => false),
});

// Mock HTMLCanvasElement.prototype.getContext to silence warnings and support basic drawing calls
HTMLCanvasElement.prototype.getContext = vi.fn(function (
  this: HTMLCanvasElement,
  contextId: string
) {
  if (contextId === '2d') {
    const context = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      // Use the actual canvas element for the canvas property
      canvas: this,

      // Internal storage for properties
      _lineCap: 'butt',
      _lineJoin: 'miter',
      _globalCompositeOperation: 'source-over',
      _strokeStyle: '#000000',
      _fillStyle: '#000000',
      _lineWidth: 1,

      // Getters and Setters
      get lineCap() {
        return this._lineCap;
      },
      set lineCap(val: string) {
        this._lineCap = val;
      },

      get lineJoin() {
        return this._lineJoin;
      },
      set lineJoin(val: string) {
        this._lineJoin = val;
      },

      get globalCompositeOperation() {
        return this._globalCompositeOperation;
      },
      set globalCompositeOperation(val: string) {
        this._globalCompositeOperation = val;
      },

      get strokeStyle() {
        return this._strokeStyle;
      },
      set strokeStyle(val: string) {
        this._strokeStyle = val;
      },

      get fillStyle() {
        return this._fillStyle;
      },
      set fillStyle(val: string) {
        this._fillStyle = val;
      },

      get lineWidth() {
        return this._lineWidth;
      },
      set lineWidth(val: number) {
        this._lineWidth = val;
      },
    };

    return context as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
