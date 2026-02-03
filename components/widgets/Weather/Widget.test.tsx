import { render, screen } from '@testing-library/react';
import { WeatherWidget } from './Widget';
import { WidgetData, WeatherGlobalConfig, WeatherConfig } from '../../../types';
import { vi, describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('../../../context/useDashboard', () => ({
  useDashboard: () => ({
    updateWidget: vi.fn(),
    addToast: vi.fn(),
    activeDashboard: undefined, // Explicitly undefined to trigger default
  }),
}));

const mockFeaturePermissions = [
  {
    widgetType: 'weather',
    config: {
      fetchingStrategy: 'client',
      temperatureRanges: [
        {
          id: '1',
          min: 0,
          max: 32,
          message: 'It is freezing!',
          imageUrl: 'ice.png',
        },
        {
          id: '2',
          min: 80,
          max: 100,
          message: 'It is hot!',
        },
      ],
    } as WeatherGlobalConfig,
  },
];

vi.mock('../../../context/useAuth', () => ({
  useAuth: () => ({
    featurePermissions: mockFeaturePermissions,
  }),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  getFirestore: vi.fn(),
}));

vi.mock('../../../config/firebase', () => ({
  db: {},
}));

describe('WeatherWidget', () => {
  const baseWidget: WidgetData = {
    id: '1',
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
      locationName: 'Test Loc',
    },
  };

  it('displays default clothing message when no range matches', () => {
    const widget: WidgetData = {
      ...baseWidget,
      config: { ...baseWidget.config, temp: 72 } as WeatherConfig,
    };
    render(<WeatherWidget widget={widget} />);
    // Default clothing for 72 is Short Sleeves (temp < 75 is Long Sleeves actually)
    // Code: if (temp < 75) return { label: 'Long Sleeves', icon: '👕' };
    expect(screen.getByText(/Long Sleeves/i)).toBeInTheDocument();
  });

  it('displays custom message and image when range matches (Freezing)', () => {
    const widget: WidgetData = {
      ...baseWidget,
      config: { ...baseWidget.config, temp: 20 } as WeatherConfig,
    };
    render(<WeatherWidget widget={widget} />);
    expect(screen.getByText('It is freezing!')).toBeInTheDocument();
    const img = screen.getByAltText('Weather');
    expect(img).toHaveAttribute('src', 'ice.png');
  });

  it('displays custom message without image when range matches (Hot)', () => {
    const widget: WidgetData = {
      ...baseWidget,
      config: { ...baseWidget.config, temp: 90 } as WeatherConfig,
    };
    render(<WeatherWidget widget={widget} />);
    expect(screen.getByText('It is hot!')).toBeInTheDocument();
  });
});
