import { useState, useCallback, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import {
  WeatherConfig,
  WeatherGlobalConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../../types';
import { GlobalWeatherData, StandardizedWeatherData } from './types';
import { STATION_CONFIG } from './constants';
import {
  fetchEarthNetworksWeather,
  fetchOpenWeather,
  fetchOpenWeatherByCity,
  fetchOpenWeatherByCoords,
} from './weatherService';

export const useWeather = (widgetId: string, config: WeatherConfig) => {
  const { updateWidget, addToast, activeDashboard } = useDashboard();
  const { featurePermissions } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    temp = 72,
    feelsLike,
    condition = 'sunny',
    isAuto = false,
    lastSync,
    source = 'openweather',
    city = '',
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

  const updateWeatherData = useCallback(
    (data: StandardizedWeatherData) => {
      updateWidget(widgetId, {
        config: {
          ...config,
          temp: data.temp,
          feelsLike: data.feelsLike,
          condition: data.condition,
          locationName: data.locationName,
          lastSync: data.lastSync,
        },
      });
    },
    [updateWidget, widgetId, config]
  );

  // Initial Admin Proxy Fetch
  useEffect(() => {
    if (!isAuto || !isAdminProxy) return;

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
  }, [isAuto, isAdminProxy, widgetId, updateWidget]);

  // Admin Proxy Subscription
  useEffect(() => {
    if (!isAuto || !isAdminProxy) return;

    const unsubscribe = onSnapshot(
      doc(db, 'global_weather', 'current'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as GlobalWeatherData;
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
    isAdminProxy,
    widgetId,
    updateWidget,
    temp,
    feelsLike,
    condition,
    lastSync,
  ]);

  const refresh = useCallback(async () => {
    if (!isAuto || isSyncing) return;

    if (isAdminProxy) {
      addToast('Syncing with school station...', 'info');
      return;
    }

    setIsSyncing(true);

    try {
      if (source === 'earth_networks') {
        const data = await fetchEarthNetworksWeather();
        updateWeatherData(data);
      } else {
        if (!hasApiKey || !systemKey) throw new Error('API Key missing');
        const queryParams = city?.trim()
          ? `q=${encodeURIComponent(city.trim())}`
          : `lat=${STATION_CONFIG.lat}&lon=${STATION_CONFIG.lon}`;

        const data = await fetchOpenWeather(systemKey, queryParams);
        updateWeatherData(data);
      }
      addToast('Weather updated', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [
    isAuto,
    isSyncing,
    isAdminProxy,
    source,
    city,
    systemKey,
    hasApiKey,
    updateWeatherData,
    addToast,
  ]);

  const fetchStation = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await fetchEarthNetworksWeather();
      updateWidget(widgetId, {
        config: {
          ...config,
          temp: data.temp,
          feelsLike: data.feelsLike,
          condition: data.condition,
          locationName: data.locationName,
          lastSync: data.lastSync,
          isAuto: true,
          source: 'earth_networks',
        },
      });
      addToast(`Connected to ${STATION_CONFIG.name}`, 'success');
    } catch (err) {
      console.error(err);
      addToast(
        err instanceof Error ? err.message : 'Station connection failed',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [loading, updateWidget, widgetId, config, addToast]);

  const fetchByCity = useCallback(
    async (cityName: string) => {
      if (!hasApiKey || !systemKey) {
        addToast(
          'Weather service is not configured. Please contact your administrator.',
          'error'
        );
        return;
      }

      setLoading(true);
      try {
        const data = await fetchOpenWeatherByCity(systemKey, cityName);
        updateWidget(widgetId, {
          config: {
            ...config,
            temp: data.temp,
            feelsLike: data.feelsLike,
            condition: data.condition,
            locationName: data.locationName,
            lastSync: data.lastSync,
          },
        });
        addToast(`Weather updated for ${data.locationName}`, 'success');
      } catch (err) {
        addToast(
          err instanceof Error ? err.message : 'Weather sync failed',
          'error'
        );
      } finally {
        setLoading(false);
      }
    },
    [hasApiKey, systemKey, updateWidget, widgetId, config, addToast]
  );

  const fetchByLocation = useCallback(() => {
    if (!navigator.geolocation) {
      addToast('Geolocation not supported', 'error');
      return;
    }

    if (!hasApiKey || !systemKey) {
      addToast(
        'Weather service is not configured. Please contact your administrator.',
        'error'
      );
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchOpenWeatherByCoords(
            systemKey,
            pos.coords.latitude,
            pos.coords.longitude
          );
          updateWidget(widgetId, {
            config: {
              ...config,
              temp: data.temp,
              feelsLike: data.feelsLike,
              condition: data.condition,
              locationName: data.locationName,
              lastSync: data.lastSync,
            },
          });
          addToast(`Weather updated for ${data.locationName}`, 'success');
        } catch (err) {
          addToast(
            err instanceof Error ? err.message : 'Weather sync failed',
            'error'
          );
        } finally {
          setLoading(false);
        }
      },
      (_err) => {
        addToast('Location access denied', 'error');
        setLoading(false);
      }
    );
  }, [hasApiKey, systemKey, updateWidget, widgetId, config, addToast]);

  return {
    isSyncing,
    loading,
    refresh,
    fetchByCity,
    fetchByLocation,
    fetchStation,
    isAdminProxy,
    showFeelsLike,
    systemKey,
    hasApiKey,
    globalStyle: activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE,
    weatherPermission,
    globalConfig,
  };
};
