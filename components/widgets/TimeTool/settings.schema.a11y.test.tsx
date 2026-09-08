import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import { SettingsDrawer } from '@/components/settings/SettingsDrawer';
import { WIDGET_DEFAULTS } from '@/config/widgetDefaults';
import type { GlobalStyle, TimeToolConfig, WidgetData } from '@/types';
import schema from './settings.schema';

vi.mock('@/context/useDashboard', () => ({
  useDashboard: () => ({
    activeDashboard: { widgets: [{ type: 'expectations' }] },
  }),
}));

const config: TimeToolConfig = {
  mode: 'timer',
  visualType: 'digital',
  duration: 600,
  elapsedTime: 600,
  isRunning: false,
  startTime: null,
  selectedSound: 'Gong',
  adjustStepSeconds: 60,
  timerEndVoiceLevel: 2,
  timerEndTrafficColor: 'yellow',
  timerEndTriggerRandom: true,
  themeColor: '#1e293b',
  glow: false,
  fontFamily: 'global',
  clockStyle: 'modern',
};

const widget = {
  id: 'tt-1',
  type: 'time-tool',
  x: 0,
  y: 0,
  w: 420,
  h: 400,
  z: 1,
  config,
} as WidgetData;

// jsdom has no layout, so axe's color-contrast rule can only report "incomplete".
const STRUCTURAL_ONLY = { rules: { 'color-contrast': { enabled: false } } };

const renderDrawer = () =>
  render(
    <SettingsDrawer
      widget={widget}
      title="Timer"
      placement="right"
      width={400}
      onWidthCommit={vi.fn()}
      onClose={vi.fn()}
      updateWidget={vi.fn()}
      updateConfig={vi.fn()}
      globalStyle={{ windowTransparency: 0.5 } as GlobalStyle}
      schema={schema}
      defaults={WIDGET_DEFAULTS['time-tool'].config as Record<string, unknown>}
    />
  );

describe('time-tool settings drawer accessibility', () => {
  it('has no structural axe violations', async () => {
    const { baseElement } = renderDrawer();
    expect(await axe(baseElement, STRUCTURAL_ONLY)).toHaveNoViolations();
  });

  it('gives every Settings-tab control an accessible name', () => {
    renderDrawer();
    const dialog = screen.getByRole('dialog');
    // FieldRenderer's disabled-state <fieldset> wrappers carry the group role without being controls.
    const notWrapper = (el: HTMLElement) => el.tagName !== 'FIELDSET';
    for (const role of ['radiogroup', 'switch', 'spinbutton', 'group']) {
      const all = within(dialog).getAllByRole(role).filter(notWrapper);
      const named = within(dialog)
        .getAllByRole(role, { name: /\S/ })
        .filter(notWrapper);
      expect(all.length, role).toBeGreaterThan(0);
      expect(named.length, role).toBe(all.length);
    }
  });

  it('renders the expected field controls by name', () => {
    renderDrawer();
    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('radiogroup', { name: 'Mode' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('radiogroup', { name: 'Alert Sound' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('spinbutton', { name: 'Adjust Step (seconds)' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('radiogroup', {
        name: 'Switch to Voice Level when finished',
      })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('radiogroup', { name: 'Auto-set Traffic Light' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('switch', { name: 'Auto-Pick Random Student' })
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole('group', { name: 'Color Palette' })
    ).not.toBeInTheDocument();
    // Only the Traffic Light, Randomizer, Stations and NextUp tips remain: Expectations is on the board.
    expect(within(dialog).getAllByRole('listitem')).toHaveLength(4);
  });

  it('renders the display group on the Style tab', () => {
    renderDrawer();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('tab', { name: 'Style' }));
    expect(
      within(dialog).getByRole('radiogroup', { name: 'Display Style' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('radiogroup', { name: 'Number Style' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('group', { name: 'Color Palette' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('switch', { name: 'Glow' })
    ).toBeInTheDocument();
  });
});
