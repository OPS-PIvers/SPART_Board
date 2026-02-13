import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchOpenWeather,
  fetchEarthNetworks,
  mapEarthNetworksIcon,
} from './weatherService';

describe('weatherService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('mapEarthNetworksIcon', () => {
    it('should return snowy for snow icons', () => {
      expect(mapEarthNetworksIcon(140)).toBe('snowy');
      expect(mapEarthNetworksIcon(186)).toBe('snowy');
    });

    it('should return cloudy for cloudy icons', () => {
      expect(mapEarthNetworksIcon(1)).toBe('cloudy');
      expect(mapEarthNetworksIcon(13)).toBe('cloudy');
    });

    it('should return sunny for sunny icons', () => {
      expect(mapEarthNetworksIcon(2)).toBe('sunny');
    });

    it('should return rainy for rain icons', () => {
      expect(mapEarthNetworksIcon(10)).toBe('rainy');
    });

    it('should default to cloudy for unknown icons', () => {
      expect(mapEarthNetworksIcon(999)).toBe('cloudy');
    });
  });

  describe('fetchOpenWeather', () => {
    it('should fetch and format data correctly', async () => {
      const mockResponse = {
        cod: 200,
        name: 'Test City',
        main: {
          temp: 72.5,
          feels_like: 70.1,
        },
        weather: [{ main: 'Clear' }],
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const data = await fetchOpenWeather('test-key', 'q=Test City');

      expect(data).toEqual({
        temp: 72.5,
        feelsLike: 70.1,
        condition: 'clear',
        locationName: 'Test City',
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'https://api.openweathermap.org/data/2.5/weather'
        ),
        expect.anything()
      );
    });

    it('should throw error if cod is not 200', async () => {
      const mockResponse = {
        cod: 404,
        message: 'City not found',
      };

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      await expect(
        fetchOpenWeather('test-key', 'q=Invalid')
      ).rejects.toThrow('City not found');
    });
  });

  describe('fetchEarthNetworks', () => {
    it('should fetch via proxy and format data correctly', async () => {
      const mockData = {
        o: {
          t: 65,
          ic: 2, // Sunny
          fl: 63,
        },
      };

      // Mock fetch to return the JSON string as text
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockData)),
      } as Response);

      const data = await fetchEarthNetworks();

      expect(data).toEqual({
        temp: 65,
        feelsLike: 63,
        condition: 'sunny',
        locationName: 'Orono IS',
      });

      // Should have called one of the proxies
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw if station data is unavailable', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ o: null })),
      } as Response);

      await expect(fetchEarthNetworks()).rejects.toThrow(
        'Station data unavailable'
      );
    });

    it('should throw if parsing fails', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('Invalid JSON'),
      } as Response);

      await expect(fetchEarthNetworks()).rejects.toThrow(
        'Failed to parse Earth Networks response as JSON'
      );
    });
  });
});
