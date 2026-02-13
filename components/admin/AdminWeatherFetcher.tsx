import React, { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/useAuth';
import { WeatherGlobalConfig } from '@/types';
import { STATION_CONFIG } from '../widgets/Weather/constants';
import {
  fetchEarthNetworks,
  fetchOpenWeather,
} from '../widgets/Weather/weatherService';

export const AdminWeatherFetcher: React.FC = () => {
  const { featurePermissions } = useAuth();

  const weatherPermission = featurePermissions.find(
    (p) => p.widgetType === 'weather'
  );
  const config = weatherPermission?.config as WeatherGlobalConfig | undefined;

  useEffect(() => {
    // Only run if admin proxy is enabled
    if (config?.fetchingStrategy !== 'admin_proxy') return;

    const abortController = new AbortController();

    const fetchWeather = async () => {
      try {
        let temp = 72;
        let feelsLike = 72;
        let condition = 'sunny';
        let locationName = STATION_CONFIG.name;

        const source = config.source ?? 'openweather';

        if (source === 'earth_networks') {
          const data = await fetchEarthNetworks(
            STATION_CONFIG.id,
            STATION_CONFIG.lat,
            STATION_CONFIG.lon,
            abortController.signal
          );
          temp = data.temp;
          feelsLike = data.feelsLike;
          condition = data.condition;
          locationName = data.locationName;
        } else {
          // OpenWeather
          const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY as
            | string
            | undefined;
          if (!apiKey) throw new Error('No API Key');

          const city = config.city;
          const query =
            city && city.trim()
              ? `q=${encodeURIComponent(city.trim())}`
              : `lat=${STATION_CONFIG.lat}&lon=${STATION_CONFIG.lon}`;

          const data = await fetchOpenWeather(
            apiKey,
            query,
            abortController.signal
          );
          temp = data.temp;
          feelsLike = data.feelsLike;
          condition = data.condition;
          locationName = data.locationName;
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
        if (err instanceof Error && err.name === 'AbortError') return;
        console.error('[AdminWeatherFetcher] Failed to fetch:', err);
      }
    };

    // Initial fetch
    void fetchWeather();

    // Interval
    const frequency = Math.max(5, config.updateFrequencyMinutes ?? 15);
    const intervalId = setInterval(
      () => {
        void fetchWeather();
      },
      frequency * 60 * 1000
    );

    return () => {
      abortController.abort();
      clearInterval(intervalId);
    };
  }, [
    config?.fetchingStrategy,
    config?.updateFrequencyMinutes,
    config?.source,
    config?.city,
  ]);

  return null; // Headless component
};
