import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNutrislice } from './useNutrislice';
import { LunchCountConfig, WidgetData } from '../../../types';

const buildConfig = (
  overrides: Partial<LunchCountConfig> = {}
): LunchCountConfig => ({
  schoolSite: 'schumann-elementary',
  isManualMode: false,
  manualHotLunch: '',
  manualBentoBox: '',
  roster: [],
  rosterMode: 'class',
  assignments: {},
  ...overrides,
});

describe('useNutrislice', () => {
  const updateWidget = vi.fn();
  const addToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps hot lunch from Main section when Entree section is absent', async () => {
    const today = new Date().toISOString().split('T')[0];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify({
            days: [
              {
                date: today,
                menu_items: [
                  {
                    is_section_title: false,
                    section_name: 'Main Dishes',
                    food: { name: 'Chicken Alfredo' },
                  },
                ],
              },
            ],
          })
        ),
    } as Response);

    renderHook(() =>
      useNutrislice({
        widgetId: 'lunch-1',
        config: buildConfig(),
        updateWidget,
        addToast,
      })
    );

    await waitFor(() => {
      expect(updateWidget).toHaveBeenCalled();
    });

    const syncCall = (
      updateWidget.mock.calls as [string, Partial<WidgetData>][]
    )
      .map((call) => call[1].config as LunchCountConfig | undefined)
      .find((cfg) => cfg?.cachedMenu?.hotLunch === 'Chicken Alfredo');

    expect(syncCall?.cachedMenu?.hotLunch).toBe('Chicken Alfredo');
  });
});
