import { describe, it, expect, vi, afterEach } from 'vitest';
import { getOriginUrl, getJoinUrl } from './urlHelpers';

describe('urlHelpers', () => {
  const originalWindow = global.window;

  afterEach(() => {
    // Restore window after each test
    global.window = originalWindow;
    vi.restoreAllMocks();
  });

  describe('getOriginUrl', () => {
    it('returns window.location.origin when window is defined', () => {
      // Setup window mock
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'https://myschool.com',
          },
        },
        writable: true,
      });

      expect(getOriginUrl()).toBe('https://myschool.com');
    });

    it('returns empty string when window is undefined', () => {
      // @ts-expect-error - Simulating SSR environment
      delete global.window;

      expect(getOriginUrl()).toBe('');
    });
  });

  describe('getJoinUrl', () => {
    it('returns full join URL when window is defined', () => {
      Object.defineProperty(global, 'window', {
        value: {
          location: {
            origin: 'https://myschool.com',
          },
        },
        writable: true,
      });

      expect(getJoinUrl()).toBe('https://myschool.com/join');
    });

    it('returns relative join path when window is undefined', () => {
      // @ts-expect-error - Simulating SSR environment
      delete global.window;

      expect(getJoinUrl()).toBe('/join');
    });
  });
});
