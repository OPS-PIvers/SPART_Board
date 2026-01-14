import { describe, it, expect } from 'vitest';
import { getTitle, getDefaultWidgetConfig } from './widgetHelpers';
import { WidgetData, TimeToolConfig } from '../types';

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

    it('returns capitalized type for other widgets', () => {
      const widget = { type: 'clock' } as WidgetData;
      expect(getTitle(widget)).toBe('Clock');
    });
  });

  describe('getDefaultWidgetConfig', () => {
    it('returns correct defaults for time-tool', () => {
      const config = getDefaultWidgetConfig('time-tool') as TimeToolConfig;
      expect(config.mode).toBe('timer');
    });

    it('returns correct defaults for checklist', () => {
      const config = getDefaultWidgetConfig('checklist');
      expect(config).toEqual({ items: [] });
    });

    it('returns empty object for traffic', () => {
      const config = getDefaultWidgetConfig('traffic');
      expect(config).toEqual({});
    });
  });
});
