import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrateWidget, migrateLocalStorageToFirestore } from './migration';
import { WidgetData, Dashboard, TextConfig } from '../types';

describe('migration', () => {
  describe('migrateWidget', () => {
    it('migrates legacy timer widget to time-tool', () => {
      const legacyWidget = {
        id: '123',
        type: 'timer',
        config: { duration: 300 },
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        z: 1,
      } as unknown as WidgetData;

      const newWidget = migrateWidget(legacyWidget);

      expect(newWidget.type).toBe('time-tool');
      expect(newWidget.config).toMatchObject({
        mode: 'timer',
        duration: 300,
        elapsedTime: 300,
        visualType: 'digital',
      });
    });

    it('migrates legacy stopwatch widget to time-tool', () => {
      const legacyWidget = {
        id: '123',
        type: 'stopwatch',
        config: {},
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        z: 1,
      } as unknown as WidgetData;

      const newWidget = migrateWidget(legacyWidget);

      expect(newWidget.type).toBe('time-tool');
      expect(newWidget.config).toMatchObject({
        mode: 'stopwatch',
        duration: 0,
        elapsedTime: 0,
      });
    });

    it('sanitizes text widget content', () => {
      const dangerousWidget = {
        id: '123',
        type: 'text',
        config: { content: 'Safe<script>alert(1)</script>' },
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        z: 1,
      } as unknown as WidgetData;

      const newWidget = migrateWidget(dangerousWidget);

      expect(newWidget.type).toBe('text');
      expect((newWidget.config as TextConfig).content).toBe('Safe');
    });

    it('returns other widgets unchanged', () => {
      const widget = {
        id: '123',
        type: 'clock',
        config: { format24: true },
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        z: 1,
      } as WidgetData;

      const newWidget = migrateWidget(widget);
      expect(newWidget).toEqual(widget);
    });
  });

  describe('migrateLocalStorageToFirestore', () => {
    beforeEach(() => {
      localStorage.clear();
      vi.restoreAllMocks();
    });

    it('migrates dashboards and clears local storage', async () => {
      const dashboards = [
        { id: 'd1', name: 'Board 1' },
        { id: 'd2', name: 'Board 2' },
      ] as Dashboard[];

      localStorage.setItem('classroom_dashboards', JSON.stringify(dashboards));

      const saveDashboard = vi.fn().mockResolvedValue(undefined);
      const userId = 'user123';

      const count = await migrateLocalStorageToFirestore(userId, saveDashboard);

      expect(count).toBe(2);
      expect(saveDashboard).toHaveBeenCalledTimes(2);
      expect(saveDashboard).toHaveBeenCalledWith(dashboards[0]);
      expect(saveDashboard).toHaveBeenCalledWith(dashboards[1]);
      expect(localStorage.getItem('classroom_dashboards')).toBeNull();
    });

    it('does nothing if local storage is empty', async () => {
      const saveDashboard = vi.fn();
      const count = await migrateLocalStorageToFirestore('u1', saveDashboard);

      expect(count).toBe(0);
      expect(saveDashboard).not.toHaveBeenCalled();
    });

    it('handles json parse error', async () => {
      localStorage.setItem('classroom_dashboards', 'invalid-json');
      const saveDashboard = vi.fn();

      await expect(
        migrateLocalStorageToFirestore('u1', saveDashboard)
      ).rejects.toThrow();
      expect(saveDashboard).not.toHaveBeenCalled();
    });
  });
});
