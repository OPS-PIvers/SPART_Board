import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimeTool } from './useTimeTool';
import { useDashboard } from '@/context/useDashboard';
import {
  WidgetData,
  TimeToolConfig,
  TrafficConfig,
  DEFAULT_GLOBAL_STYLE,
} from '@/types';

vi.mock('@/context/useDashboard');
vi.mock('@/utils/timeToolAudio', () => ({
  playTimerAlert: vi.fn(),
  resumeAudio: vi.fn().mockResolvedValue(undefined),
}));

const mockUpdateWidget = vi.fn();
const mockTrafficWidget: WidgetData = {
  id: 'traffic-1',
  type: 'traffic',
  x: 0,
  y: 0,
  w: 2,
  h: 2,
  z: 1,
  flipped: false,
  config: { active: 'green' } as TrafficConfig,
};

const mockDashboardContext = {
  activeDashboard: {
    widgets: [mockTrafficWidget],
    globalStyle: DEFAULT_GLOBAL_STYLE,
  },
  updateWidget: mockUpdateWidget,
};

describe('useTimeTool Connection (Nexus)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createWidget = (config: Partial<TimeToolConfig> = {}): WidgetData => {
    return {
      id: 'timetool-1',
      type: 'time-tool',
      x: 0,
      y: 0,
      w: 400,
      h: 400,
      z: 1,
      flipped: false,
      config: {
        mode: 'timer',
        visualType: 'digital',
        duration: 5,
        elapsedTime: 5,
        isRunning: false,
        selectedSound: 'Chime',
        ...config,
      },
    } as WidgetData;
  };

  it('updates traffic light to RED when timer ends', () => {
    const widget = createWidget({
      isRunning: true,
      startTime: Date.now(),
      timerEndTrafficColor: 'red',
    });

    renderHook(() => useTimeTool(widget));

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-1',

      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        config: expect.objectContaining({
          active: 'red',
        }),
      })
    );
  });

  it('updates traffic light to YELLOW when timer ends', () => {
    const widget = createWidget({
      isRunning: true,
      startTime: Date.now(),
      timerEndTrafficColor: 'yellow',
    });

    renderHook(() => useTimeTool(widget));

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-1',

      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        config: expect.objectContaining({
          active: 'yellow',
        }),
      })
    );
  });

  it('does NOT update traffic light if timerEndTrafficColor is NULL', () => {
    const widget = createWidget({
      isRunning: true,
      startTime: Date.now(),
      timerEndTrafficColor: null,
    });

    renderHook(() => useTimeTool(widget));

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Should call updateWidget to stop the timer, but NOT for the traffic light
    expect(mockUpdateWidget).not.toHaveBeenCalledWith(
      'traffic-1',
      expect.anything()
    );
  });

  it('handles missing traffic light widget gracefully', () => {
    // Override context to have NO widgets
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...mockDashboardContext,
      activeDashboard: {
        ...mockDashboardContext.activeDashboard,
        widgets: [],
      },
    });

    const widget = createWidget({
      isRunning: true,
      startTime: Date.now(),
      timerEndTrafficColor: 'red',
    });

    renderHook(() => useTimeTool(widget));

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Should run without error, but updateWidget should NOT be called for any traffic light
    expect(mockUpdateWidget).not.toHaveBeenCalledWith(
      expect.stringMatching(/^traffic/),
      expect.anything()
    );
  });
});
