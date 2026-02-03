/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from '@testing-library/react';
import { TimeToolWidget } from './TimeToolWidget';
import { useDashboard } from '../../context/useDashboard';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WidgetData, TimeToolConfig, DEFAULT_GLOBAL_STYLE } from '../../types';
import * as TimeToolAudio from '../../utils/timeToolAudio';

// Mock dependencies
vi.mock('../../context/useDashboard');
vi.mock('../../utils/timeToolAudio', () => ({
  playTimerAlert: vi.fn(),
  resumeAudio: vi.fn().mockResolvedValue(undefined),
}));

const mockUpdateWidget = vi.fn();
const mockActiveDashboard = {
  widgets: [],
  globalStyle: DEFAULT_GLOBAL_STYLE,
};

const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
  activeDashboard: mockActiveDashboard,
};

describe('TimeToolWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const createWidget = (
    configOverride: Partial<TimeToolConfig> = {}
  ): WidgetData => ({
    id: 'test-id',
    type: 'time-tool',
    config: {
      mode: 'timer',
      duration: 300,
      elapsedTime: 300,
      isRunning: false,
      startTime: null,
      visualType: 'digital',
      theme: 'light',
      selectedSound: 'Chime',
      ...configOverride,
    } as TimeToolConfig,
    x: 0,
    y: 0,
    w: 300,
    h: 300,
    z: 1,
    flipped: false,
  });

  it('renders correctly in digital timer mode', () => {
    const widget = createWidget({ elapsedTime: 300 }); // 5 minutes
    render(<TimeToolWidget widget={widget} />);

    expect(screen.getByText('05:00')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /timer/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('START')).toBeInTheDocument();
  });

  it('switches to visual mode', () => {
    const widget = createWidget({ visualType: 'visual' });
    render(<TimeToolWidget widget={widget} />);

    expect(screen.getByText('05:00')).toBeInTheDocument();
    // SVG circles are present
    const svg = screen.getByText('05:00').parentElement?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('starts the timer', async () => {
    const widget = createWidget({ elapsedTime: 300, isRunning: false });
    render(<TimeToolWidget widget={widget} />);

    const startButton = screen.getByText('START');
    act(() => {
      fireEvent.click(startButton);
    });
    // Give async handleStart a chance to resolve
    await Promise.resolve();

    // Check resumeAudio called
    expect(TimeToolAudio.resumeAudio).toHaveBeenCalled();

    // Check updateWidget called with isRunning: true and startTime
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-id',
      expect.objectContaining({
        config: expect.objectContaining({
          isRunning: true,
          elapsedTime: 300,
        }),
      })
    );
  });

  it('updates display time while running (without calling updateWidget)', () => {
    const startTime = Date.now();
    const widget = createWidget({
      isRunning: true,
      startTime: startTime,
      elapsedTime: 300,
      mode: 'timer',
    });

    render(<TimeToolWidget widget={widget} />);

    expect(screen.getByText('05:00')).toBeInTheDocument();

    // Advance time by 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Should show 04:50
    expect(screen.getByText('04:50')).toBeInTheDocument();

    // updateWidget should NOT be called during ticking
    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('pauses the timer', () => {
    const startTime = Date.now();
    const widget = createWidget({
      isRunning: true,
      startTime: startTime,
      elapsedTime: 300,
      mode: 'timer',
    });

    render(<TimeToolWidget widget={widget} />);

    // Advance 10s so we pause at 290
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    const pauseButton = screen.getByText('PAUSE');
    fireEvent.click(pauseButton);

    // Should call updateWidget with isRunning: false and NEW elapsedTime
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-id',
      expect.objectContaining({
        config: expect.objectContaining({
          isRunning: false,
          elapsedTime: 290,
          startTime: null,
        }),
      })
    );
  });

  it('resets the timer', () => {
    const widget = createWidget({
      elapsedTime: 123, // some random time
      duration: 300,
    });
    render(<TimeToolWidget widget={widget} />);

    const startBtn = screen.getByText('START');
    const resetBtn = startBtn.nextElementSibling;

    if (!resetBtn) throw new Error('Reset button not found');

    fireEvent.click(resetBtn);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-id',
      expect.objectContaining({
        config: expect.objectContaining({
          elapsedTime: 300, // resets to duration
          isRunning: false,
        }),
      })
    );
  });

  it('switches to stopwatch mode', () => {
    const widget = createWidget();
    render(<TimeToolWidget widget={widget} />);

    const stopwatchTab = screen.getByText('Stopwatch');
    fireEvent.click(stopwatchTab);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-id',
      expect.objectContaining({
        config: expect.objectContaining({
          mode: 'stopwatch',
          elapsedTime: 0,
          isRunning: false,
        }),
      })
    );
  });

  it('plays alert and stops when timer reaches 0', () => {
    const startTime = Date.now();
    const widget = createWidget({
      isRunning: true,
      startTime: startTime,
      elapsedTime: 5, // 5 seconds left
      mode: 'timer',
      selectedSound: 'Gong',
    });

    render(<TimeToolWidget widget={widget} />);

    // Advance by 6 seconds to ensure it crosses 0
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(TimeToolAudio.playTimerAlert).toHaveBeenCalledWith('Gong');

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-id',
      expect.objectContaining({
        config: expect.objectContaining({
          isRunning: false,
          elapsedTime: 0,
        }),
      })
    );
  });

  it('triggers voice level change on timer end if configured', () => {
    const startTime = Date.now();
    const widget = createWidget({
      isRunning: true,
      startTime: startTime,
      elapsedTime: 5,
      mode: 'timer',
      timerEndVoiceLevel: 2, // Should switch to level 2
    });

    // Mock active dashboard to include a WorkSymbols widget
    const wsWidget = {
      id: 'ws-1',
      type: 'workSymbols',
      config: { voiceLevel: 0 },
    };

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: {
        widgets: [widget, wsWidget],
        globalStyle: DEFAULT_GLOBAL_STYLE,
      },
    });

    render(<TimeToolWidget widget={widget} />);

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Should update the WorkSymbols widget
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'ws-1',
      expect.objectContaining({
        config: expect.objectContaining({
          voiceLevel: 2,
        }),
      })
    );
  });

  it('enters editing mode when clicking time display in timer mode', () => {
    render(
      <TimeToolWidget
        widget={createWidget({ mode: 'timer', isRunning: false })}
      />
    );

    const timeDisplay = screen.getByText('05:00');
    fireEvent.click(timeDisplay);

    expect(screen.getByText('005')).toBeInTheDocument(); // 3-digit minutes
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

    // Initial is 005. Type 0, 1, 2 -> 050 -> 501 -> 012
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));

    expect(screen.getByText('012')).toBeInTheDocument();
  });

  it('confirms edit and updates widget', () => {
    render(<TimeToolWidget widget={createWidget({ elapsedTime: 300 })} />);

    fireEvent.click(screen.getByText('05:00'));

    // Set to 010:00
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('0'));

    // Confirm using aria-label
    const confirmButton = screen.getByLabelText('Confirm time');
    fireEvent.click(confirmButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-id',
      expect.objectContaining({
        config: expect.objectContaining({
          elapsedTime: 600,
          duration: 600,
        }),
      })
    );
  });

  it('caps seconds at 59', () => {
    render(<TimeToolWidget widget={createWidget({ elapsedTime: 300 })} />);
    fireEvent.click(screen.getByText('05:00'));

    // Switch to seconds
    fireEvent.click(screen.getByText('00'));

    // Type 9, 9 -> 09 -> 59 (capped)
    fireEvent.click(screen.getByText('9'));
    fireEvent.click(screen.getByText('9'));

    expect(screen.getByText('59')).toBeInTheDocument();
  });

  it('supports backspace functionality', () => {
    render(<TimeToolWidget widget={createWidget({ elapsedTime: 300 })} />);
    fireEvent.click(screen.getByText('05:00'));

    // Minutes is 005. Type 1 -> 051
    fireEvent.click(screen.getByText('1'));
    expect(screen.getByText('051')).toBeInTheDocument();

    // Backspace -> 005
    fireEvent.click(screen.getByLabelText('Backspace'));
    expect(screen.getByText('005')).toBeInTheDocument();
  });

  it('cancels editing when clicking X button', () => {
    render(<TimeToolWidget widget={createWidget({ elapsedTime: 300 })} />);
    fireEvent.click(screen.getByText('05:00'));

    // Should be in editing mode
    expect(screen.getByLabelText('Close keypad')).toBeInTheDocument();

    // Click X
    fireEvent.click(screen.getByLabelText('Close keypad'));

    // Should be back to normal display
    expect(screen.queryByLabelText('Close keypad')).not.toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('supports 3-digit minutes (e.g., 2 hours / 120 minutes)', () => {
    render(<TimeToolWidget widget={createWidget({ elapsedTime: 300 })} />);
    fireEvent.click(screen.getByText('05:00'));

    // Set minutes to 120
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('0'));

    expect(screen.getByText('120')).toBeInTheDocument();

    // Confirm
    fireEvent.click(screen.getByLabelText('Confirm time'));

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'test-id',
      expect.objectContaining({
        config: expect.objectContaining({
          elapsedTime: 120 * 60,
          duration: 120 * 60,
        }),
      })
    );
  });
});
