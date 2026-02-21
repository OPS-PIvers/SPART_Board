import { describe, it, expect } from 'vitest';
import { splitNames, mergeNames, generateStudentsList } from './rosterUtils';

describe('rosterUtils', () => {
  describe('splitNames', () => {
    it('splits full names into first and last names', () => {
      const input = 'John Doe\nJane Smith';
      const result = splitNames(input);
      expect(result.firsts).toEqual(['John', 'Jane']);
      expect(result.lasts).toEqual(['Doe', 'Smith']);
    });

    it('handles names without spaces', () => {
      const input = 'Cher\nMadonna';
      const result = splitNames(input);
      expect(result.firsts).toEqual(['Cher', 'Madonna']);
      expect(result.lasts).toEqual(['', '']);
    });

    it('handles multiple spaces (middle names)', () => {
      const input = 'John Jacob Jingleheimer Schmidt';
      const result = splitNames(input);
      // Logic is to split on last space
      expect(result.firsts).toEqual(['John Jacob Jingleheimer']);
      expect(result.lasts).toEqual(['Schmidt']);
    });

    it('handles empty lines', () => {
      const input = 'John Doe\n\nJane Smith';
      const result = splitNames(input);
      expect(result.firsts).toEqual(['John', '', 'Jane']);
      expect(result.lasts).toEqual(['Doe', '', 'Smith']);
    });
  });

  describe('mergeNames', () => {
    it('merges first and last names', () => {
      const firsts = 'John\nJane';
      const lasts = 'Doe\nSmith';
      const result = mergeNames(firsts, lasts);
      expect(result).toEqual(['John Doe', 'Jane Smith']);
    });

    it('handles missing last names', () => {
      const firsts = 'Cher\nMadonna';
      const lasts = '\n';
      const result = mergeNames(firsts, lasts);
      expect(result).toEqual(['Cher', 'Madonna']);
    });

    it('handles missing first names (edge case)', () => {
      const firsts = '\n';
      const lasts = 'Doe\nSmith';
      const result = mergeNames(firsts, lasts);
      expect(result).toEqual(['Doe', 'Smith']);
    });

    it('handles mismatched lengths', () => {
      const firsts = 'John\nJane\nJack';
      const lasts = 'Doe\nSmith';
      const result = mergeNames(firsts, lasts);
      expect(result).toEqual(['John Doe', 'Jane Smith', 'Jack']);
    });
  });

  describe('generateStudentsList', () => {
    it('generates student objects with IDs', () => {
      const firsts = 'John\nJane';
      const lasts = 'Doe\nSmith';
      const result = generateStudentsList(firsts, lasts);

      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('John');
      expect(result[0].lastName).toBe('Doe');
      expect(result[0].id).toBeDefined();

      expect(result[1].firstName).toBe('Jane');
      expect(result[1].lastName).toBe('Smith');
      expect(result[1].id).toBeDefined();
    });

    it('preserves existing IDs', () => {
      const existing = [
        { id: '123', firstName: 'OldJohn', lastName: 'OldDoe' },
      ];
      const firsts = 'John';
      const lasts = 'Doe';

      const result = generateStudentsList(firsts, lasts, existing);

      expect(result[0].id).toBe('123');
      expect(result[0].firstName).toBe('John');
      expect(result[0].lastName).toBe('Doe');
    });

    it('generates new IDs for new students', () => {
      const existing = [
        { id: '123', firstName: 'OldJohn', lastName: 'OldDoe' },
      ];
      const firsts = 'John\nJane';
      const lasts = 'Doe\nSmith';

      const result = generateStudentsList(firsts, lasts, existing);

      expect(result[0].id).toBe('123');
      expect(result[1].id).not.toBe('123');
      expect(result[1].firstName).toBe('Jane');
    });

    it('skips empty entries', () => {
      const firsts = 'John\n\nJane';
      const lasts = 'Doe\n\nSmith';
      const result = generateStudentsList(firsts, lasts);
      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('John');
      expect(result[1].firstName).toBe('Jane');
    });
  });
});
