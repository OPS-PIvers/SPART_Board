/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TimeToolWidget } from './TimeToolWidget';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TimeToolConfig, DEFAULT_GLOBAL_STYLE } from '../../types';

vi.mock('../../context/useDashboard');
vi.mock('../../utils/timeToolAudio', () => ({
  playTimerAlert: vi.fn(),
  resumeAudio: vi.fn().mockResolvedValue(undefined),
}));

const mockUpdateWidget = vi.fn();
const mockDashboardContext = {
  activeDashboard: {
    widgets: [],
    globalStyle: DEFAULT_GLOBAL_STYLE,
  },
  updateWidget: mockUpdateWidget,
};

describe('TimeToolWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    vi.clearAllMocks();
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
        duration: 300,
        elapsedTime: 300,
        isRunning: false,
        selectedSound: 'Chime',
        ...config,
      },
    } as WidgetData;
  };

  it('renders time correctly', () => {
    render(<TimeToolWidget widget={createWidget({ elapsedTime: 300 })} />);
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('enters editing mode when clicking time display in timer mode', () => {
    render(
      <TimeToolWidget
        widget={createWidget({ mode: 'timer', isRunning: false })}
      />
    );

    const timeDisplay = screen.getByText('05:00');
    fireEvent.click(timeDisplay);

    expect(screen.getByText('05')).toBeInTheDocument();
    expect(screen.getByText('00')).toBeInTheDocument();
    // Buttons for 1-9 should be present
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('does not enter editing mode when running', () => {
    render(
      <TimeToolWidget
        widget={createWidget({ mode: 'timer', isRunning: true })}
      />
    );

    const timeDisplay = screen.getByText('05:00');
    fireEvent.click(timeDisplay);

    // Should NOT show the keypad (buttons 1-9)
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('updates edit values when clicking keypad', () => {
    render(<TimeToolWidget widget={createWidget({ elapsedTime: 300 })} />);

    fireEvent.click(screen.getByText('05:00'));

    // Click '1' then '2' for minutes (activeField defaults to 'min')
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));

    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('confirms edit and updates widget', () => {
    render(<TimeToolWidget widget={createWidget({ elapsedTime: 300 })} />);

    fireEvent.click(screen.getByText('05:00'));

    // Set to 10:00
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('0'));

    // Confirm using aria-label
    const confirmButton = screen.getByLabelText('Confirm time');
    fireEvent.click(confirmButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'timetool-1',
      expect.objectContaining({
        config: expect.objectContaining({
          elapsedTime: 600,
          duration: 600,
        }),
      })
    );
  });
});
