import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Use a ref to track the latest config to prevent stale closures in effects/callbacks
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const {
    temp = 72,
    feelsLike,
    condition = 'sunny',
    isAuto = false,
    lastSync = null,
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
          // Use configRef.current to get the latest config state
          updateWidget(widgetId, {
            config: {
              ...configRef.current,
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
          // Note: using closure values here for comparison is fine as long as we use ref for update
          if (
            Math.round(data.temp) !== Math.round(temp) ||
            data.feelsLike !== feelsLike ||
            data.condition !== condition ||
            data.updatedAt !== lastSync
          ) {
            updateWidget(widgetId, {
              config: {
                ...configRef.current,
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

      // TODO: Replace public proxies with a secure backend proxy to improve reliability and security.
      // Current implementation matches legacy behavior but is fragile.
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
          ...configRef.current,
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
  }, [loading, widgetId, updateWidget, addToast]); // Removed `config` from deps as we use ref

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
            ...configRef.current,
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
    [hasApiKey, systemKey, widgetId, updateWidget, addToast]
  ); // Removed `config` from deps

  const refreshWeather = useCallback(async () => {
    // Check loading state to prevent double clicks
    if (!configRef.current.isAuto || loading) return;

    if (isAdminProxy) {
      addToast('Syncing with school station...', 'info');
      return;
    }

    if (configRef.current.source === 'earth_networks') {
      await fetchEarthNetworks();
    } else {
      // OpenWeather sync
      const city = configRef.current.city ?? '';
      const params = city.trim()
        ? `q=${encodeURIComponent(city.trim())}`
        : `lat=${STATION_CONFIG.lat}&lon=${STATION_CONFIG.lon}`;

      await fetchOpenWeather(params);
    }
  }, [loading, isAdminProxy, fetchEarthNetworks, fetchOpenWeather, addToast]);
  // Removed `isAuto`, `source`, `config.city` from deps since we use ref

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
