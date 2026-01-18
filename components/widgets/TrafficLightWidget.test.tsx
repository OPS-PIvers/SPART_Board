import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrafficLightWidget } from './TrafficLightWidget';
import { useDashboard } from '../../context/useDashboard';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { WidgetData, TrafficConfig } from '../../types';

// Mock the context
vi.mock('../../context/useDashboard');

const mockUpdateWidget = vi.fn();

const mockDashboardContext = {
  updateWidget: mockUpdateWidget,
  activeDashboard: {
    widgets: [],
  },
};

describe('TrafficLightWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      mockDashboardContext
    );
  });

  const baseWidget: WidgetData = {
    id: 'traffic-widget',
    type: 'traffic',
    config: {
      active: 'none',
    } as TrafficConfig,
    x: 0,
    y: 0,
    w: 100,
    h: 100,
    z: 1,
    flipped: false,
  };

  it('renders all three lights', () => {
    render(<TrafficLightWidget widget={baseWidget} />);

    expect(screen.getByRole('button', { name: /red light/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yellow light/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /green light/i })).toBeInTheDocument();
  });

  it('renders with no active light by default', () => {
    render(<TrafficLightWidget widget={baseWidget} />);

    expect(screen.getByRole('button', { name: /red light/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /yellow light/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /green light/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('activates red light when clicked', async () => {
    const user = userEvent.setup();
    render(<TrafficLightWidget widget={baseWidget} />);

    const redButton = screen.getByRole('button', { name: /red light/i });
    await user.click(redButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-widget',
      expect.objectContaining({
        config: {
          active: 'red',
        },
      })
    );
  });

  it('activates yellow light when clicked', async () => {
    const user = userEvent.setup();
    render(<TrafficLightWidget widget={baseWidget} />);

    const yellowButton = screen.getByRole('button', { name: /yellow light/i });
    await user.click(yellowButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-widget',
      expect.objectContaining({
        config: {
          active: 'yellow',
        },
      })
    );
  });

  it('activates green light when clicked', async () => {
    const user = userEvent.setup();
    render(<TrafficLightWidget widget={baseWidget} />);

    const greenButton = screen.getByRole('button', { name: /green light/i });
    await user.click(greenButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-widget',
      expect.objectContaining({
        config: {
          active: 'green',
        },
      })
    );
  });

  it('deactivates light when clicked again', async () => {
    const user = userEvent.setup();
    const activeWidget: WidgetData = {
        ...baseWidget,
        config: { active: 'red' } as TrafficConfig
    };

    render(<TrafficLightWidget widget={activeWidget} />);

    const redButton = screen.getByRole('button', { name: /red light/i });

    // Check initial state
    expect(redButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(redButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-widget',
      expect.objectContaining({
        config: {
          active: 'none',
        },
      })
    );
  });

  it('switches from one light to another', async () => {
    const user = userEvent.setup();
    const activeWidget: WidgetData = {
        ...baseWidget,
        config: { active: 'red' } as TrafficConfig
    };

    render(<TrafficLightWidget widget={activeWidget} />);

    const greenButton = screen.getByRole('button', { name: /green light/i });
    await user.click(greenButton);

    expect(mockUpdateWidget).toHaveBeenCalledWith(
      'traffic-widget',
      expect.objectContaining({
        config: {
          active: 'green',
        },
      })
    );
  });
});
