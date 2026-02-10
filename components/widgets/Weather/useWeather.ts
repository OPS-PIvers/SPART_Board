import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { WeatherConfig, WeatherGlobalConfig } from '../../../types';
import {
  OpenWeatherData,
  EarthNetworksResponse,
  GlobalWeatherData,
  STATION_CONFIG,
  EARTH_NETWORKS_API,
  EARTH_NETWORKS_ICONS,
} from './types';

export const useWeather = (widgetId: string, config: WeatherConfig) => {
  const { updateWidget, addToast } = useDashboard();
  const { featurePermissions } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    temp = 72,
    feelsLike,
    condition = 'sunny',
    isAuto = false,
    lastSync = null,
    source = 'openweather',
    showFeelsLike: localShowFeelsLike,
  } = config;

  const weatherPermission = featurePermissions.find(
    (p) => p.widgetType === 'weather'
  );
  const globalConfig = weatherPermission?.config as
    | WeatherGlobalConfig
    | undefined;

  const showFeelsLike =
    localShowFeelsLike ?? globalConfig?.showFeelsLike ?? false;

  const isAdminProxy = globalConfig?.fetchingStrategy === 'admin_proxy';

  const systemKey = import.meta.env.VITE_OPENWEATHER_API_KEY as
    | string
    | undefined;
  const hasApiKey = !!systemKey && systemKey.trim() !== '';

  // Initial Admin Proxy Fetch
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuto, globalConfig?.fetchingStrategy, widgetId, updateWidget]);
  // Omitted 'config' from deps to avoid infinite loop if updateWidget changes config ref
  // But strictly we should be careful. 'config' changes when we updateWidget.
  // The original code included 'config' in deps, which might be risky if updateWidget creates a new object reference that triggers the effect again.
  // However, isAuto and fetchingStrategy are the main triggers.

  // Admin Proxy Subscription
  useEffect(() => {
    if (!isAuto) return;
    if (globalConfig?.fetchingStrategy !== 'admin_proxy') return;

    const unsubscribe = onSnapshot(
      doc(db, 'global_weather', 'current'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as GlobalWeatherData;
          // Avoid infinite loop: check if data actually changed significantly
          if (
            Math.round(data.temp) !== Math.round(temp) ||
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuto,
    globalConfig?.fetchingStrategy,
    widgetId,
    updateWidget,
    temp,
    feelsLike,
    condition,
    lastSync,
  ]);

  const mapEarthNetworksIcon = (ic: number): string => {
    if (EARTH_NETWORKS_ICONS.SNOW.includes(ic)) return 'snowy';
    if (EARTH_NETWORKS_ICONS.CLOUDY.includes(ic)) return 'cloudy';
    if (EARTH_NETWORKS_ICONS.SUNNY.includes(ic)) return 'sunny';
    if (EARTH_NETWORKS_ICONS.RAIN.includes(ic)) return 'rainy';
    return 'cloudy'; // Default fallback
  };

  const fetchEarthNetworks = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
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

      let data: EarthNetworksResponse | null = null;
      let lastError: Error | null = null;

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
        } catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e));
        }
      }

      if (!data?.o) throw lastError ?? new Error('Station data unavailable');

      const newCondition = mapEarthNetworksIcon(data.o.ic);

      updateWidget(widgetId, {
        config: {
          ...config,
          temp: data.o.t,
          feelsLike: data.o.fl ?? data.o.t,
          condition: newCondition,
          locationName: STATION_CONFIG.name,
          lastSync: Date.now(),
          isAuto: true, // Ensure auto is on if we successfully fetched
        },
      });

      addToast(`Connected to ${STATION_CONFIG.name}`, 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [loading, widgetId, config, updateWidget, addToast]);

  const fetchOpenWeather = useCallback(
    async (params: string) => {
      if (!hasApiKey) {
        addToast(
          'Weather service is not configured. Please contact your administrator.',
          'error'
        );
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?${params}&appid=${systemKey}&units=imperial`
        );

        if (res.status === 401) {
          throw new Error(
            'Invalid API Key. If newly created, wait up to 2 hours for activation.'
          );
        }

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
        addToast(`Weather updated for ${data.name}`, 'success');
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Update failed', 'error');
      } finally {
        setLoading(false);
      }
    },
    [hasApiKey, systemKey, widgetId, config, updateWidget, addToast]
  );

  const refreshWeather = useCallback(async () => {
    if (!isAuto || loading) return;

    if (isAdminProxy) {
      addToast('Syncing with school station...', 'info');
      return;
    }

    if (source === 'earth_networks') {
      await fetchEarthNetworks();
    } else {
      // OpenWeather sync
      const city = config.city ?? '';
      const params = city.trim()
        ? `q=${encodeURIComponent(city.trim())}`
        : `lat=${STATION_CONFIG.lat}&lon=${STATION_CONFIG.lon}`;

      await fetchOpenWeather(params);
    }
  }, [
    isAuto,
    loading,
    isAdminProxy,
    source,
    config.city,
    fetchEarthNetworks,
    fetchOpenWeather,
    addToast,
  ]);

  return {
    loading,
    isAdminProxy,
    hasApiKey,
    showFeelsLike,
    globalConfig,
    fetchEarthNetworks,
    fetchOpenWeather,
    refreshWeather,
  };
};
