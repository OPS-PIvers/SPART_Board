import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchemaSettingsFallback } from './SchemaSettingsFallback';
import { WIDGET_SETTINGS_SCHEMAS } from '@/components/widgets/WidgetRegistry';
import {
  useDashboardActions,
  type DashboardActions,
} from '@/context/dashboardCanvasStore';
import { STANDARD_COLORS } from '@/config/colors';
import type { ClockConfig, WidgetData } from '@/types';

vi.mock('@/context/dashboardCanvasStore');

const mockUpdateWidget = vi.fn();

vi.mock('@/context/useAuth', () => ({
  useAuth: () => ({
    isAdmin: false,
    canAccessFeature: () => true,
  }),
}));

const config: ClockConfig = {
  format24: true,
  showSeconds: true,
  themeColor: STANDARD_COLORS.slate,
  fontFamily: 'global',
  clockStyle: 'modern',
  glow: false,
  dateColor: undefined,
};

const widget: WidgetData = {
  id: 'w1',
  type: 'clock',
  x: 0,
  y: 0,
  w: 280,
  h: 140,
  z: 1,
  config,
} as WidgetData;

describe('SchemaSettingsFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboardActions).mockReturnValue({
      updateWidget: mockUpdateWidget,
    } as unknown as DashboardActions);
  });

  it('renders the schema skeleton then the schema fields for a migrated widget', async () => {
    render(<SchemaSettingsFallback widget={widget} />);
    expect(
      screen.getByTestId('widget-settings-fallback-skeleton')
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: '24H Format' })
      ).toBeInTheDocument()
    );
    expect(
      screen.getByRole('switch', { name: 'Show Seconds' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Display Style' })
    ).toBeInTheDocument();
  });

  it('does not render a Style section (moved to SchemaAppearanceFallback)', async () => {
    render(<SchemaSettingsFallback widget={widget} />);
    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: 'Show Seconds' })
      ).toBeInTheDocument()
    );
    expect(screen.queryByText('Widget style')).not.toBeInTheDocument();
  });

  it('shows "Standard settings available." when the schema chunk fails to load', async () => {
    const originalLoader = WIDGET_SETTINGS_SCHEMAS.clock;
    WIDGET_SETTINGS_SCHEMAS.clock = () =>
      Promise.reject(new Error('chunk load failed'));
    try {
      render(<SchemaSettingsFallback widget={widget} />);
      await waitFor(() =>
        expect(
          screen.getByText('Standard settings available.')
        ).toBeInTheDocument()
      );
    } finally {
      WIDGET_SETTINGS_SCHEMAS.clock = originalLoader;
    }
  });

  it('calls updateWidget with the merged config when a field changes', async () => {
    render(<SchemaSettingsFallback widget={widget} />);
    const toggle = await waitFor(() =>
      screen.getByRole('switch', { name: 'Show Seconds' })
    );
    fireEvent.click(toggle);

    expect(mockUpdateWidget).toHaveBeenCalledWith('w1', {
      config: { ...config, showSeconds: false },
    });
  });
});
