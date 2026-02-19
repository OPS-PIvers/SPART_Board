import { describe, it, expect } from 'vitest';
import { generateGroupedLayout } from './seatingChartLayouts';

describe('generateGroupedLayout', () => {
  it('should generate desks and assignments for groups', () => {
    const groups = [
      { names: ['Alice', 'Bob'] },
      { names: ['Charlie', 'David', 'Eve'] },
    ];
    const canvasW = 800;
    const canvasH = 600;
    const gridSize = 20;

    const result = generateGroupedLayout(groups, canvasW, canvasH, gridSize);

    // Total students = 5
    expect(result.furniture.length).toBe(5);
    expect(Object.keys(result.assignments).length).toBe(5);

    // Verify assignments match names
    expect(result.assignments['Alice']).toBeDefined();
    expect(result.assignments['Bob']).toBeDefined();
    expect(result.assignments['Charlie']).toBeDefined();

    // Verify furniture types
    result.furniture.forEach((item) => {
      expect(item.type).toBe('desk');
    });

    // Verify unique IDs
    const ids = new Set(result.furniture.map((f) => f.id));
    expect(ids.size).toBe(5);

    // Verify positions are within canvas (roughly)
    result.furniture.forEach((item) => {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.x).toBeLessThan(canvasW);
      expect(item.y).toBeLessThan(canvasH);
    });
  });

  it('should handle empty groups', () => {
    const groups: { names: string[] }[] = [];
    const result = generateGroupedLayout(groups, 800, 600, 20);
    expect(result.furniture.length).toBe(0);
    expect(Object.keys(result.assignments).length).toBe(0);
  });

  it('should handle single large group', () => {
    const groups = [{ names: ['A', 'B', 'C', 'D', 'E', 'F'] }];
    const result = generateGroupedLayout(groups, 800, 600, 20);
    expect(result.furniture.length).toBe(6);
    expect(Object.keys(result.assignments).length).toBe(6);
  });
});
