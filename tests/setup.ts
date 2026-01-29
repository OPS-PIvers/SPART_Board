import '@testing-library/jest-dom';

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
