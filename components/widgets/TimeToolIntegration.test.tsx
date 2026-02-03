import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, cleanup, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimeToolWidget } from './TimeToolWidget';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TimeToolConfig, DEFAULT_GLOBAL_STYLE, WidgetType } from '../../types';

vi.mock('../../context/useDashboard');
vi.mock('../../utils/timeToolAudio', () => ({
  playTimerAlert: vi.fn(),
  resumeAudio: vi.fn().mockResolvedValue(undefined),
}));

const mockUpdateWidget = vi.fn();

const createDashboardContext = (widgets: { id: string, type: WidgetType, config: any }[] = []) => ({
  activeDashboard: {
    widgets: widgets,
    globalStyle: DEFAULT_GLOBAL_STYLE,
  },
  updateWidget: mockUpdateWidget,
});

const createWidget = (config: Partial<TimeToolConfig> = {}): WidgetData => {
  return {
    id: 'timetool-1',
    type: 'time-tool',
    x: 0,
    y: 0,
    w: 4,
    h: 4,
    z: 1,
    config: {
      mode: 'timer',
      visualType: 'digital',
      theme: 'light',
      duration: 100,
      elapsedTime: 100,
      isRunning: false,
      selectedSound: 'Chime',
      timerTrafficLightControl: true, // Enabled
      startTime: null,
      ...config,
    },
  } as WidgetData;
};

describe('TimeToolWidget Nexus Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('sets traffic light to GREEN when timer starts', async () => {
    // Use real timers for async operations to avoid confusion with waitFor
    vi.useRealTimers();

    const trafficWidget = { id: 'traffic-1', type: 'traffic' as WidgetType, config: { active: 'none' } };
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createDashboardContext([trafficWidget])
    );

    render(<TimeToolWidget widget={createWidget()} />);

    const startButton = screen.getByText('START');
    await act(async () => {
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(mockUpdateWidget).toHaveBeenCalledWith(
        'traffic-1',
        expect.objectContaining({
          config: expect.objectContaining({ active: 'green' }),
        })
      );
    });
  });

  it('sets traffic light to YELLOW when timer reaches 20%', () => {
    const trafficWidget = { id: 'traffic-1', type: 'traffic' as WidgetType, config: { active: 'green' } };
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createDashboardContext([trafficWidget])
    );

    // Start with 21 seconds remaining (duration 100) -> 21%
    const widget = createWidget({
      duration: 100,
      elapsedTime: 21,
      isRunning: true,
      startTime: Date.now()
    });

    render(<TimeToolWidget widget={widget} />);

    // Advance 2 seconds. 21 -> 19. 19/100 = 0.19 (< 0.20)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-1',
      expect.objectContaining({
        config: expect.objectContaining({ active: 'yellow' }),
      })
    );
  });

  it('sets traffic light to RED when timer ends', () => {
    const trafficWidget = { id: 'traffic-1', type: 'traffic' as WidgetType, config: { active: 'yellow' } };
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createDashboardContext([trafficWidget])
    );

    // Start with 1 second remaining
    const widget = createWidget({
      duration: 100,
      elapsedTime: 1,
      isRunning: true,
      startTime: Date.now()
    });

    render(<TimeToolWidget widget={widget} />);

    // Advance 2 seconds -> should hit 0
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-1',
      expect.objectContaining({
        config: expect.objectContaining({ active: 'red' }),
      })
    );
  });
});
