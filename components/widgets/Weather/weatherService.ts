import {
  EARTH_NETWORKS_API,
  EARTH_NETWORKS_ICONS,
  STATION_CONFIG,
} from './constants';
import {
  EarthNetworksResponse,
  OpenWeatherData,
  StandardizedWeatherData,
} from './types';

/**
 * Maps Earth Networks icon codes to our internal condition strings.
 */
export const mapEarthNetworksIcon = (ic: number): string => {
  if (EARTH_NETWORKS_ICONS.SNOW.includes(ic)) return 'snowy';
  if (EARTH_NETWORKS_ICONS.CLOUDY.includes(ic)) return 'cloudy';
  if (EARTH_NETWORKS_ICONS.SUNNY.includes(ic)) return 'sunny';
  if (EARTH_NETWORKS_ICONS.RAIN.includes(ic)) return 'rainy';
  return 'cloudy'; // Default fallback
};

/**
 * Fetches weather data from Earth Networks using multiple CORS proxies.
 */
export const fetchEarthNetworksWeather =
  async (): Promise<StandardizedWeatherData> => {
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
        const proxyUrl = getProxyUrl(url);
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`Proxy error: ${res.status}`);

        const text = await res.text();
        const trimmed = text.trim();

        if (
          !trimmed ||
          trimmed.startsWith('<') ||
          trimmed.toLowerCase().startsWith('<!doctype')
        ) {
          throw new Error(
            'Proxy returned HTML or empty response instead of JSON'
          );
        }

        data = JSON.parse(trimmed) as EarthNetworksResponse;
        if (data && data.o) break;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        console.warn(
          `[WeatherService] Proxy attempt failed: ${lastError.message}`
        );
      }
    }

    if (!data?.o) {
      throw lastError ?? new Error('Station data unavailable');
    }

    const obs = data.o;
    const condition = mapEarthNetworksIcon(obs.ic);

    return {
      temp: obs.t,
      feelsLike: obs.fl ?? obs.t,
      condition,
      locationName: STATION_CONFIG.name,
      lastSync: Date.now(),
    };
  };

/**
 * Fetches weather data from OpenWeatherMap.
 */
export const fetchOpenWeather = async (
  apiKey: string,
  query: string
): Promise<StandardizedWeatherData> => {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?${query}&appid=${apiKey}&units=imperial`
  );

  if (res.status === 401) {
    throw new Error(
      'Invalid API Key. If newly created, wait up to 2 hours for activation.'
    );
  }

  const data = (await res.json()) as OpenWeatherData;

  if (Number(data.cod) !== 200) {
    throw new Error(data.message ?? 'Failed to fetch');
  }

  return {
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    condition: data.weather[0].main.toLowerCase(),
    locationName: data.name,
    lastSync: Date.now(),
  };
};

export const fetchOpenWeatherByCity = async (apiKey: string, city: string) => {
  return fetchOpenWeather(apiKey, `q=${encodeURIComponent(city.trim())}`);
};

export const fetchOpenWeatherByCoords = async (
  apiKey: string,
  lat: number,
  lon: number
) => {
  return fetchOpenWeather(apiKey, `lat=${lat}&lon=${lon}`);
};
