import {
  EARTH_NETWORKS_API,
  EARTH_NETWORKS_ICONS,
  STATION_CONFIG,
} from './constants';
import { EarthNetworksResponse, OpenWeatherData } from './types';

/**
 * Maps Earth Networks icon code to internal condition string.
 */
export const mapEarthNetworksIcon = (ic: number): string => {
  if (EARTH_NETWORKS_ICONS.SNOW.includes(ic)) return 'snowy';
  if (EARTH_NETWORKS_ICONS.CLOUDY.includes(ic)) return 'cloudy';
  if (EARTH_NETWORKS_ICONS.SUNNY.includes(ic)) return 'sunny';
  if (EARTH_NETWORKS_ICONS.RAIN.includes(ic)) return 'rainy';
  return 'cloudy'; // Default fallback
};

/**
 * Fetches data using a rotating list of CORS proxies.
 */
const fetchWithProxy = async (
  url: string,
  signal?: AbortSignal
): Promise<string> => {
  const proxies = [
    (u: string) =>
      `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) =>
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];

  let lastError: Error | null = null;

  for (const getProxyUrl of proxies) {
    if (signal?.aborted) throw new Error('Aborted');

    try {
      const proxyUrl = getProxyUrl(url);
      const res = await fetch(proxyUrl, { signal });
      if (!res.ok) continue;

      const text = await res.text();
      const trimmed = text.trim();

      if (
        !trimmed ||
        trimmed.startsWith('<') ||
        trimmed.toLowerCase().startsWith('<!doctype')
      ) {
        continue;
      }

      return trimmed;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('All proxy attempts failed');
};

/**
 * Fetches weather data from Earth Networks.
 */
export const fetchEarthNetworks = async (
  stationId: string = STATION_CONFIG.id,
  lat: number = STATION_CONFIG.lat,
  lon: number = STATION_CONFIG.lon,
  signal?: AbortSignal
) => {
  const queryParams = new URLSearchParams({
    ...EARTH_NETWORKS_API.PARAMS,
    si: stationId,
    locstr: `${lat},${lon}`,
  }).toString();

  const url = `${EARTH_NETWORKS_API.BASE_URL}?${queryParams}`;

  const jsonString = await fetchWithProxy(url, signal);
  let data: EarthNetworksResponse;

  try {
    data = JSON.parse(jsonString) as EarthNetworksResponse;
  } catch (_) {
    throw new Error('Failed to parse Earth Networks response as JSON');
  }

  if (!data?.o) {
    throw new Error('Station data unavailable');
  }

  return {
    temp: data.o.t,
    feelsLike: data.o.fl ?? data.o.t,
    condition: mapEarthNetworksIcon(data.o.ic),
    locationName: STATION_CONFIG.name,
  };
};

/**
 * Fetches weather data from OpenWeatherMap.
 */
export const fetchOpenWeather = async (
  apiKey: string,
  query: string,
  signal?: AbortSignal
) => {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=imperial`,
    { signal }
  );

  const data = (await res.json()) as OpenWeatherData;

  if (Number(data.cod) !== 200) {
    throw new Error(String(data.message));
  }

  return {
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    condition: data.weather[0].main.toLowerCase(),
    locationName: data.name,
  };
};
