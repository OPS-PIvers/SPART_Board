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
    type: 'timeTool',
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
    await act(async () => {
      fireEvent.click(startButton);
    });

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
      'test-id',
      expect.objectContaining({
        config: expect.objectContaining({
          elapsedTime: 600,
          duration: 600,
        }),
      })
    );
  });
});