import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ClockWidget } from './ClockWidget';
import { WidgetData, ClockConfig } from '../../types';

describe('ClockWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createWidget = (config: Partial<ClockConfig> = {}): WidgetData => {
    return {
      id: 'clock-1',
      type: 'clock',
      x: 0,
      y: 0,
      w: 200,
      h: 100,
      z: 1,
      config: {
        format24: true,
        showSeconds: true,
        themeColor: '#000000',
        fontFamily: 'font-mono',
        clockStyle: 'modern',
        ...config,
      },
    } as WidgetData;
  };

  it('renders time correctly in 24h format', () => {
    const date = new Date('2023-01-01T14:30:45');
    vi.setSystemTime(date);

    render(<ClockWidget widget={createWidget({ format24: true })} />);

    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
  });

  it('renders time correctly in 12h format', () => {
    const date = new Date('2023-01-01T14:30:45');
    vi.setSystemTime(date);

    render(<ClockWidget widget={createWidget({ format24: false })} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('PM')).toBeInTheDocument();
  });

  it('updates time every second', () => {
    const date = new Date('2023-01-01T14:30:45');
    vi.setSystemTime(date);

    render(<ClockWidget widget={createWidget({ showSeconds: true })} />);

    expect(screen.getByText('45')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('46')).toBeInTheDocument();
  });

  it('hides seconds when configured', () => {
    render(<ClockWidget widget={createWidget({ showSeconds: false })} />);

    // We expect hours and minutes to be there, but not seconds
    // Since seconds are rendered in their own span, we can check for their absence
    // However, the component renders :88 ghost elements in LCD mode, so we need to be careful.
    // In default mode, it just renders <span>{seconds}</span>.
    // But wait, the component renders seconds conditionally: {showSeconds && ...}

    // Let's set a specific time so we know what to look for
    const date = new Date('2023-01-01T14:30:45');
    vi.setSystemTime(date);

    render(<ClockWidget widget={createWidget({ showSeconds: false, format24: true })} />);

    expect(screen.getByText('14')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.queryByText('45')).not.toBeInTheDocument();
  });

  it('applies theme color', () => {
    const widget = createWidget({ themeColor: 'rgb(255, 0, 0)' });
    const { container } = render(<ClockWidget widget={widget} />);

    // The color is applied to the inner div with inline style
    const timeContainer = container.querySelector('.flex.items-baseline');
    expect(timeContainer).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });
});
