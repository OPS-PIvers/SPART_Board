import { describe, it, expect } from 'vitest';
import { getTitle } from './widgetHelpers';
import { WIDGET_DEFAULTS } from '../config/widgetDefaults';
import { WidgetData, TimeToolConfig, WidgetType } from '../types';

describe('widgetHelpers', () => {
  describe('getTitle', () => {
    it('returns custom title if present', () => {
      const widget = {
        customTitle: 'My Title',
        type: 'time-tool',
      } as WidgetData;
      expect(getTitle(widget)).toBe('My Title');
    });

    it('returns "Noise Meter" for sound widget', () => {
      const widget = { type: 'sound' } as WidgetData;
      expect(getTitle(widget)).toBe('Noise Meter');
    });

    it('returns "Task List" for checklist widget', () => {
      const widget = { type: 'checklist' } as WidgetData;
      expect(getTitle(widget)).toBe('Task List');
    });

    it('returns "App Manager" for miniApp widget', () => {
      const widget = { type: 'miniApp' } as WidgetData;
      expect(getTitle(widget)).toBe('App Manager');
    });

    it('returns capitalized type for other widgets', () => {
      const widget = { type: 'clock' } as WidgetData;
      expect(getTitle(widget)).toBe('Clock');
    });

    it('handles empty or null customTitle by falling back to type-based title', () => {
      const widget1 = { customTitle: '', type: 'clock' } as WidgetData;
      const widget2 = {
        customTitle: null,
        type: 'clock',
      } as unknown as WidgetData;
      expect(getTitle(widget1)).toBe('Clock');
      expect(getTitle(widget2)).toBe('Clock');
    });
  });

  describe('WIDGET_DEFAULTS', () => {
    it('contains correct defaults for time-tool', () => {
      const config = WIDGET_DEFAULTS['time-tool']?.config as TimeToolConfig;
      expect(config.mode).toBe('timer');
    });

    it('contains correct defaults for miniApp', () => {
      const config = WIDGET_DEFAULTS['miniApp']?.config;
      expect(config).toHaveProperty('activeApp', null);
    });

    it('contains correct defaults for checklist', () => {
      const config = WIDGET_DEFAULTS['checklist']?.config;
      expect(config).toMatchObject({
        items: [],
        mode: 'manual',
      });
    });

    it('contains empty config for traffic', () => {
      const config = WIDGET_DEFAULTS['traffic']?.config;
      expect(config).toEqual({});
    });

    it('contains defaults for all supported widget types', () => {
      const types: WidgetType[] = [
        'clock',
        'traffic',
        'text',
        'checklist',
        'random',
        'dice',
        'sound',
        'drawing',
        'qr',
        'embed',
        'poll',
        'webcam',
        'scoreboard',
        'workSymbols',
        'weather',
        'schedule',
        'calendar',
        'lunchCount',
        'classes',
        'instructionalRoutines',
        'time-tool',
        'miniApp',
      ];
      types.forEach((type) => {
        const defaults = WIDGET_DEFAULTS[type];
        expect(defaults).toBeDefined();
        expect(defaults?.config).toBeDefined();
        expect(typeof defaults?.config).toBe('object');
      });
    });
  });
});
