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
    return {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      // Use the actual canvas element for the canvas property
      canvas: this,
      // Use vi.fn() for setters to allow tracking and avoid empty function warnings
      set lineCap(_val: string) {
        vi.fn()(_val);
      },
      set lineJoin(_val: string) {
        vi.fn()(_val);
      },
      set globalCompositeOperation(_val: string) {
        vi.fn()(_val);
      },
      set strokeStyle(_val: string) {
        vi.fn()(_val);
      },
      set fillStyle(_val: string) {
        vi.fn()(_val);
      },
      set lineWidth(_val: number) {
        vi.fn()(_val);
      },
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
