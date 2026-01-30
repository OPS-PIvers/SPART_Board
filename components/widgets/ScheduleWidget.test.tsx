/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ScheduleWidget, ScheduleSettings } from './ScheduleWidget';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, ScheduleConfig, DEFAULT_GLOBAL_STYLE } from '../../types';

vi.mock('../../context/useDashboard');

// Mock useScaledFont to return a fixed size
vi.mock('../../hooks/useScaledFont', () => ({
  useScaledFont: () => 16,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Circle: () => <div data-testid="circle-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  Type: () => <div>Type Icon</div>,
  Clock: () => <div>Clock Icon</div>,
  AlertTriangle: () => <div>Alert Icon</div>,
  RefreshCw: () => <div data-testid="refresh-icon" />,
}));

const mockUpdateWidget = vi.fn();

const mockDashboardContext = {
  activeDashboard: {
    globalStyle: DEFAULT_GLOBAL_STYLE,
  },
  updateWidget: mockUpdateWidget,
  widgets: [],
};

describe('ScheduleWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useDashboard as unknown as Mock).mockReturnValue(mockDashboardContext);
    mockUpdateWidget.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  const createWidget = (config: Partial<ScheduleConfig> = {}): WidgetData => {
    return {
      id: 'schedule-1',
      type: 'schedule',
      x: 0,
      y: 0,
      w: 300,
      h: 400,
      z: 1,
      flipped: false,
      config: {
        items: [
          { time: '08:00', task: 'Math', done: false },
          { time: '09:00', task: 'Reading', done: false },
          { time: '10:00', task: 'Recess', done: false },
        ],
        ...config,
      },
    } as WidgetData;
  };

  it('renders schedule items', () => {
    render(<ScheduleWidget widget={createWidget()} />);
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
  });

  it('toggles item status on click', () => {
    const widget = createWidget();
    render(<ScheduleWidget widget={widget} />);

    const mathItem = screen.getByText('Math').closest('button');
    if (!mathItem) throw new Error('Math item not found');
    fireEvent.click(mathItem);

    const updateCall = mockUpdateWidget.mock.calls[0];
    const newConfig = (updateCall[1] as { config: ScheduleConfig }).config;

    expect(mockUpdateWidget).toHaveBeenCalledWith('schedule-1', {
      config: expect.any(Object),
    });
    expect(newConfig.items[0].done).toBe(true);
  });

  it('applies font family from config', () => {
    const widget = createWidget({ fontFamily: 'mono' });
    const { container } = render(<ScheduleWidget widget={widget} />);

    // The container should have the font class
    const topDiv = container.firstChild;
    expect(topDiv).toHaveClass('font-mono');
  });

  it('auto-progresses items when connected to clock', () => {
    // Mock a clock widget being present
    (useDashboard as unknown as Mock).mockReturnValue({
      ...mockDashboardContext,
      activeDashboard: {
        ...mockDashboardContext.activeDashboard,
        widgets: [{ id: 'clock-1', type: 'clock' }],
      },
    });

    // Set time BEFORE render to 09:30
    const date = new Date();
    date.setHours(9, 30, 0, 0);
    vi.setSystemTime(date);

    const widget = createWidget({ autoProgress: true });
    render(<ScheduleWidget widget={widget} />);

    // Should make 08:00 (Math) done, because 09:00 (Reading) has started.
    // 09:00 (Reading) should be active (not done).
    // 10:00 (Recess) should be future (not done).

    expect(mockUpdateWidget).toHaveBeenCalledWith('schedule-1', {
      config: expect.objectContaining({
        items: [
          expect.objectContaining({ task: 'Math', done: true }),
          expect.objectContaining({ task: 'Reading', done: false }),
          expect.objectContaining({ task: 'Recess', done: false }),
        ],
      }),
    });
  });

  it('marks all items as done when time is past the last item', () => {
    // Mock a clock widget being present
    (useDashboard as unknown as Mock).mockReturnValue({
      ...mockDashboardContext,
      activeDashboard: {
        ...mockDashboardContext.activeDashboard,
        widgets: [{ id: 'clock-1', type: 'clock' }],
      },
    });

    // Set time BEFORE render to 11:30 (Past Recess at 10:00 + 60 mins)
    const date = new Date();
    date.setHours(11, 30, 0, 0);
    vi.setSystemTime(date);

    const widget = createWidget({ autoProgress: true });
    render(<ScheduleWidget widget={widget} />);

    expect(mockUpdateWidget).toHaveBeenCalledWith('schedule-1', {
      config: expect.objectContaining({
        items: [
          expect.objectContaining({ task: 'Math', done: true }),
          expect.objectContaining({ task: 'Reading', done: true }),
          expect.objectContaining({ task: 'Recess', done: true }),
        ],
      }),
    });
  });

  it('does NOT auto-progress if no clock widget is present', () => {
    // No clock widget
    (useDashboard as unknown as Mock).mockReturnValue({
      ...mockDashboardContext,
      activeDashboard: {
        ...mockDashboardContext.activeDashboard,
        widgets: [],
      },
    });

    // Set time BEFORE render
    const date = new Date();
    date.setHours(9, 30, 0, 0);
    vi.setSystemTime(date);

    const widget = createWidget({ autoProgress: true });
    render(<ScheduleWidget widget={widget} />);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });
});

describe('ScheduleSettings', () => {
  beforeEach(() => {
    (useDashboard as unknown as Mock).mockReturnValue(mockDashboardContext);
    mockUpdateWidget.mockClear();
  });

  const createWidget = (config: Partial<ScheduleConfig> = {}): WidgetData => {
    return {
      id: 'schedule-1',
      type: 'schedule',
      config: {
        items: [],
        ...config,
      },
    } as WidgetData;
  };

  it('renders settings controls', () => {
    render(<ScheduleSettings widget={createWidget()} />);

    expect(screen.getByText(/typography/i)).toBeInTheDocument();
    expect(screen.getByText(/automation/i)).toBeInTheDocument();
    expect(screen.getByText(/connect to clock/i)).toBeInTheDocument();
  });
});
