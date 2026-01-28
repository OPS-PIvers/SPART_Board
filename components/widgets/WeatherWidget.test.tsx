/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-call */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WeatherWidget, WeatherSettings } from './WeatherWidget';
import { WidgetData, WeatherGlobalConfig } from '../../types';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';
import * as firestore from 'firebase/firestore';

// Mock dependencies
vi.mock('../../context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()), // Returns unsubscribe fn
  getDoc: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock('../../config/firebase', () => ({
  db: {},
}));

describe('WeatherWidget & Settings', () => {
  const mockUpdateWidget = vi.fn();
  const mockAddToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as Mock).mockReturnValue({
      updateWidget: mockUpdateWidget,
      addToast: mockAddToast,
      activeDashboard: { globalStyle: { fontFamily: 'sans' } },
    });
    (useAuth as Mock).mockReturnValue({
      featurePermissions: [],
    });

    // Stub fetch globally
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const baseWidget: WidgetData = {
    id: 'weather-1',
    type: 'weather',
    x: 0,
    y: 0,
    w: 2,
    h: 2,
    z: 0,
    flipped: false,
    config: {
      temp: 72,
      condition: 'sunny',
      isAuto: false,
      locationName: 'Classroom',
      source: 'openweather',
    },
  };

  it('renders manual controls in Settings when isAuto is false', () => {
    render(<WeatherSettings widget={baseWidget} />);

    // Check for range slider (Temperature)
    expect(screen.getByText(/Temperature/)).toBeInTheDocument();

    // Check for condition buttons
    expect(screen.getByText('sunny')).toBeInTheDocument();
    expect(screen.getByText('rainy')).toBeInTheDocument();
  });

  it('switches to Auto mode', () => {
    render(<WeatherSettings widget={baseWidget} />);

    fireEvent.click(screen.getByText('AUTOMATIC'));

    expect(mockUpdateWidget).toHaveBeenCalledWith('weather-1', {
      config: expect.objectContaining({ isAuto: true }),
    });
  });

  it('renders API controls in Settings when isAuto is true', () => {
    const autoWidget: WidgetData = {
      ...baseWidget,
      config: { ...baseWidget.config, isAuto: true } as any,
    };
    render(<WeatherSettings widget={autoWidget} />);

    expect(screen.getByText('OpenWeather')).toBeInTheDocument();
    expect(screen.getByText('School Station')).toBeInTheDocument();
  });

  it('syncs by city (OpenWeather)', async () => {
    const autoWidget: WidgetData = {
      ...baseWidget,
      config: {
        ...baseWidget.config,
        isAuto: true,
        source: 'openweather',
      } as any,
    };

    // Mock API key env
    vi.stubEnv('VITE_OPENWEATHER_API_KEY', 'test-key');

    // Mock Fetch
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        cod: 200,
        name: 'London',
        main: { temp: 50, feels_like: 45 },
        weather: [{ main: 'Rain' }],
      }),
    });

    const { rerender } = render(<WeatherSettings widget={autoWidget} />);

    // Enter city
    const input = screen.getByPlaceholderText('e.g. London, US');
    fireEvent.change(input, { target: { value: 'London' } });

    // Rerender with new city because component is controlled
    const updatedWidget: WidgetData = {
      ...autoWidget,
      config: { ...autoWidget.config, city: 'London' } as any,
    };
    rerender(<WeatherSettings widget={updatedWidget} />);

    // Click refresh using the new aria-label
    const refreshBtn = screen.getByRole('button', {
      name: /refresh city weather/i,
    });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(mockUpdateWidget).toHaveBeenCalledWith('weather-1', {
        config: expect.objectContaining({
          temp: 50,
          feelsLike: 45,
          condition: 'rain',
          locationName: 'London',
        }),
      });
    });

    // Check fetch url
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        'https://api.openweathermap.org/data/2.5/weather?q=London'
      )
    );
  });

  it('syncs by school station (Earth Networks)', async () => {
    const stationWidget: WidgetData = {
      ...baseWidget,
      config: {
        ...baseWidget.config,
        isAuto: true,
        source: 'earth_networks',
      } as any,
    };

    // Mock Fetch (Proxy then Data)
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          o: { t: 65, fl: 60, ic: 2 }, // 2 = sunny
        }),
    });

    render(<WeatherSettings widget={stationWidget} />);

    fireEvent.click(screen.getByText('Refresh Station Data'));

    await waitFor(() => {
      expect(mockUpdateWidget).toHaveBeenCalledWith('weather-1', {
        config: expect.objectContaining({
          temp: 65,
          feelsLike: 60,
          condition: 'sunny',
          source: 'earth_networks',
        }),
      });
    });
  });

  it('Admin Proxy: subscribes to global weather', () => {
    // Enable Admin Proxy via auth permissions
    (useAuth as Mock).mockReturnValue({
      featurePermissions: [
        {
          widgetType: 'weather',
          config: { fetchingStrategy: 'admin_proxy' } as WeatherGlobalConfig,
        },
      ],
    });

    const autoWidget: WidgetData = {
      ...baseWidget,
      config: { ...baseWidget.config, isAuto: true } as any,
    };

    // Render MAIN WIDGET (subscription happens there)
    render(<WeatherWidget widget={autoWidget} />);

    expect(firestore.onSnapshot).toHaveBeenCalled();

    // simulate update
    const callback = (firestore.onSnapshot as Mock).mock.calls[0][1];
    callback({
      exists: () => true,
      data: () => ({
        temp: 80,
        feelsLike: 85,
        condition: 'sunny',
        locationName: 'Global Loc',
        updatedAt: 12345,
      }),
    });

    expect(mockUpdateWidget).toHaveBeenCalledWith('weather-1', {
      config: expect.objectContaining({
        temp: 80,
        feelsLike: 85,
        condition: 'sunny',
        locationName: 'Global Loc',
      }),
    });
  });

  it('Admin Proxy: shows alert in settings', () => {
    (useAuth as Mock).mockReturnValue({
      featurePermissions: [
        {
          widgetType: 'weather',
          config: { fetchingStrategy: 'admin_proxy' } as WeatherGlobalConfig,
        },
      ],
    });

    const autoWidget: WidgetData = {
      ...baseWidget,
      config: { ...baseWidget.config, isAuto: true } as any,
    };

    render(<WeatherSettings widget={autoWidget} />);

    expect(
      screen.getByText(/Weather is managed by your administrator/)
    ).toBeInTheDocument();
    // Should NOT see manual source controls
    expect(screen.queryByText('OpenWeather')).not.toBeInTheDocument();
  });
});
