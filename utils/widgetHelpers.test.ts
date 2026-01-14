import { describe, it, expect } from 'vitest';
import { getTitle, getDefaultWidgetConfig } from './widgetHelpers';
import { WidgetData } from '../types';

describe('widgetHelpers', () => {
  describe('getTitle', () => {
    it('returns custom title if present', () => {
      const widget = { customTitle: 'My Title', type: 'timer' } as WidgetData;
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
      const widget = { type: 'timer' } as WidgetData;
      expect(getTitle(widget)).toBe('Timer');
    });
  });

  describe('getDefaultWidgetConfig', () => {
    it('returns correct defaults for timer', () => {
      const config = getDefaultWidgetConfig('timer');
      expect(config).toEqual({ duration: 300, sound: true });
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
