/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import { render, screen } from '@testing-library/react';
import { RecessGearWidget, RecessGearSettings } from './RecessGearWidget';
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

  it('uses feelsLike temperature when useFeelsLike is true', () => {
    vi.mocked(useDashboard).mockReturnValue({
      activeDashboard: {
        widgets: [
          {
            id: 'weather-1',
            type: 'weather',
            config: {
              temp: 70,
              feelsLike: 30, // Much colder feels like
              condition: 'sunny',
            } as WeatherConfig,
          },
        ],
      },
      updateWidget: mockUpdateWidget,
    } as any);

    const widget: WidgetData = {
      ...baseWidget,
      config: { ...baseWidget.config, useFeelsLike: true },
    };

    render(<RecessGearWidget widget={widget} />);

    // With 30 degrees, should show Heavy Coat
    expect(screen.getByText(/Heavy Coat/i)).toBeInTheDocument();
  });

  it('uses actual temperature when useFeelsLike is false', () => {
    vi.mocked(useDashboard).mockReturnValue({
      activeDashboard: {
        widgets: [
          {
            id: 'weather-1',
            type: 'weather',
            config: {
              temp: 70,
              feelsLike: 30,
              condition: 'sunny',
            } as WeatherConfig,
          },
        ],
      },
      updateWidget: mockUpdateWidget,
    } as any);

    const widget: WidgetData = {
      ...baseWidget,
      config: { ...baseWidget.config, useFeelsLike: false },
    };

    render(<RecessGearWidget widget={widget} />);

    // With 70 degrees, should show Long Sleeves
    expect(screen.getByText(/Long Sleeves/i)).toBeInTheDocument();
  });

  it('renders rain gear in rainy conditions', () => {
    vi.mocked(useDashboard).mockReturnValue({
      activeDashboard: {
        widgets: [
          {
            id: 'weather-1',
            type: 'weather',
            config: {
              temp: 60,
              condition: 'rainy',
            } as WeatherConfig,
          },
        ],
      },
      updateWidget: mockUpdateWidget,
    } as any);

    render(<RecessGearWidget widget={baseWidget} />);

    expect(screen.getByText(/Rain Boots/i)).toBeInTheDocument();
    expect(screen.getByText(/Umbrella/i)).toBeInTheDocument();
  });

  it('links to a specific weather widget by ID', () => {
    vi.mocked(useDashboard).mockReturnValue({
      activeDashboard: {
        widgets: [
          {
            id: 'weather-wrong',
            type: 'weather',
            config: {
              temp: 80,
              condition: 'sunny',
              locationName: 'Wrong Place',
            } as WeatherConfig,
          },
          {
            id: 'weather-right',
            type: 'weather',
            config: {
              temp: 10,
              condition: 'sunny',
              locationName: 'Right Place',
            } as WeatherConfig,
          },
        ],
      },
      updateWidget: mockUpdateWidget,
    } as any);

    const widget: WidgetData = {
      ...baseWidget,
      config: { ...baseWidget.config, linkedWeatherWidgetId: 'weather-right' },
    };

    render(<RecessGearWidget widget={widget} />);

    // Should show Heavy Coat (from 10 degrees) and link to Right Place
    expect(screen.getByText(/Heavy Coat/i)).toBeInTheDocument();
    expect(screen.getByText(/Linked to Right Place/i)).toBeInTheDocument();
  });

  it('renders settings panel correctly', () => {
    vi.mocked(useDashboard).mockReturnValue({
      activeDashboard: {
        widgets: [
          { id: 'w1', type: 'weather', config: { locationName: 'A' } },
          { id: 'w2', type: 'weather', config: { locationName: 'B' } },
        ],
      },
      updateWidget: mockUpdateWidget,
    } as any);

    render(<RecessGearSettings widget={baseWidget} />);

    expect(screen.getByText(/Smart Linking/i)).toBeInTheDocument();
    expect(screen.getByText(/Use "Feels Like" Temp/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText(/Weather at A/i)).toBeInTheDocument();
    expect(screen.getByText(/Weather at B/i)).toBeInTheDocument();
  });
});
