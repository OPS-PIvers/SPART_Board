import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { DrawingWidget } from './DrawingWidget';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { useLiveSession } from '../../hooks/useLiveSession';
import { useScreenshot } from '../../hooks/useScreenshot';
import { WidgetData, DrawingConfig } from '../../types';

vi.mock('../../context/useDashboard');
vi.mock('../../context/useAuth');
vi.mock('../../hooks/useLiveSession');
vi.mock('../../hooks/useScreenshot');

const mockUpdateWidget = vi.fn();

const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
  activeDashboard: {
    background: 'bg-white',
  },
};

const mockAuthContext = {
  user: { uid: 'user-1' },
};

const mockSession = {
  isActive: false,
};

const mockLiveSession = {
  session: mockSession,
  startSession: vi.fn(),
  endSession: vi.fn(),
};

const mockScreenshot = {
  takeScreenshot: vi.fn(),
  isCapturing: false,
};

describe('DrawingWidget', () => {
  beforeEach(() => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockAuthContext
    );
    (useLiveSession as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockLiveSession
    );
    (useScreenshot as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockScreenshot
    );
    mockUpdateWidget.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
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
      flipped: false,
      config: {
        mode: 'window',
        color: '#000000',
        width: 4,
        paths: [],
        ...config,
      },
    } as WidgetData;
  };

  it('renders without crashing', () => {
    render(<DrawingWidget widget={createWidget()} />);
  });

  it('draws imperatively on mouse move without calling updateWidget immediately', () => {
    const widget = createWidget();
    const { container } = render(<DrawingWidget widget={widget} />);

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    if (!canvas) throw new Error('Canvas not found');

    // Mock getContext
    const mockContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      canvas: { width: 400, height: 260 },
    };

    vi.spyOn(canvas, 'getContext').mockReturnValue(
      mockContext as unknown as CanvasRenderingContext2D
    );
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      bottom: 300,
      right: 400,
      x: 0,
      y: 0,
      toJSON: () => {
        return {};
      },
    });

    // Mouse Down
    fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });

    // Mouse Move (1st move, length 2, should draw)
    fireEvent.mouseMove(canvas, { clientX: 20, clientY: 20 });

    // Verify imperative drawing calls
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.moveTo).toHaveBeenCalledWith(10, 10);
    expect(mockContext.lineTo).toHaveBeenCalledWith(20, 20);
    expect(mockContext.stroke).toHaveBeenCalled();

    // Verify updateWidget is NOT called during move
    expect(mockUpdateWidget).not.toHaveBeenCalled();

    // Mouse Up
    fireEvent.mouseUp(canvas);

    // Verify updateWidget IS called after mouse up
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      widget.id,
      expect.objectContaining({
        config: expect.objectContaining({
          paths: expect.arrayContaining([
            expect.objectContaining({
              points: expect.arrayContaining([
                expect.objectContaining({ x: 10, y: 10 }),
                expect.objectContaining({ x: 20, y: 20 }),
              ]),
            }),
          ]),
        }),
      })
    );
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  });
});
