import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SchemaAppearanceFallback } from './SchemaAppearanceFallback';
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

describe('SchemaAppearanceFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDashboardActions).mockReturnValue({
      updateWidget: mockUpdateWidget,
    } as unknown as DashboardActions);
  });

  it('renders the schema styleKeys fields for a migrated widget', async () => {
    render(<SchemaAppearanceFallback widget={widget} />);
    await waitFor(() =>
      expect(
        screen.getByRole('radiogroup', { name: 'Font' })
      ).toBeInTheDocument()
    );
  });

  it('calls updateWidget with the merged config when a style field changes', async () => {
    render(<SchemaAppearanceFallback widget={widget} />);
    const serif = await waitFor(() =>
      screen.getByRole('radio', { name: /^Serif$/i })
    );
    fireEvent.click(serif);
    expect(mockUpdateWidget).toHaveBeenCalledWith('w1', {
      config: { ...config, fontFamily: 'font-serif' },
    });
  });

  it('renders nothing for a widget type with no registered schema', () => {
    const { container } = render(
      <SchemaAppearanceFallback
        widget={{ ...widget, type: 'nonexistent' } as unknown as WidgetData}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when the schema chunk fails to load', async () => {
    const originalLoader = WIDGET_SETTINGS_SCHEMAS.clock;
    WIDGET_SETTINGS_SCHEMAS.clock = () =>
      Promise.reject(new Error('chunk load failed'));
    try {
      const { container } = render(
        <SchemaAppearanceFallback widget={widget} />
      );
      await waitFor(() => expect(container.firstChild).toBeNull());
    } finally {
      WIDGET_SETTINGS_SCHEMAS.clock = originalLoader;
    }
  });

  it('renders nothing when the schema declares no styleKeys', async () => {
    const originalLoader = WIDGET_SETTINGS_SCHEMAS.clock;
    WIDGET_SETTINGS_SCHEMAS.clock = () => Promise.resolve({ groups: [] });
    try {
      const { container } = render(
        <SchemaAppearanceFallback widget={widget} />
      );
      await waitFor(() => expect(container.firstChild).toBeNull());
    } finally {
      WIDGET_SETTINGS_SCHEMAS.clock = originalLoader;
    }
  });
});
