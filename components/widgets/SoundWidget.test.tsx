import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SoundWidget } from './SoundWidget';
import {
  WidgetData,
  SoundConfig,
  Dashboard,
  ExpectationsConfig,
} from '../../types';
import { useDashboard } from '../../context/useDashboard';

// Mock useDashboard
vi.mock('../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

describe('SoundWidget', () => {
  let mockUpdateWidget: Mock;
  let mockActiveDashboard: Partial<Dashboard>;
  let mockGetByteFrequencyData: Mock;

  beforeEach(() => {
    mockUpdateWidget = vi.fn();
    mockActiveDashboard = {
      widgets: [],
    };

    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      activeDashboard: mockActiveDashboard as Dashboard,
    });

    mockGetByteFrequencyData = vi.fn((array: Uint8Array) => {
      array.fill(0); // Default silence
    });

    // Mock AudioContext
    window.AudioContext = class {
      createMediaStreamSource = vi.fn().mockReturnValue({ connect: vi.fn() });
      createAnalyser = vi.fn().mockReturnValue({
        connect: vi.fn(),
        frequencyBinCount: 128,
        getByteFrequencyData: mockGetByteFrequencyData,
      });
    } as unknown as typeof AudioContext;

    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      writable: true,
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const createWidget = (config: Partial<SoundConfig> = {}): WidgetData => {
    return {
      id: 'sound-1',
      type: 'sound',
      x: 0,
      y: 0,
      w: 200,
      h: 300,
      z: 1,
      config: {
        sensitivity: 1,
        visual: 'thermometer',
        ...config,
      },
    } as WidgetData;
  };

  it('renders thermometer view by default', async () => {
    render(<SoundWidget widget={createWidget()} />);

    // Initial render should show Silence (level 0)
    expect(screen.getByText(/Silence/i)).toBeInTheDocument();

    // Flush promises and timers
    await act(async () => {
      await Promise.resolve(); // Flush microtasks
      vi.advanceTimersByTime(100);
    });
  });

  it('renders speedometer view when configured', async () => {
    render(<SoundWidget widget={createWidget({ visual: 'speedometer' })} />);

    expect(screen.getByText(/Silence/i)).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(100);
    });
  });

  it('triggers traffic light to RED when volume is high', async () => {
    // Setup dashboard with a Traffic Light widget
    mockActiveDashboard.widgets = [
      {
        id: 'traffic-1',
        type: 'traffic',
        config: { active: 'green' },
      } as unknown as WidgetData,
    ];

    // Configure Sound Widget with automation enabled
    const widget = createWidget({
      autoTrafficLight: true,
      trafficLightThreshold: 4, // Outside (Red)
    });

    // Mock high volume
    mockGetByteFrequencyData.mockImplementation((array: Uint8Array) => {
      array.fill(255); // Max volume
    });

    render(<SoundWidget widget={widget} />);

    // 1. Flush microtasks (getUserMedia promise)
    await act(async () => {
      await Promise.resolve();
    });

    // 2. Advance time for requestAnimationFrame to run loop and update state
    // Note: React state updates from rAF might need act wrapping
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // At this point, SoundWidget state 'volume' should be 100.
    // 'level' should be 'Outside' (Red).
    // The useEffect watching 'level' should have fired and set the timeout (1000ms).

    // 3. Advance time to trigger debounce timeout
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(mockUpdateWidget).toHaveBeenCalledWith('traffic-1', {
      config: { active: 'red' },
    });
  });

  it('does NOT trigger traffic light if automation is disabled', async () => {
    mockActiveDashboard.widgets = [
      {
        id: 'traffic-1',
        type: 'traffic',
        config: { active: 'green' },
      } as unknown as WidgetData,
    ];

    const widget = createWidget({
      autoTrafficLight: false, // Disabled
      trafficLightThreshold: 4,
    });

    mockGetByteFrequencyData.mockImplementation((array: Uint8Array) => {
      array.fill(255);
    });

    render(<SoundWidget widget={widget} />);

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(1200);
    });

    expect(mockUpdateWidget).not.toHaveBeenCalled();
  });

  it('triggers traffic light back to GREEN when volume is low', async () => {
    mockActiveDashboard.widgets = [
      {
        id: 'traffic-1',
        type: 'traffic',
        config: { active: 'red' }, // Currently Red
      } as unknown as WidgetData,
    ];

    const widget = createWidget({
      autoTrafficLight: true,
      trafficLightThreshold: 4,
    });

    // Mock LOW volume (Silence)
    mockGetByteFrequencyData.mockImplementation((array: Uint8Array) => {
      array.fill(0);
    });

    render(<SoundWidget widget={widget} />);

    await act(async () => {
      await Promise.resolve();
      vi.advanceTimersByTime(100);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should switch to Green because it's below threshold
    expect(mockUpdateWidget).toHaveBeenCalledWith('traffic-1', {
      config: { active: 'green' },
    });
  });

  it('updates sensitivity when synced with Expectations widget', async () => {
    // Setup dashboard with an Expectations widget set to Silence (Level 0)
    mockActiveDashboard.widgets = [
      {
        id: 'expectations-1',
        type: 'expectations',
        config: { voiceLevel: 0 } as ExpectationsConfig,
      } as unknown as WidgetData,
    ];

    // Configure Sound Widget with sync enabled and default sensitivity
    const widget = createWidget({
      sensitivity: 1, // Default
      syncExpectations: true,
    });

    render(<SoundWidget widget={widget} />);

    // Flush effects
    await act(async () => {
      await Promise.resolve();
    });

    // Should update sensitivity to 4.0 (for Level 0 Silence)
    expect(mockUpdateWidget).toHaveBeenCalledWith('sound-1', {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      config: expect.objectContaining({
        sensitivity: 4.0,
      }),
    });
  });
});
