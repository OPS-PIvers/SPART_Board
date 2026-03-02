import { describe, it, expect } from 'vitest';
import {
  scrubDashboardPII,
  extractDashboardPII,
  mergeDashboardPII,
  dashboardHasPII,
} from './dashboardPII';
import { Dashboard } from '../types';

describe('dashboardPII', () => {
  const mockDashboardNoPii: Dashboard = {
    id: 'dashboard-1',
    name: 'Test Dashboard',
    ownerId: 'user-1',
    createdAt: 1234567890,
    widgets: [
      {
        id: 'widget-1',
        type: 'ClockWidget',
        x: 0,
        y: 0,
        config: {
          style: 'analog',
        },
      },
    ],
  };

  const mockDashboardWithPii: Dashboard = {
    id: 'dashboard-2',
    name: 'Test Dashboard PII',
    ownerId: 'user-1',
    createdAt: 1234567890,
    widgets: [
      {
        id: 'widget-1',
        type: 'RandomWidget',
        x: 0,
        y: 0,
        config: {
          mode: 'wheel',
          firstNames: 'Alice\nBob',
          lastNames: 'Smith\nJones',
          remainingStudents: ['Alice', 'Bob'],
        },
      },
      {
        id: 'widget-2',
        type: 'SeatingChartWidget',
        x: 1,
        y: 1,
        config: {
          layout: 'grid',
          names: ['Alice Smith', 'Bob Jones'],
        },
      },
      {
        id: 'widget-3',
        type: 'ClockWidget',
        x: 2,
        y: 2,
        config: {
          style: 'digital',
        },
      },
    ],
  };

  describe('scrubDashboardPII', () => {
    it('returns an identical dashboard if there are no PII fields', () => {
      const scrubbed = scrubDashboardPII(mockDashboardNoPii);
      expect(scrubbed).toEqual(mockDashboardNoPii);
      expect(scrubbed).not.toBe(mockDashboardNoPii); // Ensure deep copy
    });

    it('removes PII fields from widget configs', () => {
      const scrubbed = scrubDashboardPII(mockDashboardWithPii);

      expect(scrubbed.widgets[0].config).toEqual({ mode: 'wheel' });
      expect(scrubbed.widgets[1].config).toEqual({ layout: 'grid' });
      expect(scrubbed.widgets[2].config).toEqual({ style: 'digital' });
    });

    it('does not mutate the original dashboard', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const originalCopy: Dashboard = JSON.parse(
        JSON.stringify(mockDashboardWithPii)
      );
      scrubDashboardPII(mockDashboardWithPii);
      expect(mockDashboardWithPii).toEqual(originalCopy);
    });
  });

  describe('extractDashboardPII', () => {
    it('returns an empty object if there are no PII fields', () => {
      const supplement = extractDashboardPII(mockDashboardNoPii);
      expect(supplement).toEqual({});
    });

    it('extracts only PII fields and maps them by widget ID', () => {
      const supplement = extractDashboardPII(mockDashboardWithPii);

      expect(supplement).toEqual({
        'widget-1': {
          firstNames: 'Alice\nBob',
          lastNames: 'Smith\nJones',
          remainingStudents: ['Alice', 'Bob'],
        },
        'widget-2': {
          names: ['Alice Smith', 'Bob Jones'],
        },
      });
      // widget-3 has no PII, so it should be omitted
      expect(supplement['widget-3']).toBeUndefined();
    });
  });

  describe('mergeDashboardPII', () => {
    it('returns an identical dashboard if the supplement is empty', () => {
      const merged = mergeDashboardPII(mockDashboardNoPii, {});
      expect(merged).toEqual(mockDashboardNoPii);
      expect(merged).not.toBe(mockDashboardNoPii); // Ensure deep copy
    });

    it('merges PII fields back into widget configs', () => {
      const scrubbed = scrubDashboardPII(mockDashboardWithPii);
      const supplement = extractDashboardPII(mockDashboardWithPii);

      const merged = mergeDashboardPII(scrubbed, supplement);

      expect(merged).toEqual(mockDashboardWithPii);
    });

    it('retains non-PII fields during merge', () => {
      const scrubbed = scrubDashboardPII(mockDashboardWithPii);
      const supplement = extractDashboardPII(mockDashboardWithPii);

      const merged = mergeDashboardPII(scrubbed, supplement);

      expect(merged.widgets[0].config).toHaveProperty('mode', 'wheel');
      expect(merged.widgets[1].config).toHaveProperty('layout', 'grid');
      expect(merged.widgets[2].config).toHaveProperty('style', 'digital');
    });
  });

  describe('dashboardHasPII', () => {
    it('returns false if there are no PII fields', () => {
      expect(dashboardHasPII(mockDashboardNoPii)).toBe(false);
    });

    it('returns true if there are PII fields', () => {
      expect(dashboardHasPII(mockDashboardWithPii)).toBe(true);
    });
  });
});
