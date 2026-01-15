import { useState, useCallback } from 'react';
import { WeatherForecastPeriod } from '../types';

// Configuration constants
const STATION_CONFIG = {
  id: 'BLLST',
  lat: 44.99082,
  lon: -93.59635,
  name: 'Orono IS',
};

const EARTH_NETWORKS_API = {
  BASE_URL: 'https://owc.enterprise.earthnetworks.com/Data/GetData.ashx',
  PARAMS: {
    dt: 'o', // Default to observations
    pi: '3',
    units: 'english',
    verbose: 'false',
  },
};

// Icon mapping logic
const EARTH_NETWORKS_ICONS = {
  SNOW: [140, 186, 210, 102, 80, 78],
  CLOUDY: [1, 13, 24, 70, 71, 72, 73, 79],
  SUNNY: [2, 3, 4, 26],
  RAIN: [10, 11, 12, 14, 15, 16, 17, 18, 19, 137],
};

export const mapEarthNetworksIcon = (ic: number): string => {
  if (EARTH_NETWORKS_ICONS.SNOW.includes(ic)) return 'snowy';
  if (EARTH_NETWORKS_ICONS.CLOUDY.includes(ic)) return 'cloudy';
  if (EARTH_NETWORKS_ICONS.SUNNY.includes(ic)) return 'sunny';
  if (EARTH_NETWORKS_ICONS.RAIN.includes(ic)) return 'rainy';
  return 'cloudy'; // Default fallback
};

interface EarthNetworksObservation {
  t: number;
  ic: number;
}

interface EarthNetworksForecastPeriod {
  ic: number;
  sd: string;
  t: number;
  dd: string;
  fdls: string;
  intp: boolean;
}

interface EarthNetworksResponse {
  o?: EarthNetworksObservation;
  dfp?: EarthNetworksForecastPeriod[];
}

interface OpenWeatherData {
  cod: number | string;
  message?: string;
  name: string;
  main: {
    temp: number;
  };
  weather: [{ main: string }, ...{ main: string }[]];
}

export const useWeather = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWithProxy = async (
    url: string
  ): Promise<EarthNetworksResponse> => {
    // corsproxy.io is often more stable for Earth Networks.
    const proxies = [
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u: string) =>
        `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`,
    ];

    let lastError: Error | null = null;
    let data: EarthNetworksResponse | null = null;

    for (const getProxyUrl of proxies) {
      try {
        const proxyUrl = getProxyUrl(url);
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`Proxy error: ${res.status}`);

        const text = await res.text();
        if (!text || text.trim().startsWith('<!doctype')) {
          throw new Error(
            'Proxy returned HTML or empty response instead of JSON'
          );
        }

        try {
          data = JSON.parse(text) as EarthNetworksResponse;
        } catch (_) {
          throw new Error('Failed to parse response as JSON');
        }

        if (data) break;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        /* continue to next proxy */
      }
    }

    if (!data) {
      throw lastError ?? new Error('All proxy attempts failed');
    }

    return data;
  };

  const fetchEarthNetworksData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Current Observations
      const obsQueryParams = new URLSearchParams({
        ...EARTH_NETWORKS_API.PARAMS,
        si: STATION_CONFIG.id,
        locstr: `${STATION_CONFIG.lat},${STATION_CONFIG.lon}`,
      }).toString();
      const obsUrl = `${EARTH_NETWORKS_API.BASE_URL}?${obsQueryParams}`;

      const obsData = await fetchWithProxy(obsUrl);
      if (!obsData.o) throw new Error('No observation data available');

      // 2. Fetch Forecast (Daily Forecast Period)
      const forecastQueryParams = new URLSearchParams({
        dt: 'fd',
        loctype: 'latitudelongitude',
        locstr: `${STATION_CONFIG.lat},${STATION_CONFIG.lon}`,
        units: 'english',
      }).toString();
      const forecastUrl = `${EARTH_NETWORKS_API.BASE_URL}?${forecastQueryParams}`;

      const forecastData = await fetchWithProxy(forecastUrl);

      // Transform forecast data
      const forecast: WeatherForecastPeriod[] = (forecastData.dfp ?? []).map(
        (p) => {
          // Parse "Chance of precipitation X percent" from description if available
          // Usually present in 'dd' or 'sd'
          let precipChance = 0;
          const precipMatch =
            p.dd.match(
              /Chance of (?:precipitation|snow|rain) (\d+) percent/i
            ) ?? p.sd.match(/(\d+)% Chance/i);
          if (precipMatch) {
            precipChance = parseInt(precipMatch[1], 10);
          }

          return {
            startTime: p.fdls,
            isDaytime: !p.intp, // intp: false = day, true = night (usually)
            temp: p.t,
            condition: mapEarthNetworksIcon(p.ic),
            description: p.dd,
            shortDescription: p.sd,
            precipChance,
          };
        }
      );

      return {
        temp: obsData.o.t,
        condition: mapEarthNetworksIcon(obsData.o.ic),
        forecast,
        locationName: STATION_CONFIG.name,
      };
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to fetch weather data';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOpenWeatherData = useCallback(
    async (city: string, systemKey: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = city.trim()
          ? `q=${encodeURIComponent(city.trim())}`
          : `lat=${STATION_CONFIG.lat}&lon=${STATION_CONFIG.lon}`;

        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?${params}&appid=${systemKey}&units=imperial`
        );

        if (res.status === 401) throw new Error('Invalid API Key');
        const data = (await res.json()) as OpenWeatherData;

        if (data.cod !== 200) throw new Error(String(data.message));

        return {
          temp: data.main.temp,
          condition: data.weather[0].main.toLowerCase(),
          locationName: data.name,
          forecast: [], // OpenWeather free tier (current weather) doesn't give daily forecast in this endpoint
        };
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Failed to fetch OpenWeather data';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    fetchEarthNetworksData,
    fetchOpenWeatherData,
    STATION_CONFIG,
  };
};
