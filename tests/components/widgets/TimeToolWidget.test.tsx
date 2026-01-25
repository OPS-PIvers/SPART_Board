import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { TimeToolWidget, TimeToolSettings } from '../../../components/widgets/TimeToolWidget';
import { useDashboard } from '../../../context/useDashboard';
import { DashboardContextValue } from '../../../context/DashboardContextValue';
import { WidgetData, TimeToolConfig, WorkSymbolsConfig } from '../../../types';
import * as audioUtils from '../../../utils/timeToolAudio';

// Mocks
vi.mock('../../../context/useDashboard');
vi.mock('../../../utils/timeToolAudio');
vi.mock('lucide-react', () => ({
  Play: () => <div data-testid="icon-play" />,
  Pause: () => <div data-testid="icon-pause" />,
  RotateCcw: () => <div data-testid="icon-rotate-ccw" />,
  Bell: () => <div data-testid="icon-bell" />,
}));

const mockUpdateWidget = vi.fn();
const mockAddToast = vi.fn();
const mockResumeAudio = vi.spyOn(audioUtils, 'resumeAudio').mockImplementation(async () => {});
const mockPlayTimerAlert = vi.spyOn(audioUtils, 'playTimerAlert').mockImplementation(() => {});

const mockWidget: WidgetData = {
  id: 'timetool-1',
  type: 'timeTool',
  x: 0,
  y: 0,
  w: 4,
  h: 4,
  z: 1,
  flipped: false,
  config: {
    mode: 'timer',
    elapsedTime: 600, // 10 minutes
    duration: 600,
    isRunning: false,
    startTime: null,
    theme: 'light',
    visualType: 'digital',
    selectedSound: 'Chime',
    timerEndVoiceLevel: null,
  } as TimeToolConfig,
};

const defaultContext: Partial<DashboardContextValue> = {
  updateWidget: mockUpdateWidget,
  addToast: mockAddToast,
  activeDashboard: {
    id: 'dashboard-1',
    name: 'Test Dashboard',
    background: 'bg-slate-100',
    widgets: [mockWidget],
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

describe('TimeToolWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as Mock).mockReturnValue(defaultContext);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly in digital timer mode', () => {
    render(<TimeToolWidget widget={mockWidget} />);
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('START')).toBeInTheDocument();
    expect(screen.getByTestId('icon-play')).toBeInTheDocument();
    expect(screen.getByText('Digital')).toBeInTheDocument();
    expect(screen.getByText('Visual')).toBeInTheDocument();
  });

  it('starts the timer when START is clicked', async () => {
    render(<TimeToolWidget widget={mockWidget} />);

    await act(async () => {
      fireEvent.click(screen.getByText('START'));
    });

    expect(mockResumeAudio).toHaveBeenCalled();
    expect(mockUpdateWidget).toHaveBeenCalledWith('timetool-1', {
      config: expect.objectContaining({
        isRunning: true,
        startTime: expect.any(Number),
        elapsedTime: 600,
      }),
    });
  });

  it('pauses the timer when PAUSE is clicked', () => {
    const runningWidget = {
      ...mockWidget,
      config: {
        ...mockWidget.config,
        isRunning: true,
        startTime: Date.now(),
      } as TimeToolConfig,
    };
    render(<TimeToolWidget widget={runningWidget} />);

    fireEvent.click(screen.getByText('PAUSE'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('timetool-1', {
      config: expect.objectContaining({
        isRunning: false,
        startTime: null,
      }),
    });
  });

  it('resets the timer when Reset button is clicked', () => {
    const pausedWidget = {
      ...mockWidget,
      config: {
        ...mockWidget.config,
        elapsedTime: 300,
      } as TimeToolConfig,
    };
    render(<TimeToolWidget widget={pausedWidget} />);

    fireEvent.click(screen.getByTestId('icon-rotate-ccw').parentElement!);

    expect(mockUpdateWidget).toHaveBeenCalledWith('timetool-1', {
      config: expect.objectContaining({
        isRunning: false,
        elapsedTime: 600, // Back to default duration
        startTime: null,
      }),
    });
  });

  it('switches to Stopwatch mode', () => {
    render(<TimeToolWidget widget={mockWidget} />);

    fireEvent.click(screen.getByText('Stopwatch'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('timetool-1', {
      config: expect.objectContaining({
        mode: 'stopwatch',
        elapsedTime: 0,
        isRunning: false,
      }),
    });
  });

  it('switches to Visual mode', () => {
    render(<TimeToolWidget widget={mockWidget} />);

    fireEvent.click(screen.getByText('Visual'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('timetool-1', {
      config: expect.objectContaining({
        visualType: 'visual',
      }),
    });
  });

  it('handles timer expiration and updates voice level (Nexus)', () => {
    vi.useFakeTimers();
    const workSymbolsWidget: WidgetData = {
        id: 'ws-1',
        type: 'workSymbols',
        x: 0, y: 0, w: 2, h: 2, z: 1, flipped: false,
        config: { voiceLevel: 0 } as WorkSymbolsConfig
    };

    const contextWithWS = {
        ...defaultContext,
        activeDashboard: {
            ...defaultContext.activeDashboard!,
            widgets: [mockWidget, workSymbolsWidget]
        }
    };
    (useDashboard as unknown as Mock).mockReturnValue(contextWithWS);

    const nearlyDoneWidget = {
      ...mockWidget,
      config: {
        ...mockWidget.config,
        isRunning: true,
        startTime: Date.now(),
        elapsedTime: 0.1, // Almost done
        duration: 600,
        timerEndVoiceLevel: 2, // Should switch to Level 2
      } as TimeToolConfig,
    };

    render(<TimeToolWidget widget={nearlyDoneWidget} />);

    // Fast forward time
    act(() => {
        vi.advanceTimersByTime(200);
    });

    // Check if timer stopped
    expect(mockUpdateWidget).toHaveBeenCalledWith('timetool-1', {
        config: expect.objectContaining({
            isRunning: false,
            elapsedTime: 0,
        })
    });

    // Check if sound played
    expect(mockPlayTimerAlert).toHaveBeenCalledWith('Chime');

    // Check if Voice Level was updated
    expect(mockUpdateWidget).toHaveBeenCalledWith('ws-1', {
        config: expect.objectContaining({
            voiceLevel: 2
        })
    });
  });
});

describe('TimeToolSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useDashboard as unknown as Mock).mockReturnValue(defaultContext);
    });

    it('shows warning when no Work Symbols widget exists', () => {
        render(<TimeToolSettings widget={mockWidget} />);
        expect(screen.getByText(/Add a "Work Symbols" widget/)).toBeInTheDocument();
    });

    it('shows voice level options when Work Symbols widget exists', () => {
        const contextWithWS = {
            ...defaultContext,
            activeDashboard: {
                ...defaultContext.activeDashboard!,
                widgets: [mockWidget, { type: 'workSymbols', id: 'ws-1' } as WidgetData]
            }
        };
        (useDashboard as unknown as Mock).mockReturnValue(contextWithWS);

        render(<TimeToolSettings widget={mockWidget} />);

        expect(screen.getByText('Automatically set Voice Level when timer ends:')).toBeInTheDocument();
        expect(screen.getByText('No Change')).toBeInTheDocument();
        expect(screen.getByText('Level 0')).toBeInTheDocument();
        expect(screen.getByText('Level 4')).toBeInTheDocument();
    });

    it('updates timerEndVoiceLevel when an option is selected', () => {
         const contextWithWS = {
            ...defaultContext,
            activeDashboard: {
                ...defaultContext.activeDashboard!,
                widgets: [mockWidget, { type: 'workSymbols', id: 'ws-1' } as WidgetData]
            }
        };
        (useDashboard as unknown as Mock).mockReturnValue(contextWithWS);

        render(<TimeToolSettings widget={mockWidget} />);

        fireEvent.click(screen.getByText('Level 3'));

        expect(mockUpdateWidget).toHaveBeenCalledWith('timetool-1', {
            config: expect.objectContaining({
                timerEndVoiceLevel: 3
            })
        });
    });
});
