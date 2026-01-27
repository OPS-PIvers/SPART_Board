import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { DrawingWidget } from './DrawingWidget';
import { WidgetData, DrawingConfig, Dashboard } from '../../types';
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

// Mock Portal for "Overlay" mode
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<any>();
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
      widgets: [],
    };

    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: mockActiveDashboard as Dashboard,
    });

    (useAuth as Mock).mockReturnValue({
      user: { uid: 'test-user' },
    });

    (useLiveSession as Mock).mockReturnValue({
      session: { isActive: false },
      startSession: vi.fn(),
      endSession: vi.fn(),
    });

    (useScreenshot as Mock).mockReturnValue({
      takeScreenshot: vi.fn(),
      isCapturing: false,
    });
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
      w: 400,
      h: 300,
      z: 1,
      config: {
        mode: 'window',
        color: '#000000',
        width: 4,
        paths: [],
        ...config,
      },
    } as WidgetData;
  };

  it('renders canvas in window mode', () => {
    render(<DrawingWidget widget={createWidget()} />);
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('draws on canvas and calls updateWidget on end', () => {
    const widget = createWidget();
    render(<DrawingWidget widget={widget} />);
    const canvas = document.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    // Simulate drawing
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });
    fireEvent.mouseUp(canvas);

    expect(mockUpdateWidget).toHaveBeenCalled();
    const callArgs = mockUpdateWidget.mock.calls[0];
    expect(callArgs[0]).toBe('drawing-1');
    const newConfig = callArgs[1].config as DrawingConfig;
    expect(newConfig.paths).toHaveLength(1);
    expect(newConfig.paths[0].points.length).toBeGreaterThan(0);
  });
});
