/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { TimeToolWidget, TimeToolSettings } from './TimeToolWidget';
import { useDashboard } from '../../context/useDashboard';
import { DashboardContextValue } from '../../context/DashboardContextValue';
import { WidgetData, TimeToolConfig, TrafficConfig } from '../../types';

// Mock dependencies
vi.mock('../../context/useDashboard');

// Mock audio utils to avoid actual audio calls
vi.mock('../../utils/timeToolAudio', () => ({
  resumeAudio: vi.fn().mockResolvedValue(undefined),
  playTimerAlert: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Play: () => <div data-testid="play-icon" />,
  Pause: () => <div data-testid="pause-icon" />,
  RotateCcw: () => <div data-testid="reset-icon" />,
  Bell: () => <div data-testid="bell-icon" />,
}));

const mockUpdateWidget = vi.fn();
const mockAddToast = vi.fn();

const mockTimeWidget: WidgetData = {
  id: 'timetool-1',
  type: 'time-tool',
  x: 0,
  y: 0,
  w: 4,
  h: 4,
  z: 1,
  flipped: false,
  config: {
    mode: 'timer',
    visualType: 'digital',
    theme: 'light',
    duration: 60,
    elapsedTime: 60,
    isRunning: false,
    selectedSound: 'Chime',
    autoTrafficLight: true,
  } as TimeToolConfig,
};

const mockTrafficWidget: WidgetData = {
  id: 'traffic-1',
  type: 'traffic',
  x: 4,
  y: 0,
  w: 2,
  h: 4,
  z: 1,
  flipped: false,
  config: {
    active: 'none',
  } as TrafficConfig,
};

const defaultContext: Partial<DashboardContextValue> = {
  updateWidget: mockUpdateWidget,
  addToast: mockAddToast,
  activeDashboard: {
    id: 'dashboard-1',
    name: 'Test Dashboard',
    background: 'bg-slate-100',
    widgets: [mockTimeWidget, mockTrafficWidget],
    globalStyle: {
      fontFamily: 'sans',
      windowTransparency: 0,
      windowBorderRadius: 'md',
      dockTransparency: 0,
      dockBorderRadius: 'md',
      dockTextColor: '#000000',
      dockTextShadow: false,
    },
    createdAt: Date.now(),
  },
};

describe('TimeToolWidget Nexus Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as Mock).mockReturnValue(defaultContext);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets Traffic Light to GREEN when timer starts', async () => {
    render(<TimeToolWidget widget={mockTimeWidget} />);

    const startButton = screen.getByText('START');
    fireEvent.click(startButton);

    // Should update TimeTool to running
    await waitFor(() => {
      expect(mockUpdateWidget).toHaveBeenCalledWith(
        'timetool-1',
        expect.objectContaining({
          config: expect.objectContaining({ isRunning: true }),
        })
      );
    });

    // Should update Traffic Light to Green
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-1',
      expect.objectContaining({
        config: expect.objectContaining({ active: 'green' }),
      })
    );
  });

  it('sets Traffic Light to YELLOW when timer is paused by user', () => {
    const runningWidget = {
      ...mockTimeWidget,
      config: {
        ...mockTimeWidget.config,
        isRunning: true,
        startTime: Date.now(),
      } as TimeToolConfig,
    };
    render(<TimeToolWidget widget={runningWidget} />);

    const pauseButton = screen.getByText('PAUSE');
    fireEvent.click(pauseButton);

    // Should update TimeTool to stopped
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'timetool-1',
      expect.objectContaining({
        config: expect.objectContaining({ isRunning: false }),
      })
    );

    // Should update Traffic Light to Yellow
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-1',
      expect.objectContaining({
        config: expect.objectContaining({ active: 'yellow' }),
      })
    );
  });

  it('sets Traffic Light to NONE when timer is reset', () => {
    render(<TimeToolWidget widget={mockTimeWidget} />);

    const resetButton = screen.getByTestId('reset-icon').closest('button');
    expect(resetButton).toBeInTheDocument();

    if (resetButton) {
      fireEvent.click(resetButton);
    }

    // Should update Traffic Light to None
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-1',
      expect.objectContaining({
        config: expect.objectContaining({ active: 'none' }),
      })
    );
  });

  it('sets Traffic Light to RED when timer finishes', () => {
    vi.useFakeTimers();
    // Start with 0.1s left
    const nearEndWidget = {
      ...mockTimeWidget,
      config: {
        ...mockTimeWidget.config,
        isRunning: true,
        duration: 60,
        elapsedTime: 0.1,
        startTime: Date.now(),
      } as TimeToolConfig,
    };

    render(<TimeToolWidget widget={nearEndWidget} />);

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should stop the timer
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'timetool-1',
      expect.objectContaining({
        config: expect.objectContaining({ isRunning: false }),
      })
    );

    // Should update Traffic Light to RED
    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-1',
      expect.objectContaining({
        config: expect.objectContaining({ active: 'red' }),
      })
    );
  });

  it('does NOT update Traffic Light if autoTrafficLight is false', async () => {
    const disabledWidget = {
      ...mockTimeWidget,
      config: {
        ...mockTimeWidget.config,
        autoTrafficLight: false,
      } as TimeToolConfig,
    };

    render(<TimeToolWidget widget={disabledWidget} />);

    const startButton = screen.getByText('START');
    fireEvent.click(startButton);

    // Should update TimeTool
    await waitFor(() => {
      expect(mockUpdateWidget).toHaveBeenCalledWith(
        'timetool-1',
        expect.anything()
      );
    });

    // Should NOT update Traffic Light
    expect(mockUpdateWidget).not.toHaveBeenCalledWith(
      'traffic-1',
      expect.anything()
    );
  });
});

describe('TimeToolSettings Nexus Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as Mock).mockReturnValue(defaultContext);
  });

  it('shows toggle when Traffic Light widget exists', () => {
    render(<TimeToolSettings widget={mockTimeWidget} />);
    expect(screen.getByText('Traffic Light Sync')).toBeInTheDocument();
    expect(screen.getByText('Auto-Control Lights')).toBeInTheDocument();
  });

  it('shows warning when Traffic Light widget is missing', () => {
    (useDashboard as unknown as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: {
        widgets: [mockTimeWidget], // No Traffic Light
      },
    });

    render(<TimeToolSettings widget={mockTimeWidget} />);
    expect(
      screen.getByText(/Add a "Traffic Light" widget/)
    ).toBeInTheDocument();
  });

  it('toggles autoTrafficLight setting', () => {
    render(<TimeToolSettings widget={mockTimeWidget} />);

    const toggleButton = screen.getByText('Auto-Control Lights')
      .nextSibling as HTMLElement;
    fireEvent.click(toggleButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'timetool-1',
      expect.objectContaining({
        config: expect.objectContaining({
          autoTrafficLight: false, // Toggles from true to false
        }),
      })
    );
  });
});
