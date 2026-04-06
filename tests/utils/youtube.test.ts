import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  extractYouTubeId,
  buildSpotifyEmbedUrl,
  loadYouTubeApi,
} from '@/utils/youtube';

describe('youtube utils', () => {
  describe('extractYouTubeId', () => {
    it('extracts ID from standard watch URL', () => {
      expect(
        extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      ).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from youtu.be short URL', () => {
      expect(extractYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('extracts ID from embed URL', () => {
      expect(
        extractYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ')
      ).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from shorts URL', () => {
      expect(
        extractYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')
      ).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from v URL', () => {
      expect(extractYouTubeId('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('extracts ID with additional parameters', () => {
      expect(
        extractYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')
      ).toBe('dQw4w9WgXcQ');
      expect(
        extractYouTubeId('https://www.youtube.com/watch?foo=bar&v=dQw4w9WgXcQ')
      ).toBe('dQw4w9WgXcQ');
    });

    it('returns null for invalid or non-YouTube URLs', () => {
      expect(extractYouTubeId('https://example.com')).toBeNull();
      expect(
        extractYouTubeId('https://www.youtube.com/watch?v=123')
      ).toBeNull(); // ID too short
      expect(extractYouTubeId('invalid')).toBeNull();
      expect(extractYouTubeId('')).toBeNull();
    });
  });

  describe('buildSpotifyEmbedUrl', () => {
    it('returns null for non-https URLs', () => {
      expect(
        buildSpotifyEmbedUrl('http://open.spotify.com/track/123')
      ).toBeNull();
    });

    it('returns null for non-Spotify URLs', () => {
      expect(buildSpotifyEmbedUrl('https://example.com')).toBeNull();
    });

    it('handles invalid URLs gracefully', () => {
      expect(buildSpotifyEmbedUrl('invalid url')).toBeNull();
    });

    it('returns embed URL if already an embed URL', () => {
      expect(
        buildSpotifyEmbedUrl('https://open.spotify.com/embed/track/123')
      ).toBe('https://open.spotify.com/embed/track/123');
    });

    it('converts standard spotify URL to embed URL', () => {
      expect(buildSpotifyEmbedUrl('https://open.spotify.com/track/123')).toBe(
        'https://open.spotify.com/embed/track/123'
      );
      expect(
        buildSpotifyEmbedUrl('https://open.spotify.com/playlist/456?si=abc')
      ).toBe('https://open.spotify.com/embed/playlist/456?si=abc');
    });

    it('handles various valid hostnames', () => {
      expect(buildSpotifyEmbedUrl('https://spotify.com/track/123')).toBe(
        'https://spotify.com/embed/track/123'
      );
      expect(buildSpotifyEmbedUrl('https://play.spotify.com/track/123')).toBe(
        'https://play.spotify.com/embed/track/123'
      );
    });
  });

  describe('loadYouTubeApi', () => {
    let originalYT: typeof window.YT;
    let originalScriptTags: Element[];

    beforeEach(() => {
      originalYT = window.YT;
      originalScriptTags = Array.from(document.querySelectorAll('script'));
      document.head.innerHTML = '';
      window.YT = undefined;
      window.onYouTubeIframeAPIReady = undefined;
    });

    afterEach(() => {
      window.YT = originalYT;
      window.onYouTubeIframeAPIReady = undefined;
      document.head.innerHTML = '';
      originalScriptTags.forEach((tag) => document.head.appendChild(tag));
    });

    it('calls callback immediately if window.YT.Player exists', () => {
      const callback = vi.fn();
      window.YT = {
        Player: vi.fn() as unknown as NonNullable<typeof window.YT>['Player'],
      };

      loadYouTubeApi(callback);

      expect(callback).toHaveBeenCalledTimes(1);
      const scripts = document.querySelectorAll('script');
      expect(scripts.length).toBe(0);
    });

    it('adds script tag and queues callback if YT does not exist', () => {
      const callback = vi.fn();

      loadYouTubeApi(callback);

      expect(callback).not.toHaveBeenCalled();

      const scripts = document.querySelectorAll('script');
      expect(scripts.length).toBe(1);
      expect(scripts[0].src).toBe('https://www.youtube.com/iframe_api');
      expect(typeof window.onYouTubeIframeAPIReady).toBe('function');
    });

    it('calls all queued callbacks when onYouTubeIframeAPIReady is triggered', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      loadYouTubeApi(callback1);
      loadYouTubeApi(callback2);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();

      // Simulate script loading and calling the ready function
      if (window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady();
      }

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('preserves existing onYouTubeIframeAPIReady handler', () => {
      const existingHandler = vi.fn();
      window.onYouTubeIframeAPIReady = existingHandler;

      const callback = vi.fn();
      loadYouTubeApi(callback);

      if (window.onYouTubeIframeAPIReady) {
        window.onYouTubeIframeAPIReady();
      }

      expect(existingHandler).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('does not add multiple script tags', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      loadYouTubeApi(callback1);
      loadYouTubeApi(callback2);

      const scripts = document.querySelectorAll(
        'script[src*="youtube.com/iframe_api"]'
      );
      expect(scripts.length).toBe(1);
    });
  });
});
