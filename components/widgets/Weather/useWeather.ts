import { useState, useCallback, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import { WeatherConfig, WeatherGlobalConfig } from '../../../types';
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

export const useWeather = (widgetId: string, config: WeatherConfig) => {
  const { updateWidget, addToast } = useDashboard();
  const { featurePermissions } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    temp,
    feelsLike,
    condition,
    isAuto,
    lastSync,
    source,
    city,
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
  }, [isAuto, globalConfig?.fetchingStrategy, widgetId]);

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
            Math.round(data.temp) !== Math.round(temp ?? 0) ||
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

  const fetchEarthNetworksWeather = useCallback(async () => {
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

          try {
            data = JSON.parse(trimmed) as EarthNetworksResponse;
            console.warn(
              '[WeatherWidget] Fetched Earth Networks Data successfully'
            );
          } catch (_) {
            throw new Error('Failed to parse response as JSON');
          }

          if (data && data.o) break;
        } catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e));
          console.warn(
            `[WeatherWidget] Proxy attempt failed: ${lastError.message}`
          );
        }
      }

      if (!data) {
        throw lastError ?? new Error('All proxy attempts failed');
      }

      const obs = data.o;
      if (!obs) throw new Error('No observation data available');

      const newCondition = mapEarthNetworksIcon(obs.ic);

      updateWidget(widgetId, {
        config: {
          ...config,
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

        if (Number(data.cod) !== 200)
          throw new Error(data.message ?? 'Failed to fetch');

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
        const message =
          err instanceof Error ? err.message : 'Weather sync failed';
        addToast(message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [hasApiKey, addToast, systemKey, widgetId, config, updateWidget]
  );

  const syncByCity = useCallback(() => {
    if (!city?.trim()) return addToast('Please enter a city name', 'info');
    void fetchOpenWeather(`q=${encodeURIComponent(city.trim())}`);
  }, [city, addToast, fetchOpenWeather]);

  const syncByLocation = useCallback(() => {
    if (!navigator.geolocation)
      return addToast('Geolocation not supported', 'error');

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        void fetchOpenWeather(
          `lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
        ),
      (_err) => {
        addToast('Location access denied', 'error');
        setLoading(false);
      }
    );
  }, [addToast, fetchOpenWeather]);

  const refreshWeather = useCallback(async () => {
    if (!isAuto || loading) return;

    if (isAdminProxy) {
      addToast('Syncing with school station...', 'info');
      return;
    }

    if (source === 'earth_networks') {
      await fetchEarthNetworksWeather();
    } else {
      // Default OpenWeather
      const params = city?.trim()
        ? `q=${encodeURIComponent(city.trim())}`
        : `lat=${STATION_CONFIG.lat}&lon=${STATION_CONFIG.lon}`;
      await fetchOpenWeather(params);
    }
  }, [
    isAuto,
    loading,
    isAdminProxy,
    source,
    city,
    addToast,
    fetchEarthNetworksWeather,
    fetchOpenWeather,
  ]);

  return {
    loading,
    showFeelsLike,
    isAdminProxy,
    hasApiKey,
    refreshWeather,
    fetchEarthNetworksWeather,
    fetchOpenWeather,
    syncByCity,
    syncByLocation,
  };
};
