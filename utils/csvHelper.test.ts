import { describe, it, expect, vi } from 'vitest';
import { escapeCSV, generateCSVContent, downloadCSV } from './csvHelper';

describe('csvHelper', () => {
  describe('escapeCSV', () => {
    it('should return empty string for null/undefined', () => {
      expect(escapeCSV(null)).toBe('');
      expect(escapeCSV(undefined)).toBe('');
    });

    it('should return string as is if no special chars', () => {
      expect(escapeCSV('hello')).toBe('hello');
      expect(escapeCSV(123)).toBe('123');
    });

    it('should escape commas', () => {
      expect(escapeCSV('hello, world')).toBe('"hello, world"');
    });

    it('should escape quotes', () => {
      expect(escapeCSV('hello "world"')).toBe('"hello ""world"""');
    });

    it('should escape newlines', () => {
      expect(escapeCSV('hello\nworld')).toBe('"hello\nworld"');
    });
  });

  describe('generateCSVContent', () => {
    it('should generate valid CSV string', () => {
      const headers = ['Name', 'Age', 'Bio'];
      const rows = [
        ['Alice', 30, 'Loves coding'],
        ['Bob', 25, 'Likes "pizza", and tacos'],
      ];
      const csv = generateCSVContent(headers, rows);
      expect(csv).toBe(
        'Name,Age,Bio\nAlice,30,Loves coding\nBob,25,"Likes ""pizza"", and tacos"'
      );
    });
  });

  describe('downloadCSV', () => {
    it('should create link and trigger click', () => {
      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:url');
      global.URL.revokeObjectURL = vi.fn();

      const clickSpy = vi.fn();
      const setAttributeSpy = vi.fn();
      const mockAnchor = {
        setAttribute: setAttributeSpy,
        style: {},
        click: clickSpy,
        download: '',
      } as unknown as HTMLAnchorElement;

      const createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockReturnValue(mockAnchor);
      const appendChildSpy = vi
        .spyOn(document.body, 'appendChild')
        .mockImplementation(() => mockAnchor);
      const removeChildSpy = vi
        .spyOn(document.body, 'removeChild')
        .mockImplementation(() => mockAnchor);

      downloadCSV('test.csv', 'content');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(setAttributeSpy).toHaveBeenCalledWith('href', 'blob:url');
      expect(setAttributeSpy).toHaveBeenCalledWith('download', 'test.csv');
      expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
      expect(clickSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
    });
  });
});
