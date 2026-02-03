import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TimeToolSettings } from './TimeToolWidget';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, TimeToolConfig, DEFAULT_GLOBAL_STYLE, WidgetType } from '../../types';

vi.mock('../../context/useDashboard');

const mockUpdateWidget = vi.fn();

const createDashboardContext = (widgets: { type: WidgetType }[] = []) => ({
  activeDashboard: {
    widgets: widgets.map((w, i) => ({ ...w, id: `w-${i}`, config: {} })),
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
      duration: 300,
      elapsedTime: 300,
      isRunning: false,
      selectedSound: 'Chime',
      timerTrafficLightControl: false,
      ...config,
    },
  } as WidgetData;
};

describe('TimeToolSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders Traffic Light automation toggle', () => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createDashboardContext([{ type: 'traffic' }])
    );

    render(<TimeToolSettings widget={createWidget()} />);

    expect(screen.getByText('Auto-Control Traffic Light')).toBeInTheDocument();
    expect(screen.getByText('Enable Automation')).toBeInTheDocument();
  });

  it('disables toggle if no Traffic Light widget exists', () => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createDashboardContext([]) // No traffic light
    );

    render(<TimeToolSettings widget={createWidget()} />);

    const toggle = screen.getByRole('checkbox', { hidden: true }); // sr-only input
    expect(toggle).toBeDisabled();

    expect(screen.getByText(/Add a Traffic Light widget/)).toBeInTheDocument();
  });

  it('updates config when toggled', () => {
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      createDashboardContext([{ type: 'traffic' }])
    );

    render(<TimeToolSettings widget={createWidget({ timerTrafficLightControl: false })} />);

    const toggle = screen.getByRole('checkbox', { hidden: true });
    fireEvent.click(toggle);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'timetool-1',
      expect.objectContaining({
        config: expect.objectContaining({
          timerTrafficLightControl: true,
        }),
      })
    );
  });
});
