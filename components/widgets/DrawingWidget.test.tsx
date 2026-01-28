import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DrawingWidget } from './DrawingWidget';
import { WidgetData } from '../../types';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { useLiveSession } from '../../hooks/useLiveSession';
import { useScreenshot } from '../../hooks/useScreenshot';

// Mock hooks
vi.mock('../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));
vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));
vi.mock('../../hooks/useLiveSession', () => ({
  useLiveSession: vi.fn(),
}));
vi.mock('../../hooks/useScreenshot', () => ({
  useScreenshot: vi.fn(),
}));

describe('DrawingWidget', () => {
  let mockUpdateWidget: Mock;
  let mockContext: any;

  beforeEach(() => {
    mockUpdateWidget = vi.fn();
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: { background: 'bg-slate-900' },
    });
    (useAuth as Mock).mockReturnValue({ user: { uid: 'user1' } });
    (useLiveSession as Mock).mockReturnValue({
      session: null,
      startSession: vi.fn(),
      endSession: vi.fn(),
    });
    (useScreenshot as Mock).mockReturnValue({
      takeScreenshot: vi.fn(),
      isCapturing: false,
    });

    // Mock Canvas
    mockContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      canvas: { width: 800, height: 600 },
      // Mock setters
      set lineCap(val: string) {},
      set lineJoin(val: string) {},
      set globalCompositeOperation(val: string) {},
      set strokeStyle(val: string) {},
      set lineWidth(val: number) {},
    };

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as DOMRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const widget: WidgetData = {
    id: 'drawing-1',
    type: 'drawing',
    x: 0,
    y: 0,
    w: 400,
    h: 300,
    z: 1,
    config: {
      mode: 'window',
      color: '#000000',
      width: 4,
      paths: [],
      customColors: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'],
    },
  };

  it('renders without crashing', () => {
    render(<DrawingWidget widget={widget} />);
    expect(mockContext.clearRect).toHaveBeenCalled();
  });

  it('draws existing paths on mount', () => {
    const widgetWithPaths: WidgetData = {
      ...widget,
      config: {
        ...widget.config,
        paths: [
          {
            color: '#ff0000',
            width: 5,
            points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
          },
        ],
      },
    };
    render(<DrawingWidget widget={widgetWithPaths} />);
    expect(mockContext.moveTo).toHaveBeenCalledWith(10, 10);
    expect(mockContext.lineTo).toHaveBeenCalledWith(20, 20);
    expect(mockContext.stroke).toHaveBeenCalled();
  });

  it('handles drawing interaction', () => {
    const { container } = render(<DrawingWidget widget={widget} />);
    const canvas = container.querySelector('canvas')!;

    // Start
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });

    // Move
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });

    // End
    fireEvent.mouseUp(canvas);

    // Should update widget with new path
    expect(mockUpdateWidget).toHaveBeenCalled();
    const args = mockUpdateWidget.mock.calls[0];
    expect(args[0]).toBe(widget.id);
    const newConfig = args[1].config;
    expect(newConfig.paths).toHaveLength(1);
    expect(newConfig.paths[0].points).toEqual([{ x: 10, y: 10 }, { x: 20, y: 20 }]);
  });
});
