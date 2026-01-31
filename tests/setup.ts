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
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setPointerCapture: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  releasePointerCapture: () => {},
  hasPointerCapture: () => false,
});

// Mock HTMLCanvasElement.prototype.getContext to silence warnings and support basic drawing calls
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === '2d') {
    return {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      // Add other methods/properties as needed
      canvas: { width: 0, height: 0 },
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      set lineCap(_val: string) {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      set lineJoin(_val: string) {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      set globalCompositeOperation(_val: string) {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      set strokeStyle(_val: string) {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      set fillStyle(_val: string) {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      set lineWidth(_val: number) {},
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;
