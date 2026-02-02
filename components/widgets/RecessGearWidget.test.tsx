import { render, screen } from '@testing-library/react';
import { RecessGearWidget } from './RecessGearWidget';
import { WidgetData, RecessGearConfig, WeatherConfig } from '../../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { useDashboard } from '../../context/useDashboard';

const mockUpdateWidget = vi.fn();

// Mock dependencies
vi.mock('../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

describe('RecessGearWidget', () => {
  const baseWidget: WidgetData = {
    id: 'recess-1',
    type: 'recessGear',
    x: 0,
    y: 0,
    w: 250,
    h: 280,
    z: 1,
    flipped: false,
    config: {
      linkedWeatherWidgetId: null,
      useFeelsLike: true,
    } as RecessGearConfig,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders required gear for snowy/freezing weather', () => {
    vi.mocked(useDashboard).mockReturnValue({
      activeDashboard: {
        widgets: [
          {
            id: 'weather-1',
            type: 'weather',
            config: {
              temp: 20,
              condition: 'snowy',
              locationName: 'North Pole',
            } as WeatherConfig,
          },
        ],
      },
      updateWidget: mockUpdateWidget,
    } as any);

    render(<RecessGearWidget widget={baseWidget} />);

    expect(screen.getByText(/Heavy Coat/i)).toBeInTheDocument();
    expect(screen.getByText(/Hat & Gloves/i)).toBeInTheDocument();
    expect(screen.getByText(/Snow Boots/i)).toBeInTheDocument();
    expect(screen.getByText(/Snow Pants/i)).toBeInTheDocument();
    expect(screen.getByText(/Linked to North Pole/i)).toBeInTheDocument();
  });

  it('renders helpful message when no weather widget is present', () => {
    vi.mocked(useDashboard).mockReturnValue({
      activeDashboard: { widgets: [] },
      updateWidget: mockUpdateWidget,
    } as any);

    render(<RecessGearWidget widget={baseWidget} />);

    expect(screen.getByText(/No Weather Data/i)).toBeInTheDocument();
    expect(screen.getByText(/Add a Weather widget/i)).toBeInTheDocument();
  });
});
