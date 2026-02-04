import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSchedule } from './useSchedule';
import { useDashboard } from '../../../context/useDashboard';
import { ScheduleConfig } from '../../../types';

vi.mock('../../../context/useDashboard');

const mockUpdateWidget = vi.fn();
const mockAddWidget = vi.fn();
const mockRemoveWidget = vi.fn();

const mockDashboardContext = {
  activeDashboard: {
    widgets: [],
  },
  updateWidget: mockUpdateWidget,
  addWidget: mockAddWidget,
  removeWidget: mockRemoveWidget,
};

describe('useSchedule', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useDashboard as unknown as Mock).mockReturnValue(mockDashboardContext);
    mockUpdateWidget.mockClear();
    mockAddWidget.mockClear();
    mockRemoveWidget.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const widgetId = 'schedule-1';
  const createConfig = (
    overrides: Partial<ScheduleConfig> = {}
  ): ScheduleConfig => ({
    items: [],
    autoProgress: false,
    ...overrides,
  });

  it('calculates activeIndex correctly', () => {
    const config = createConfig({
      items: [
        { id: '1', time: '08:00', endTime: '09:00', task: 'Math' },
        { id: '2', time: '09:00', endTime: '10:00', task: 'Reading' },
      ],
    });

    const date = new Date();
    date.setHours(8, 30, 0, 0);
    vi.setSystemTime(date);

    const { result } = renderHook(() => useSchedule(widgetId, config));
    expect(result.current.activeIndex).toBe(0);

    act(() => {
      const nextDate = new Date();
      nextDate.setHours(9, 30, 0, 0);
      vi.setSystemTime(nextDate);
      // Fast forward time for the hook's internal clock if needed,
      // but activeIndex is memoized on 'now' which updates every 10s or 1s?
      // Actually useSchedule has a setNow(new Date()) in an effect for countdown,
      // but activeIndex uses a local 'now' in useMemo.
      // Wait, activeIndex useMemo depends on 'now'.
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.activeIndex).toBe(1);
  });

  it('auto-launches widgets and prevents race conditions', () => {
    const config = createConfig({
      items: [
        { id: '1', time: '09:00', task: 'Math', autoLaunchWidget: 'time-tool' },
      ],
    });

    const date = new Date();
    date.setHours(9, 0, 0, 0);
    vi.setSystemTime(date);

    renderHook(() => useSchedule(widgetId, config));

    act(() => {
      vi.advanceTimersByTime(1000); // Trigger checkEvents
    });

    expect(mockAddWidget).toHaveBeenCalledTimes(1);
    expect(mockAddWidget).toHaveBeenCalledWith('time-tool', expect.any(Object));

    // Subsequent checks in the same minute should not launch again
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockAddWidget).toHaveBeenCalledTimes(1);
  });

  it('handles malformed time strings gracefully', () => {
    const config = createConfig({
      items: [
        { id: '1', time: 'invalid', task: 'Bad' },
        { id: '2', time: '09:00', task: 'Good' },
      ],
    });

    const date = new Date();
    date.setHours(9, 0, 0, 0);
    vi.setSystemTime(date);

    const { result } = renderHook(() => useSchedule(widgetId, config));
    // Should skip 'invalid' and find 'Good'
    expect(result.current.activeIndex).toBe(1);
  });

  it('auto-closes widgets only if exactly one exists', () => {
    const config = createConfig({
      items: [
        {
          id: '1',
          time: '08:00',
          endTime: '09:00',
          task: 'Math',
          autoLaunchWidget: 'time-tool',
          autoCloseWidget: true,
        },
      ],
    });

    // Mock two widgets of same type
    (useDashboard as unknown as Mock).mockReturnValue({
      ...mockDashboardContext,
      activeDashboard: {
        widgets: [
          { id: 'tt-1', type: 'time-tool' },
          { id: 'tt-2', type: 'time-tool' },
        ],
      },
    });

    const date = new Date();
    date.setHours(9, 0, 0, 0);
    vi.setSystemTime(date);

    renderHook(() => useSchedule(widgetId, config));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should NOT call removeWidget because there are 2 widgets of that type
    expect(mockRemoveWidget).not.toHaveBeenCalled();

    // Mock only one widget
    (useDashboard as unknown as Mock).mockReturnValue({
      ...mockDashboardContext,
      activeDashboard: {
        widgets: [{ id: 'tt-1', type: 'time-tool' }],
      },
    });

    renderHook(() => useSchedule(widgetId, config));

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(mockRemoveWidget).toHaveBeenCalledWith('tt-1');
  });

  it('auto-progresses items correctly', () => {
    const config = createConfig({
      autoProgress: true,
      items: [
        { id: '1', time: '08:00', endTime: '09:00', task: 'Math', done: false },
      ],
    });

    const date = new Date();
    date.setHours(9, 30, 0, 0);
    vi.setSystemTime(date);

    renderHook(() => useSchedule(widgetId, config));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      widgetId,
      expect.objectContaining({
        config: expect.objectContaining({
          items: [expect.objectContaining({ id: '1', done: true })],
        }) as unknown as ScheduleConfig,
      })
    );
  });
});
