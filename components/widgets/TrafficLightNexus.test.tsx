import { render } from '@testing-library/react';
import { TrafficLightWidget } from './TrafficLightWidget';
import { useDashboard } from '../../context/useDashboard';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WidgetData, TrafficConfig, TimeToolConfig } from '../../types';

vi.mock('../../context/useDashboard');

const mockUpdateWidget = vi.fn();

describe('TrafficLightNexus Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createTrafficWidget = (config: TrafficConfig = {}): WidgetData => ({
    id: 'traffic-1',
    type: 'traffic',
    config,
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    z: 1,
    flipped: false,
  });

  const createTimeWidget = (config: Partial<TimeToolConfig> = {}): WidgetData => ({
    id: 'timer-1',
    type: 'time-tool',
    config: {
      mode: 'timer',
      isRunning: false,
      elapsedTime: 60,
      duration: 60,
      visualType: 'digital',
      theme: 'light',
      selectedSound: 'Chime',
      ...config,
    } as TimeToolConfig,
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    z: 1,
    flipped: false,
  });

  it('turns GREEN when Timer is RUNNING and Sync is ON', () => {
    const trafficWidget = createTrafficWidget({ active: 'none', syncWithTimer: true });
    const timeWidget = createTimeWidget({ isRunning: true });

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: {
        widgets: [timeWidget],
      },
    });

    render(<TrafficLightWidget widget={trafficWidget} />);

    expect(mockUpdateWidget).toHaveBeenCalledWith('traffic-1', {
      config: {
        active: 'green',
        syncWithTimer: true,
      },
    });
  });

  it('turns YELLOW when Timer is PAUSED (mid-way) and Sync is ON', () => {
    const trafficWidget = createTrafficWidget({ active: 'green', syncWithTimer: true });
    // Paused at 30s (duration 60s)
    const timeWidget = createTimeWidget({ isRunning: false, elapsedTime: 30, duration: 60 });

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: {
        widgets: [timeWidget],
      },
    });

    render(<TrafficLightWidget widget={trafficWidget} />);

    expect(mockUpdateWidget).toHaveBeenCalledWith('traffic-1', {
      config: {
        active: 'yellow',
        syncWithTimer: true,
      },
    });
  });

  it('turns RED when Timer is FINISHED (0s) and Sync is ON', () => {
    const trafficWidget = createTrafficWidget({ active: 'green', syncWithTimer: true });
    const timeWidget = createTimeWidget({ isRunning: false, elapsedTime: 0, duration: 60 });

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: {
        widgets: [timeWidget],
      },
    });

    render(<TrafficLightWidget widget={trafficWidget} />);

    expect(mockUpdateWidget).toHaveBeenCalledWith('traffic-1', {
      config: {
        active: 'red',
        syncWithTimer: true,
      },
    });
  });

  it('DOES NOT update if Sync is OFF', () => {
    const trafficWidget = createTrafficWidget({ active: 'none', syncWithTimer: false });
    const timeWidget = createTimeWidget({ isRunning: true });

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: {
        widgets: [timeWidget],
      },
    });

    render(<TrafficLightWidget widget={trafficWidget} />);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('DOES NOT update if state is already correct', () => {
     const trafficWidget = createTrafficWidget({ active: 'green', syncWithTimer: true });
    const timeWidget = createTimeWidget({ isRunning: true });

    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: {
        widgets: [timeWidget],
      },
    });

    render(<TrafficLightWidget widget={trafficWidget} />);

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });
});
