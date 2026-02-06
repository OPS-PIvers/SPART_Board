/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TimeToolConfig, DEFAULT_GLOBAL_STYLE } from '../../types';
import { TimeToolWidget } from './TimeToolWidget';

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

// Helper to render widget
const renderWidget = (widget: WidgetData) => {
  return render(<TimeToolWidget widget={widget} />);
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
      w: 400,
      h: 400,
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
    const widget = createWidget({ elapsedTime: 300 });
    renderWidget(widget);
    expect(screen.getByText('05:00')).toBeInTheDocument();
  });

  it('enters editing mode when clicking time display in timer mode', () => {
    const widget = createWidget({ mode: 'timer', isRunning: false });
    renderWidget(widget);

    const timeDisplay = screen.getByText('05:00');
    fireEvent.click(timeDisplay);

    expect(screen.getByText('005')).toBeInTheDocument(); // 3-digit minutes
    expect(screen.getByText('00')).toBeInTheDocument();
    // Buttons for 1-9 should be present
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('does not enter editing mode when running', () => {
    const widget = createWidget({ mode: 'timer', isRunning: true });
    renderWidget(widget);

    const timeDisplay = screen.getByText('05:00');
    fireEvent.click(timeDisplay);

    // Should NOT show the keypad (buttons 1-9)
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  it('updates edit values when clicking keypad', () => {
    const widget = createWidget({ elapsedTime: 300 });
    renderWidget(widget);

    fireEvent.click(screen.getByText('05:00'));

    // Initial is 005. Type 0, 1, 2 -> 050 -> 501 -> 012
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));

    expect(screen.getByText('012')).toBeInTheDocument();
  });

  it('confirms edit and updates widget', () => {
    const widget = createWidget({ elapsedTime: 300 });
    renderWidget(widget);

    fireEvent.click(screen.getByText('05:00'));

    // Set to 010:00
    fireEvent.click(screen.getByText('0'));
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

  it('caps seconds at 59', () => {
    const widget = createWidget({ elapsedTime: 300 });
    renderWidget(widget);
    fireEvent.click(screen.getByText('05:00'));

    // Switch to seconds
    fireEvent.click(screen.getByText('00'));

    // Type 9, 9 -> 09 -> 59 (capped)
    fireEvent.click(screen.getByText('9'));
    fireEvent.click(screen.getByText('9'));

    expect(screen.getByText('59')).toBeInTheDocument();
  });

  it('supports backspace functionality', () => {
    const widget = createWidget({ elapsedTime: 300 });
    renderWidget(widget);
    fireEvent.click(screen.getByText('05:00'));

    // Minutes is 005. Type 1 -> 051
    fireEvent.click(screen.getByText('1'));
    expect(screen.getByText('051')).toBeInTheDocument();

    // Backspace -> 005
    fireEvent.click(screen.getByLabelText('Backspace'));
    expect(screen.getByText('005')).toBeInTheDocument();
  });

  it('cancels editing when clicking X button', () => {
    const widget = createWidget({ elapsedTime: 300 });
    renderWidget(widget);
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
    const widget = createWidget({ elapsedTime: 300 });
    renderWidget(widget);
    fireEvent.click(screen.getByText('05:00'));

    // Set minutes to 120
    fireEvent.click(screen.getByText('1'));
    fireEvent.click(screen.getByText('2'));
    fireEvent.click(screen.getByText('0'));

    expect(screen.getByText('120')).toBeInTheDocument();

    // Confirm
    fireEvent.click(screen.getByLabelText('Confirm time'));

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'timetool-1',
      expect.objectContaining({
        config: expect.objectContaining({
          elapsedTime: 120 * 60,
          duration: 120 * 60,
        }),
      })
    );
  });
});
