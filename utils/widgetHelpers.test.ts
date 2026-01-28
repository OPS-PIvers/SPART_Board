import { describe, it, expect } from 'vitest';
import { getTitle, getDefaultWidgetConfig } from './widgetHelpers';
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

    it('returns "Notebook Viewer" for smartNotebook widget', () => {
      const widget = { type: 'smartNotebook' } as WidgetData;
      expect(getTitle(widget)).toBe('Notebook Viewer');
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

  describe('getDefaultWidgetConfig', () => {
    it('returns correct defaults for time-tool', () => {
      const config = getDefaultWidgetConfig('time-tool') as TimeToolConfig;
      expect(config.mode).toBe('timer');
    });

    it('returns correct defaults for miniApp', () => {
      const config = getDefaultWidgetConfig('miniApp');
      expect(config).toHaveProperty('activeApp', null);
    });

    it('returns correct defaults for smartNotebook', () => {
      const config = getDefaultWidgetConfig('smartNotebook');
      expect(config).toHaveProperty('activeNotebookId', null);
    });

    it('returns correct defaults for checklist', () => {
      const config = getDefaultWidgetConfig('checklist');
      expect(config).toEqual({ items: [] });
    });

    it('returns empty object for traffic', () => {
      const config = getDefaultWidgetConfig('traffic');
      expect(config).toEqual({});
    });

    it('returns defaults for all supported widget types', () => {
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
        const config = getDefaultWidgetConfig(type);
        expect(config).toBeDefined();
        expect(typeof config).toBe('object');
      });
    });
  });
});
