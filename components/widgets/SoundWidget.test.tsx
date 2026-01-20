import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SoundWidget } from './SoundWidget';
import { WidgetData, SoundConfig } from '../../types';

describe('SoundWidget', () => {
  beforeEach(() => {
    // Mock AudioContext
    window.AudioContext = class {
      createMediaStreamSource = vi.fn().mockReturnValue({ connect: vi.fn() });
      createAnalyser = vi.fn().mockReturnValue({
        connect: vi.fn(),
        frequencyBinCount: 128,
        getByteFrequencyData: vi.fn(),
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
    // Check for the level label
    expect(screen.getByText(/Silence/i)).toBeInTheDocument();

    // Wait for async effects to flush
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it('renders speedometer view when configured', async () => {
    render(<SoundWidget widget={createWidget({ visual: 'speedometer' })} />);
    expect(screen.getByText(/Silence/i)).toBeInTheDocument();

    // Wait for async effects to flush
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });
});
