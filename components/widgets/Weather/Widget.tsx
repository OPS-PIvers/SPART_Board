import React, { useState, useCallback, useEffect } from 'react';
import {
  doc,
  onSnapshot,
  getDoc,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useDashboard } from '../../../context/useDashboard';
import { useAuth } from '../../../context/useAuth';
import {
  WidgetData,
  WeatherConfig,
  WeatherGlobalConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../../types';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  MapPin,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { WidgetLayout } from '../WidgetLayout';
import { STATION_CONFIG } from './constants';
import { GlobalWeatherData } from './types';
import { fetchEarthNetworks, fetchOpenWeather } from './weatherService';

const weatherConverter: FirestoreDataConverter<GlobalWeatherData> = {
  toFirestore(data: GlobalWeatherData): DocumentData {
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot<DocumentData, DocumentData>,
    options: SnapshotOptions
  ): GlobalWeatherData {
    const data = snapshot.data(options);
    return data as GlobalWeatherData;
  },
};

export const WeatherWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, addToast, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const { featurePermissions } = useAuth();
  const config = widget.config as WeatherConfig;
  const {
    temp = 72,
    feelsLike,
    condition = 'sunny',
    isAuto = false,
    locationName = 'Classroom',
    lastSync = null,
    source = 'openweather',
    city = '',
    showFeelsLike: localShowFeelsLike,
  } = config;

  const [isSyncing, setIsSyncing] = useState(false);

  const weatherPermission = featurePermissions.find(
    (p) => p.widgetType === 'weather'
  );
  const globalConfig = weatherPermission?.config as
    | WeatherGlobalConfig
    | undefined;

  // Use local config if set, otherwise fallback to global config
  const showFeelsLike =
    localShowFeelsLike ?? globalConfig?.showFeelsLike ?? false;

  const systemKey = import.meta.env.VITE_OPENWEATHER_API_KEY as
    | string
    | undefined;

  // Initial Admin Proxy Fetch
  useEffect(() => {
    if (!isAuto || globalConfig?.fetchingStrategy !== 'admin_proxy') return;

    const fetchInitial = async () => {
      try {
        const snap = await getDoc(
          doc(db, 'global_weather', 'current').withConverter(weatherConverter)
        );
        if (snap.exists()) {
          const data = snap.data();
          updateWidget(widget.id, {
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
  }, [isAuto, globalConfig?.fetchingStrategy, widget.id, config, updateWidget]);

  // Admin Proxy Subscription
  useEffect(() => {
    if (!isAuto) return;
    if (globalConfig?.fetchingStrategy !== 'admin_proxy') return;

    const unsubscribe = onSnapshot(
      doc(db, 'global_weather', 'current').withConverter(weatherConverter),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          // Avoid infinite loop: check if data actually changed significantly
          if (
            Math.round(data.temp) !== Math.round(temp) ||
            data.feelsLike !== feelsLike ||
            data.condition !== condition ||
            data.updatedAt !== lastSync
          ) {
            updateWidget(widget.id, {
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
    widget.id,
    updateWidget,
    temp,
    feelsLike,
    condition,
    lastSync,
    config,
  ]);

  const handleRefresh = useCallback(async () => {
    if (!isAuto || isSyncing) return;

    // If Admin Proxy is on, we don't fetch manually, we just wait for subscription.
    // But user clicked "Refresh", so maybe we can trigger a check or just toast.
    if (globalConfig?.fetchingStrategy === 'admin_proxy') {
      addToast('Syncing with school station...', 'info');
      return;
    }

    setIsSyncing(true);

    try {
      let data: {
        temp: number;
        feelsLike: number;
        condition: string;
        locationName: string;
      };

      if (source === 'earth_networks') {
        data = await fetchEarthNetworks();
      } else {
        // OpenWeather sync
        if (!systemKey) throw new Error('API Key missing');
        const query = city.trim()
          ? `q=${encodeURIComponent(city.trim())}`
          : `lat=${STATION_CONFIG.lat}&lon=${STATION_CONFIG.lon}`;

        data = await fetchOpenWeather(systemKey, query);
      }

      updateWidget(widget.id, {
        config: {
          ...config,
          temp: data.temp,
          feelsLike: data.feelsLike,
          condition: data.condition,
          locationName: data.locationName,
          lastSync: Date.now(),
        },
      });

      addToast('Weather updated', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [
    isAuto,
    globalConfig?.fetchingStrategy,
    source,
    city,
    systemKey,
    widget.id,
    config,
    updateWidget,
    addToast,
    isSyncing,
  ]);

  const getIcon = (size: string) => {
    switch (condition.toLowerCase()) {
      case 'cloudy':
      case 'clouds':
        return <Cloud size={size} className="text-slate-500" />;
      case 'rainy':
      case 'rain':
      case 'drizzle':
        return <CloudRain size={size} className="text-blue-400" />;
      case 'snowy':
      case 'snow':
        return <CloudSnow size={size} className="text-blue-200" />;
      case 'windy':
      case 'squall':
      case 'tornado':
        return <Wind size={size} className="text-slate-500" />;
      case 'sunny':
      case 'clear':
        return <Sun size={size} className="text-amber-400 animate-spin-slow" />;
      default:
        return <Sun size={size} className="text-amber-400 animate-spin-slow" />;
    }
  };

  const getClothing = () => {
    if (temp < 40) return { label: 'Heavy Coat & Hat', icon: '🧤' };
    if (temp < 60) return { label: 'Light Jacket', icon: '🧥' };
    if (temp < 75) return { label: 'Long Sleeves', icon: '👕' };
    return { label: 'Short Sleeves', icon: '🩳' };
  };

  const clothing = getClothing();

  // Custom Message/Image Logic
  let displayMessage: React.ReactNode = (
    <>
      Today is <span className="text-indigo-600 uppercase">{condition}</span>.
      <br />
      Wear a <span className="text-indigo-600">{clothing.label}</span>!
    </>
  );
  let displayImage = <span>{clothing.icon}</span>;

  if (globalConfig?.temperatureRanges) {
    const match = globalConfig.temperatureRanges.find((r) => {
      if (r.type === 'above') return temp > r.min;
      if (r.type === 'below') return temp < r.max;
      return temp >= r.min && temp <= r.max;
    });
    if (match) {
      displayMessage = match.message;
      if (match.imageUrl) {
        displayImage = (
          <img
            src={match.imageUrl}
            alt="Weather"
            className="w-full h-full object-cover rounded-lg"
          />
        );
      }
    }
  }

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div
          className={`flex flex-col items-center justify-center h-full w-full font-${globalStyle.fontFamily}`}
          style={{ gap: 'min(12px, 2cqh)', padding: 'min(8px, 2cqmin)' }}
        >
          <div
            className="font-black uppercase tracking-widest text-slate-600 flex items-center"
            style={{ gap: 'min(6px, 1cqh)', fontSize: 'min(6cqh, 70cqw)' }}
          >
            <MapPin style={{ width: '1.2em', height: '1.2em' }} />{' '}
            {locationName}
          </div>

          <div
            className="flex items-center justify-center w-full"
            style={{ gap: 'min(24px, 4cqw)' }}
          >
            <div style={{ fontSize: 'min(30cqh, 25cqw)' }}>
              {getIcon('1em')}
            </div>
            <div className="flex flex-col items-center">
              <div
                className="font-black text-slate-800 tabular-nums leading-none"
                style={{ fontSize: 'min(40cqh, 35cqw)' }}
              >
                {showFeelsLike && feelsLike !== undefined
                  ? Math.round(feelsLike)
                  : Math.round(temp)}
                °
              </div>
              {showFeelsLike ? (
                <div
                  className="font-black text-slate-600 uppercase tracking-wider whitespace-nowrap"
                  style={{
                    fontSize: 'min(6cqh, 20cqw)',
                    marginTop: 'min(4px, 1cqh)',
                  }}
                >
                  Actual {Math.round(temp)}°
                </div>
              ) : (
                feelsLike !== undefined && (
                  <div
                    className="font-black text-slate-600 uppercase tracking-wider whitespace-nowrap"
                    style={{
                      fontSize: 'min(6cqh, 20cqw)',
                      marginTop: 'min(4px, 1cqh)',
                    }}
                  >
                    Feels like {Math.round(feelsLike)}°
                  </div>
                )
              )}
            </div>
          </div>

          <div
            className="w-full bg-white border border-slate-200 rounded-2xl flex items-center shadow-sm"
            style={{
              gap: 'min(16px, 3cqw)',
              padding: 'min(10px, 1.5cqh) min(16px, 3cqw)',
            }}
          >
            <div
              className="shrink-0 flex items-center justify-center overflow-hidden"
              style={{
                fontSize: 'min(15cqh, 12cqw)',
                width: 'min(20cqh, 15cqw)',
                height: 'min(20cqh, 15cqw)',
              }}
            >
              {displayImage}
            </div>
            <div
              className="font-bold text-slate-700 leading-tight"
              style={{ fontSize: 'min(8cqh, 65cqw)' }}
            >
              {displayMessage}
            </div>
          </div>
        </div>
      }
      footer={
        isAuto ? (
          <div
            className="flex items-center w-full justify-start border-t border-slate-50"
            style={{
              gap: 'min(8px, 2cqmin)',
              padding: 'min(8px, 1.5cqmin) min(12px, 2.5cqmin)',
            }}
          >
            <button
              onClick={handleRefresh}
              disabled={isSyncing}
              className="bg-white hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-all border border-slate-200 disabled:opacity-50 shadow-sm"
              style={{ padding: 'min(6px, 1.5cqmin)' }}
              title="Refresh Weather"
            >
              {isSyncing ? (
                <Loader2
                  style={{
                    width: 'min(14px, 4cqmin)',
                    height: 'min(14px, 4cqmin)',
                  }}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw
                  style={{
                    width: 'min(14px, 4cqmin)',
                    height: 'min(14px, 4cqmin)',
                  }}
                />
              )}
            </button>
            <div
              className="text-slate-600 uppercase flex items-center font-bold"
              style={{
                gap: 'min(6px, 1.5cqmin)',
                fontSize: 'min(10px, 3.5cqmin)',
              }}
            >
              <span>Last Sync</span>
              {lastSync && (
                <span className="text-slate-400 font-mono">
                  {new Date(lastSync).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>
        ) : undefined
      }
    />
  );
};
