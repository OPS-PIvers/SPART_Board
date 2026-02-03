import { useState, useCallback, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { WeatherConfig, WeatherGlobalConfig } from '../../../types';
import { OpenWeatherData, EarthNetworksResponse, GlobalWeatherData } from './types';
import { STATION_CONFIG, EARTH_NETWORKS_API, EARTH_NETWORKS_ICONS } from './constants';

export const useWeather = (widgetId: string, config: WeatherConfig) => {
  const { updateWidget, addToast } = useDashboard();
  const { featurePermissions } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    temp,
    feelsLike,
    condition,
    isAuto,
    lastSync,
    source,
    city = '',
  } = config;

  const weatherPermission = featurePermissions.find(
    (p) => p.widgetType === 'weather'
  );
  const globalConfig = weatherPermission?.config as
    | WeatherGlobalConfig
    | undefined;

  const systemKey = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;

  // Admin Proxy Logic: Initial Fetch
  useEffect(() => {
    if (!isAuto || globalConfig?.fetchingStrategy !== 'admin_proxy') return;

    const fetchInitial = async () => {
      try {
        const snap = await getDoc(doc(db, 'global_weather', 'current'));
        if (snap.exists()) {
          const data = snap.data() as GlobalWeatherData;
          updateWidget(widgetId, {
            config: {
              ...config,
              temp: data.temp,
              feelsLike: data.feelsLike,
              condition: data.condition,
              locationName: data.locationName,
              lastSync: data.updatedAt,
            },
          });
        }
      } catch (err) {
        console.error('Failed to fetch initial global weather:', err);
      }
    };

    void fetchInitial();
  }, [isAuto, globalConfig?.fetchingStrategy, widgetId, updateWidget]);
  // Note: We avoid including `config` in dependencies to prevent infinite loops,
  // relying on `isAuto` and strategy changes.

  // Admin Proxy Logic: Subscription
  useEffect(() => {
    if (!isAuto) return;
    if (globalConfig?.fetchingStrategy !== 'admin_proxy') return;

    const unsubscribe = onSnapshot(
      doc(db, 'global_weather', 'current'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as GlobalWeatherData;
          if (
            Math.round(data.temp) !== Math.round(temp || 0) ||
            data.feelsLike !== feelsLike ||
            data.condition !== condition ||
            data.updatedAt !== lastSync
          ) {
            updateWidget(widgetId, {
              config: {
                ...config,
                temp: data.temp,
                feelsLike: data.feelsLike,
                condition: data.condition,
                locationName: data.locationName,
                lastSync: data.updatedAt,
              },
            });
          }
        }
      },
      (error) => {
        console.error('Failed to subscribe to global weather:', error);
      }
    );

    return () => unsubscribe();
  }, [
    isAuto,
    globalConfig?.fetchingStrategy,
    widgetId,
    updateWidget,
    temp,
    feelsLike,
    condition,
    lastSync,
    // We include config primitives to detect changes, but avoid full config object if possible.
    // However, since we spread `...config` in updateWidget, we need the latest config.
    // The check `Math.round(data.temp) !== ...` prevents loops if data hasn't changed.
    config,
  ]);

  const mapEarthNetworksIcon = (ic: number): string => {
    if (EARTH_NETWORKS_ICONS.SNOW.includes(ic)) return 'snowy';
    if (EARTH_NETWORKS_ICONS.CLOUDY.includes(ic)) return 'cloudy';
    if (EARTH_NETWORKS_ICONS.SUNNY.includes(ic)) return 'sunny';
    if (EARTH_NETWORKS_ICONS.RAIN.includes(ic)) return 'rainy';
    return 'cloudy';
  };

  const fetchEarthNetworksData = async (): Promise<EarthNetworksResponse['o'] | null> => {
     const queryParams = new URLSearchParams({
        ...EARTH_NETWORKS_API.PARAMS,
        si: STATION_CONFIG.id,
        locstr: `${STATION_CONFIG.lat},${STATION_CONFIG.lon}`,
      }).toString();

      const url = `${EARTH_NETWORKS_API.BASE_URL}?${queryParams}`;
      const proxies = [
        (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
        (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
        (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
      ];

      let lastError: Error | null = null;

      for (const getProxyUrl of proxies) {
        try {
          const res = await fetch(getProxyUrl(url));
          if (!res.ok) continue;
          const text = await res.text();
          const trimmed = text.trim();
          if (!trimmed || trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype')) continue;

          const data = JSON.parse(trimmed) as EarthNetworksResponse;
          if (data && data.o) return data.o;
        } catch (e) {
           lastError = e instanceof Error ? e : new Error(String(e));
        }
      }
      throw lastError || new Error('Station data unavailable');
  };

  // Unified Refresh Logic (for Widget)
  const refreshWeather = useCallback(async () => {
    if (!isAuto || isLoading) return;

    if (globalConfig?.fetchingStrategy === 'admin_proxy') {
      addToast('Syncing with school station...', 'info');
      return;
    }

    setIsLoading(true);

    try {
      if (source === 'earth_networks') {
        const obs = await fetchEarthNetworksData();
        if (!obs) throw new Error('Station data unavailable');

        updateWidget(widgetId, {
          config: {
            ...config,
            temp: obs.t,
            feelsLike: obs.fl ?? obs.t,
            condition: mapEarthNetworksIcon(obs.ic),
            locationName: STATION_CONFIG.name,
            lastSync: Date.now(),
          },
        });
      } else {
        if (!systemKey) throw new Error('API Key missing');
        const params = city.trim()
          ? `q=${encodeURIComponent(city.trim())}`
          : `lat=${STATION_CONFIG.lat}&lon=${STATION_CONFIG.lon}`;

        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?${params}&appid=${systemKey}&units=imperial`
        );
        const data = (await res.json()) as OpenWeatherData;
        if (Number(data.cod) !== 200) throw new Error(String(data.message));

        updateWidget(widgetId, {
          config: {
            ...config,
            temp: data.main.temp,
            feelsLike: data.main.feels_like,
            condition: data.weather[0].main.toLowerCase(),
            locationName: data.name,
            lastSync: Date.now(),
          },
        });
      }
      addToast('Weather updated', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuto, isLoading, globalConfig?.fetchingStrategy, source, city, systemKey, widgetId, config, updateWidget, addToast]);

  // Specific Actions (for Settings)
  const connectToStation = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const obs = await fetchEarthNetworksData();
      if (!obs) throw new Error('No observation data available');

      updateWidget(widgetId, {
        config: {
          ...config,
          temp: obs.t,
          feelsLike: obs.fl ?? obs.t,
          condition: mapEarthNetworksIcon(obs.ic),
          locationName: STATION_CONFIG.name,
          lastSync: Date.now(),
          isAuto: true,
          source: 'earth_networks'
        },
      });
      addToast(`Connected to ${STATION_CONFIG.name}`, 'success');
    } catch (err) {
      console.error(err);
      addToast(`Station connection failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const connectToOpenWeather = async (params: string) => {
     if (!systemKey) {
      addToast('Weather service is not configured.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?${params}&appid=${systemKey}&units=imperial`
      );
      if (res.status === 401) throw new Error('Invalid API Key.');
      const data = await res.json() as OpenWeatherData;
      if (Number(data.cod) !== 200) throw new Error(data.message ?? 'Failed to fetch');

      updateWidget(widgetId, {
        config: {
          ...config,
          temp: data.main.temp,
          feelsLike: data.main.feels_like,
          condition: data.weather[0].main.toLowerCase(),
          locationName: data.name,
          lastSync: Date.now(),
          source: 'openweather'
        },
      });
      addToast(`Weather updated for ${data.name}`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Weather sync failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    refreshWeather,
    connectToStation,
    connectToOpenWeather,
    globalConfig,
    hasApiKey: !!systemKey && systemKey.trim() !== ''
  };
};
