/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ScheduleWidget } from './Widget';
import { ScheduleSettings } from './Settings';
import { useDashboard } from '../../../context/useDashboard';
import {
  WidgetData,
  ScheduleConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../../types';

vi.mock('../../../context/useDashboard');

// Mock useScaledFont to return a fixed size
vi.mock('../../../hooks/useScaledFont', () => ({
  useScaledFont: () => 16,
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Circle: () => <div data-testid="circle-icon" />,
  CheckCircle2: () => <div data-testid="check-icon" />,
  Type: () => <div>Type Icon</div>,
  Clock: () => <div data-testid="clock-icon" />,
  AlertTriangle: () => <div>Alert Icon</div>,
  Plus: () => <div>Plus Icon</div>,
  Trash2: () => <div>Trash Icon</div>,
  ChevronUp: () => <div>Up Icon</div>,
  ChevronDown: () => <div>Down Icon</div>,
}));

const mockUpdateWidget = vi.fn();
const mockAddWidget = vi.fn();
const mockRemoveWidget = vi.fn();

const mockDashboardContext = {
  activeDashboard: {
    globalStyle: DEFAULT_GLOBAL_STYLE,
    widgets: [],
  },
  updateWidget: mockUpdateWidget,
  addWidget: mockAddWidget,
  removeWidget: mockRemoveWidget,
};

describe('ScheduleWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (useDashboard as unknown as Mock).mockReturnValue(mockDashboardContext);
    mockUpdateWidget.mockClear();
    mockAddWidget.mockClear();
    mockRemoveWidget.mockClear();
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
  });

  it('renders endTime when provided', () => {
    const widget = createWidget({
      items: [{ time: '08:00', endTime: '09:00', task: 'Math', done: false }],
    });
    render(<ScheduleWidget widget={widget} />);
    expect(screen.getByText('08:00 - 09:00')).toBeInTheDocument();
  });

  it('toggles item status on click', () => {
    const widget = createWidget();
    render(<ScheduleWidget widget={widget} />);

    const mathItem = screen.getByText('Math').closest('button');
    if (!mathItem) throw new Error('Math item not found');
    fireEvent.click(mathItem);

    expect(mockUpdateWidget).toHaveBeenCalledWith('schedule-1', {
      config: expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ task: 'Math', done: true }),
        ]),
      }),
    });
  });

  it('shows countdown for active timer-based event', () => {
    const widget = createWidget({
      items: [
        {
          time: '08:00',
          endTime: '09:00',
          task: 'Math',
          type: 'timer',
          done: false,
        },
      ],
    });

    const date = new Date();
    date.setHours(8, 30, 0, 0);
    vi.setSystemTime(date);

    render(<ScheduleWidget widget={widget} />);

    expect(screen.getByText('30:00')).toBeInTheDocument();
  });

  it('auto-launches widget at start time', () => {
    const widget = createWidget({
      items: [{ time: '09:00', task: 'Math', autoLaunchWidget: 'time-tool' }],
    });

    const date = new Date();
    date.setHours(9, 0, 0, 0);
    vi.setSystemTime(date);

    render(<ScheduleWidget widget={widget} />);

    // Advance timers to trigger the effect
    vi.advanceTimersByTime(11000);

    expect(mockAddWidget).toHaveBeenCalledWith('time-tool', expect.any(Object));
  });

  it('auto-closes widget at end time', () => {
    const widget = createWidget({
      items: [
        {
          time: '08:00',
          endTime: '09:00',
          task: 'Math',
          autoLaunchWidget: 'time-tool',
          autoCloseWidget: true,
        },
      ],
    });

    (useDashboard as unknown as Mock).mockReturnValue({
      ...mockDashboardContext,
      activeDashboard: {
        ...mockDashboardContext.activeDashboard,
        widgets: [{ id: 'tt-1', type: 'time-tool' }],
      },
    });

    const date = new Date();
    date.setHours(9, 0, 0, 0);
    vi.setSystemTime(date);

    render(<ScheduleWidget widget={widget} />);

    vi.advanceTimersByTime(11000);

    expect(mockRemoveWidget).toHaveBeenCalledWith('tt-1');
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
    expect(screen.getByText(/schedule events/i)).toBeInTheDocument();
    expect(screen.getByText(/typography/i)).toBeInTheDocument();
    expect(screen.getByText(/automation/i)).toBeInTheDocument();
  });

  it('adds a new event', () => {
    render(<ScheduleSettings widget={createWidget()} />);
    const addButton = screen.getByText(/add event/i);
    fireEvent.click(addButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith('schedule-1', {
      config: expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ task: 'New Event' }),
        ]),
      }),
    });
  });
});
