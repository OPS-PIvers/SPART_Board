import {
  EARTH_NETWORKS_API,
  EARTH_NETWORKS_ICONS,
  STATION_CONFIG,
} from './constants';
import {
  EarthNetworksResponse,
  NormalizedWeatherData,
  OpenWeatherData,
} from './types';

// Helper function to map Earth Networks icons
const mapEarthNetworksIcon = (ic: number): string => {
  if (EARTH_NETWORKS_ICONS.SNOW.includes(ic)) return 'snowy';
  if (EARTH_NETWORKS_ICONS.CLOUDY.includes(ic)) return 'cloudy';
  if (EARTH_NETWORKS_ICONS.SUNNY.includes(ic)) return 'sunny';
  if (EARTH_NETWORKS_ICONS.RAIN.includes(ic)) return 'rainy';
  return 'cloudy'; // Default fallback
};

export const fetchEarthNetworksData = async (
  signal?: AbortSignal
): Promise<NormalizedWeatherData> => {
  const queryParams = new URLSearchParams({
    ...EARTH_NETWORKS_API.PARAMS,
    si: STATION_CONFIG.id,
    locstr: `${STATION_CONFIG.lat},${STATION_CONFIG.lon}`,
  }).toString();

  const url = `${EARTH_NETWORKS_API.BASE_URL}?${queryParams}`;
  const proxies = [
    (u: string) =>
      `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) =>
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];

  let lastError: Error | null = null;
  let data: EarthNetworksResponse | null = null;

  for (const getProxyUrl of proxies) {
    try {
      const res = await fetch(getProxyUrl(url), { signal });
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

      data = JSON.parse(trimmed) as EarthNetworksResponse;
      if (data && data.o) break;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') throw err;
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  if (!data?.o) {
    throw lastError ?? new Error('Station data unavailable');
  }

  const obs = data.o;
  return {
    temp: obs.t,
    feelsLike: obs.fl ?? obs.t,
    condition: mapEarthNetworksIcon(obs.ic),
    locationName: STATION_CONFIG.name,
  };
};

export const fetchOpenWeatherData = async (
  apiKey: string,
  params: string, // e.g. "q=London" or "lat=...&lon=..."
  signal?: AbortSignal
): Promise<NormalizedWeatherData> => {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?${params}&appid=${apiKey}&units=imperial`,
    { signal }
  );

  if (res.status === 401) {
    throw new Error(
      'Invalid API Key. If newly created, wait up to 2 hours for activation.'
    );
  }

  const data = (await res.json()) as OpenWeatherData;

  if (Number(data.cod) !== 200) {
    throw new Error(String(data.message ?? 'Failed to fetch'));
  }

  return {
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    condition: data.weather[0].main.toLowerCase(),
    locationName: data.name,
  };
};
