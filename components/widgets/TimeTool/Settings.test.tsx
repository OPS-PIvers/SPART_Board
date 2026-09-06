import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimeToolSettings } from './Settings';
import { useDashboard } from '@/context/useDashboard';
import { TimeToolConfig, WidgetData } from '@/types';

vi.mock('@/context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

const mockedUseDashboard = vi.mocked(useDashboard);
const mockUpdateWidget = vi.fn();

const makeWidget = (config: Partial<TimeToolConfig> = {}): WidgetData => ({
  id: 'timetool-test-1',
  type: 'time-tool',
  x: 0,
  y: 0,
  w: 300,
  h: 200,
  z: 1,
  flipped: true,
  config: {
    mode: 'timer',
    visualType: 'digital',
    duration: 600,
    elapsedTime: 600,
    isRunning: false,
    selectedSound: 'Chime',
    ...config,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseDashboard.mockReturnValue({
    updateWidget: mockUpdateWidget,
    activeDashboard: { widgets: [] },
  } as unknown as ReturnType<typeof useDashboard>);
});

describe('TimeToolSettings — Mode radiogroup', () => {
  /**
   * Regression: roving-tabindex arrow-key nav means selection follows focus
   * (WAI-ARIA radiogroup pattern) — arrowing across the Mode group now fires
   * selectMode on every focus move, not just on a deliberate click. selectMode
   * has a destructive side effect (resets duration/elapsedTime/isRunning/
   * startTime), so arrowing back to the mode that's already active — e.g.
   * cycling right then left through these two options — must be a no-op,
   * not a redundant reset that would wipe a running timer.
   */
  it('does not reset timer state when arrowing back to the already-active mode', () => {
    const widget = makeWidget({
      mode: 'timer',
      duration: 45,
      elapsedTime: 30,
      isRunning: true,
      startTime: 123456,
    });
    render(<TimeToolSettings widget={widget} />);

    const timerBtn = screen.getByRole('radio', { name: /timer/i });
    const stopwatchBtn = screen.getByRole('radio', { name: /stopwatch/i });

    timerBtn.focus();
    fireEvent.keyDown(timerBtn, { key: 'ArrowRight' });
    expect(stopwatchBtn).toHaveFocus();
    expect(mockUpdateWidget).toHaveBeenCalledTimes(1);
    mockUpdateWidget.mockClear();

    fireEvent.keyDown(stopwatchBtn, { key: 'ArrowLeft' });
    expect(timerBtn).toHaveFocus();
    // Back to 'timer', the mode this widget started in — must not fire a
    // second reset.
    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('still resets timer state on a genuine mode change (click)', () => {
    const widget = makeWidget({
      mode: 'timer',
      duration: 45,
      elapsedTime: 30,
      isRunning: true,
      startTime: 123456,
    });
    render(<TimeToolSettings widget={widget} />);

    fireEvent.click(screen.getByRole('radio', { name: /stopwatch/i }));

    expect(mockUpdateWidget).toHaveBeenCalledWith('timetool-test-1', {
      config: expect.objectContaining({
        mode: 'stopwatch',
        elapsedTime: 0,
        isRunning: false,
        startTime: null,
      }) as unknown,
    });
  });
});
