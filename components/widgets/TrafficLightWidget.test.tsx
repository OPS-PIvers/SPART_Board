import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrafficLightWidget } from './TrafficLightWidget';
import { WidgetData, TrafficConfig } from '../../types';
import { vi, describe, it, expect } from 'vitest';

// Mock dependencies
const mockUpdateWidget = vi.fn();

vi.mock('../../context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: mockUpdateWidget,
  }),
}));

describe('TrafficLightWidget', () => {
  const baseWidget: WidgetData = {
    id: 'test-widget',
    type: 'traffic_light',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    z: 0,
    flipped: false,
    config: {
      active: 'none',
    },
  };

  it('renders all three traffic lights', () => {
    render(<TrafficLightWidget widget={baseWidget} />);

    expect(screen.getByRole('button', { name: /red light/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yellow light/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /green light/i })).toBeInTheDocument();
  });

  it('updates widget when a light is clicked', async () => {
    const user = userEvent.setup();
    render(<TrafficLightWidget widget={baseWidget} />);

    await user.click(screen.getByRole('button', { name: /red light/i }));

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      config: {
        active: 'red',
      },
    });
  });

  it('toggles light off when clicked again', async () => {
    const user = userEvent.setup();
    const activeWidget: WidgetData = {
      ...baseWidget,
      config: { active: 'red' } as TrafficConfig,
    };

    render(<TrafficLightWidget widget={activeWidget} />);

    // Verify initial state via aria-pressed
    expect(screen.getByRole('button', { name: /red light/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /yellow light/i })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: /red light/i }));

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      config: {
        active: 'none',
      },
    });
  });

  it('switches lights when a different one is clicked', async () => {
    const user = userEvent.setup();
    const activeWidget: WidgetData = {
      ...baseWidget,
      config: { active: 'green' } as TrafficConfig,
    };

    render(<TrafficLightWidget widget={activeWidget} />);

    await user.click(screen.getByRole('button', { name: /yellow light/i }));

    expect(mockUpdateWidget).toHaveBeenCalledWith('test-widget', {
      config: {
        active: 'yellow',
      },
    });
  });
});
