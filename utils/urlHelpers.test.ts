import { describe, it, expect, vi, afterEach } from 'vitest';
import { getOriginUrl, getJoinUrl } from './urlHelpers';

describe('urlHelpers', () => {
  const originalWindow = global.window;

  afterEach(() => {
    // Restore window after each test
    global.window = originalWindow;
  });

  describe('getOriginUrl', () => {
    it('returns window.location.origin when window is defined', () => {
      // Setup window mock
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'https://test-example.com',
          },
        },
        writable: true,
      });

      expect(getOriginUrl()).toBe('https://test-example.com');
    });

    it('returns empty string when window is undefined', () => {
      // Use type assertion to force undefined for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = undefined;

      expect(getOriginUrl()).toBe('');
    });
  });

  describe('getJoinUrl', () => {
    it('returns full join URL when window is defined', () => {
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'https://school-board.app',
          },
        },
        writable: true,
      });

      expect(getJoinUrl()).toBe('https://school-board.app/join');
    });

    it('returns /join when window is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (global as any).window = undefined;

      expect(getJoinUrl()).toBe('/join');
    });
  });
});
