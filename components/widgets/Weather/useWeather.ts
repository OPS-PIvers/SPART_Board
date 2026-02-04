import { useState, useCallback, useEffect, useRef } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { WidgetData, WeatherConfig, WeatherGlobalConfig } from '../../../types';
import {
  OpenWeatherData,
  EarthNetworksResponse,
  GlobalWeatherData,
} from './types';
import {
  STATION_CONFIG,
  EARTH_NETWORKS_API,
  EARTH_NETWORKS_ICONS,
} from './constants';

export const useWeather = (widget: WidgetData) => {
  const { updateWidget, addToast } = useDashboard();
  const { featurePermissions } = useAuth();
  const config = widget.config as WeatherConfig;
  const {
    temp = 72,
    feelsLike,
    condition = 'sunny',
    isAuto = false,
    lastSync = null,
    source = 'openweather',
    city = '',
  } = config;

  // Use a ref to store the latest config to avoid infinite loops in useEffect/useCallback
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(false);

  const weatherPermission = featurePermissions.find(
    (p) => p.widgetType === 'weather'
  );
  const globalConfig = weatherPermission?.config as
    | WeatherGlobalConfig
    | undefined;

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
          updateWidget(widget.id, {
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
  }, [isAuto, globalConfig?.fetchingStrategy, widget.id, updateWidget]);

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
            updateWidget(widget.id, {
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
    widget.id,
    updateWidget,
    temp,
    feelsLike,
    condition,
    lastSync,
  ]);

  const fetchEarthNetworksWeather = useCallback(async () => {
    // Prevent double loading states
    if (loading || isSyncing) return;

    setLoading(true);
    // Also set isSyncing if called via refresh button
    setIsSyncing(true);

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
            continue;
          }

          try {
            data = JSON.parse(trimmed) as EarthNetworksResponse;
          } catch (_) {
            /* try next */
          }

          if (data && data.o) break;
        } catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e));
          console.error(
            `[WeatherWidget] Proxy attempt failed: ${lastError.message}`
          );
        }
      }

      if (!data?.o) throw lastError ?? new Error('Station data unavailable');

      const obs = data.o;
      const newCondition = EARTH_NETWORKS_ICONS.SNOW.includes(obs.ic)
        ? 'snowy'
        : EARTH_NETWORKS_ICONS.CLOUDY.includes(obs.ic)
          ? 'cloudy'
          : EARTH_NETWORKS_ICONS.SUNNY.includes(obs.ic)
            ? 'sunny'
            : EARTH_NETWORKS_ICONS.RAIN.includes(obs.ic)
              ? 'rainy'
              : 'cloudy';

      updateWidget(widget.id, {
        config: {
          ...configRef.current,
          temp: obs.t,
          feelsLike: obs.fl ?? obs.t,
          condition: newCondition,
          locationName: STATION_CONFIG.name,
          lastSync: Date.now(),
          isAuto: true,
        },
      });

      addToast(`Connected to ${STATION_CONFIG.name}`, 'success');
    } catch (err) {
      console.error(err);
      let message = 'Station connection failed';
      if (err instanceof Error) {
        message += `: ${err.message}`;
      }
      addToast(message, 'error');
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [loading, isSyncing, widget.id, updateWidget, addToast]);

  const fetchWeather = useCallback(
    async (params: string) => {
      if (!hasApiKey) {
        addToast(
          'Weather service is not configured. Please contact your administrator.',
          'error'
        );
        return;
      }

      setLoading(true);
      setIsSyncing(true);

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

        if (Number(data.cod) !== 200)
          throw new Error(data.message ?? 'Failed to fetch');

        updateWidget(widget.id, {
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
        const message =
          err instanceof Error ? err.message : 'Weather sync failed';
        addToast(message, 'error');
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    },
    [hasApiKey, systemKey, widget.id, updateWidget, addToast]
  );

  const handleRefresh = useCallback(async () => {
    if (!isAuto || isSyncing) return;

    if (globalConfig?.fetchingStrategy === 'admin_proxy') {
      addToast('Syncing with school station...', 'info');
      return;
    }

    if (source === 'earth_networks') {
      await fetchEarthNetworksWeather();
    } else {
      const params = city.trim()
        ? `q=${encodeURIComponent(city.trim())}`
        : `lat=${STATION_CONFIG.lat}&lon=${STATION_CONFIG.lon}`;
      await fetchWeather(params);
    }
  }, [
    isAuto,
    isSyncing,
    globalConfig?.fetchingStrategy,
    source,
    city,
    fetchEarthNetworksWeather,
    fetchWeather,
    addToast,
  ]);

  const syncByCity = () => {
    if (!city.trim()) return addToast('Please enter a city name', 'info');
    void fetchWeather(`q=${encodeURIComponent(city.trim())}`);
  };

  const syncByLocation = () => {
    if (!navigator.geolocation)
      return addToast('Geolocation not supported', 'error');

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        void fetchWeather(
          `lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
        ),
      (_err) => {
        addToast('Location access denied', 'error');
        setLoading(false);
      }
    );
  };

  return {
    isSyncing,
    loading,
    globalConfig,
    hasApiKey,
    handleRefresh,
    fetchEarthNetworksWeather,
    fetchWeather,
    syncByCity,
    syncByLocation,
  };
};
