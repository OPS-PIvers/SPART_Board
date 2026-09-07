import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MusicAppearanceSettings } from './Settings';
import { useDashboard } from '@/context/useDashboard';
import { WidgetData } from '@/types';

vi.mock('@/context/useDashboard', () => ({
  useDashboard: vi.fn(),
}));

const mockUpdateWidget = vi.fn();

const baseWidget: WidgetData = {
  id: 'music-test-1',
  type: 'music',
  x: 0,
  y: 0,
  w: 300,
  h: 200,
  z: 1,
  flipped: true,
  config: {
    stationId: 'lofi',
    bgColor: '#f8fafc',
    textColor: '#ffffff',
  },
};

describe('MusicAppearanceSettings — swatch groups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDashboard as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      updateWidget: mockUpdateWidget,
    });
  });

  it('marks the currently selected background swatch as checked and the rest as unchecked', () => {
    render(<MusicAppearanceSettings widget={baseWidget} />);

    const selected = screen.getByRole('radio', {
      name: /background color slate/i,
    });
    expect(selected).toHaveAttribute('aria-checked', 'true');

    const unselected = screen.getByRole('radio', {
      name: /background color white/i,
    });
    expect(unselected).toHaveAttribute('aria-checked', 'false');
  });

  it('gives the white text-color swatch a human-readable accessible name, not the raw hex', () => {
    // Regression: '#ffffff' is appended to WIDGET_PALETTE outside
    // STANDARD_COLORS, so without an explicit COLOR_HEX_TO_NAME entry the
    // `?? c` fallback exposed "Text color #ffffff" to screen readers.
    render(<MusicAppearanceSettings widget={baseWidget} />);

    const whiteSwatch = screen.getByRole('radio', {
      name: /text color white/i,
    });
    expect(whiteSwatch).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: /#ffffff/i })
    ).not.toBeInTheDocument();
  });

  it('marks the currently selected text-color swatch as checked', () => {
    render(<MusicAppearanceSettings widget={baseWidget} />);

    const selected = screen.getByRole('radio', { name: /text color white/i });
    expect(selected).toHaveAttribute('aria-checked', 'true');
  });

  it('calls updateWidget with the clicked background color', () => {
    render(<MusicAppearanceSettings widget={baseWidget} />);

    fireEvent.click(
      screen.getByRole('radio', { name: /background color dark/i })
    );

    expect(mockUpdateWidget).toHaveBeenCalledWith('music-test-1', {
      config: { bgColor: '#1e293b' },
    });
  });

  describe('keyboard navigation (roving tabindex)', () => {
    it('moves focus AND calls updateWidget on ArrowRight/ArrowLeft within the background group', () => {
      render(<MusicAppearanceSettings widget={baseWidget} />);

      const slate = screen.getByRole('radio', {
        name: /background color slate/i,
      });
      const dark = screen.getByRole('radio', {
        name: /background color dark/i,
      });
      const white = screen.getByRole('radio', {
        name: /background color white/i,
      });

      slate.focus();
      fireEvent.keyDown(slate, { key: 'ArrowRight' });
      expect(dark).toHaveFocus();
      expect(mockUpdateWidget).toHaveBeenLastCalledWith('music-test-1', {
        config: { bgColor: '#1e293b' },
      });

      fireEvent.keyDown(dark, { key: 'ArrowLeft' });
      expect(slate).toHaveFocus();
      expect(mockUpdateWidget).toHaveBeenLastCalledWith('music-test-1', {
        config: { bgColor: '#f8fafc' },
      });

      fireEvent.keyDown(slate, { key: 'ArrowLeft' });
      expect(white).toHaveFocus();
      expect(mockUpdateWidget).toHaveBeenLastCalledWith('music-test-1', {
        config: { bgColor: '#ffffff' },
      });
    });

    it('moves focus AND calls updateWidget on ArrowRight within the text-color group, wrapping past the end', () => {
      render(<MusicAppearanceSettings widget={baseWidget} />);

      // baseWidget's textColor ('#ffffff') is the LAST swatch (WIDGET_PALETTE + white
      // appended) — ArrowRight from here must wrap around to the first swatch (slate),
      // exercising the helper's modulo wrap-around rather than just a middle-of-list step.
      const white = screen.getByRole('radio', { name: /text color white/i });
      const slate = screen.getByRole('radio', { name: /text color slate/i });

      white.focus();
      fireEvent.keyDown(white, { key: 'ArrowRight' });
      expect(slate).toHaveFocus();
      expect(mockUpdateWidget).toHaveBeenLastCalledWith('music-test-1', {
        config: { textColor: '#1e293b' },
      });
    });

    it('does not let the two sibling radiogroups interfere with each other', () => {
      // Regression guard for the exact hazard the two onKeyDown handlers share a
      // helper for: each group's keydown must only ever move focus/selection within
      // its own `role="radiogroup"` container, never bleed into the sibling group.
      render(<MusicAppearanceSettings widget={baseWidget} />);

      const bgSlate = screen.getByRole('radio', {
        name: /background color slate/i,
      });
      bgSlate.focus();
      fireEvent.keyDown(bgSlate, { key: 'ArrowRight' });

      expect(mockUpdateWidget).toHaveBeenCalledTimes(1);
      expect(mockUpdateWidget).toHaveBeenLastCalledWith('music-test-1', {
        config: { bgColor: '#1e293b' },
      });
      // The text-color group's selection is untouched by the background group's keydown.
      expect(
        screen.getByRole('radio', { name: /text color white/i })
      ).toHaveAttribute('aria-checked', 'true');
    });
  });
});
