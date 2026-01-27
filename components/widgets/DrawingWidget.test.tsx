import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DrawingWidget } from './DrawingWidget';
import { WidgetData, DrawingConfig, Dashboard, Point } from '../../types';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { useLiveSession } from '../../hooks/useLiveSession';
import { useScreenshot } from '../../hooks/useScreenshot';

// Mocks
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

// Mock createPortal since we use it in overlay mode
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('DrawingWidget', () => {
  let mockUpdateWidget: Mock;
  let mockActiveDashboard: Partial<Dashboard>;

  beforeEach(() => {
    mockUpdateWidget = vi.fn();
    mockActiveDashboard = {
      background: 'default',
      widgets: [],
    };

    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: mockActiveDashboard,
    });

    (useAuth as Mock).mockReturnValue({
      user: { uid: 'test-user' },
    });

    (useLiveSession as Mock).mockReturnValue({
      session: null,
      startSession: vi.fn(),
      endSession: vi.fn(),
    });

    (useScreenshot as Mock).mockReturnValue({
      takeScreenshot: vi.fn(),
      isCapturing: false,
    });

    // Mock Canvas Context
    const mockContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      canvas: { width: 800, height: 600 },
    };

    HTMLCanvasElement.prototype.getContext = vi.fn((contextId) => {
      if (contextId === '2d') {
        return mockContext as unknown as CanvasRenderingContext2D;
      }
      return null;
    });

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createWidget = (config: Partial<DrawingConfig> = {}): WidgetData => {
    return {
      id: 'drawing-1',
      type: 'drawing',
      x: 0,
      y: 0,
      w: 800,
      h: 600,
      z: 1,
      config: {
        mode: 'window',
        color: '#000000',
        width: 4,
        paths: [],
        customColors: ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        ...config,
      },
    } as WidgetData;
  };

  it('renders correctly in window mode', () => {
    render(<DrawingWidget widget={createWidget()} />);
    // Check if canvas is rendered
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('draws a path and updates widget config on mouse up', () => {
    render(<DrawingWidget widget={createWidget()} />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    if (!canvas) return;

    // Simulate drawing
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseMove(canvas, { clientX: 30, clientY: 30 });
    fireEvent.mouseUp(canvas);

    expect(mockUpdateWidget).toHaveBeenCalledTimes(1);

    // Check the payload
    const updateCall = mockUpdateWidget.mock.calls[0] as [
      string,
      { config: DrawingConfig },
    ];
    const widgetId = updateCall[0];
    const updatePayload = updateCall[1];
    const config = updatePayload.config;

    expect(widgetId).toBe('drawing-1');
    expect(config.paths).toHaveLength(1);
    const newPath = config.paths[0];
    expect(newPath.points.length).toBeGreaterThan(1);
    expect(newPath.points[0]).toEqual({ x: 10, y: 10 } as Point);
    // Note: getBoundingClientRect is mocked to 0,0, so clientX is relative to 0,0
  });

  it('does not update widget if no drawing happened (click without move)', () => {
    render(<DrawingWidget widget={createWidget()} />);
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseUp(canvas);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });
});
