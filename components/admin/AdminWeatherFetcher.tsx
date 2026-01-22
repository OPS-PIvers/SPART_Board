import React, { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/useAuth';
import { WeatherGlobalConfig } from '@/types';

// Constants shared with WeatherWidget
const STATION_CONFIG = {
  id: 'BLLST',
  lat: 44.99082,
  lon: -93.59635,
  name: 'Orono IS',
};

const EARTH_NETWORKS_API = {
  BASE_URL: 'https://owc.enterprise.earthnetworks.com/Data/GetData.ashx',
  PARAMS: {
    dt: 'o',
    pi: '3',
    units: 'english',
    verbose: 'false',
  },
};

const EARTH_NETWORKS_ICONS = {
  SNOW: [140, 186, 210, 102],
  CLOUDY: [1, 13, 24, 70, 71, 73, 79],
  SUNNY: [2, 3, 4],
  RAIN: [10, 11, 12, 14, 15, 16, 17, 18, 19],
};

interface OpenWeatherData {
  cod: number | string;
  message?: string;
  name: string;
  main: {
    temp: number;
    feels_like: number;
  };
  weather: [{ main: string }, ...{ main: string }[]];
}

interface EarthNetworksResponse {
  o?: {
    t: number;
    ic: number;
    fl?: number;
  };
}

export const AdminWeatherFetcher: React.FC = () => {
  const { featurePermissions } = useAuth();

  const weatherPermission = featurePermissions.find(
    (p) => p.widgetType === 'weather'
  );
  const config = weatherPermission?.config as WeatherGlobalConfig | undefined;

  useEffect(() => {
    // Only run if admin proxy is enabled
    if (config?.fetchingStrategy !== 'admin_proxy') return;

    const fetchWeather = async () => {
      try {
        let temp = 72;
        let feelsLike = 72;
        let condition = 'sunny';
        let locationName = STATION_CONFIG.name;

        const source = config.source ?? 'openweather';

        if (source === 'earth_networks') {
          // Earth Networks Fetch Logic
          const queryParams = new URLSearchParams({
            ...EARTH_NETWORKS_API.PARAMS,
            si: STATION_CONFIG.id,
            locstr: `${STATION_CONFIG.lat},${STATION_CONFIG.lon}`,
          }).toString();

          const url = `${EARTH_NETWORKS_API.BASE_URL}?${queryParams}`;
          const proxies = [
            (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
            (u: string) =>
              `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
          ];

          let data: EarthNetworksResponse | null = null;
          for (const getProxyUrl of proxies) {
            try {
              const res = await fetch(getProxyUrl(url));
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
            } catch (_) {
              /* try next */
            }
          }

          if (data?.o) {
            temp = data.o.t;
            feelsLike = data.o.fl ?? data.o.t;
            condition = EARTH_NETWORKS_ICONS.SNOW.includes(data.o.ic)
              ? 'snowy'
              : EARTH_NETWORKS_ICONS.CLOUDY.includes(data.o.ic)
                ? 'cloudy'
                : EARTH_NETWORKS_ICONS.SUNNY.includes(data.o.ic)
                  ? 'sunny'
                  : EARTH_NETWORKS_ICONS.RAIN.includes(data.o.ic)
                    ? 'rainy'
                    : 'cloudy';
            locationName = STATION_CONFIG.name;
          } else {
            throw new Error('Station data unavailable');
          }
        } else {
          // OpenWeather
          const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY as
            | string
            | undefined;
          if (!apiKey) throw new Error('No API Key');

          const city = config.city;
          const params =
            city && city.trim()
              ? `q=${encodeURIComponent(city.trim())}`
              : `lat=${STATION_CONFIG.lat}&lon=${STATION_CONFIG.lon}`;

          const res = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?${params}&appid=${apiKey}&units=imperial`
          );
          const data = (await res.json()) as OpenWeatherData;
          if (Number(data.cod) === 200) {
            temp = data.main.temp;
            feelsLike = data.main.feels_like;
            condition = data.weather[0].main.toLowerCase();
            locationName = data.name;
          } else {
            throw new Error(String(data.message));
          }
        }

        // Write to Firestore
        await setDoc(doc(db, 'global_weather', 'current'), {
          temp,
          feelsLike,
          condition,
          locationName,
          updatedAt: Date.now(),
          source,
        });

        console.warn(
          `[AdminWeatherFetcher] Updated weather: ${temp}° (Feels like ${feelsLike}°) ${condition}`
        );
      } catch (err) {
        console.error('[AdminWeatherFetcher] Failed to fetch:', err);
      }
    };

    // Initial fetch
    void fetchWeather();

    // Interval
    const frequency = Math.max(5, config.updateFrequencyMinutes ?? 15);
    const intervalId = setInterval(fetchWeather, frequency * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [
    config?.fetchingStrategy,
    config?.updateFrequencyMinutes,
    config?.source,
    config?.city,
  ]);

  return null; // Headless component
};
