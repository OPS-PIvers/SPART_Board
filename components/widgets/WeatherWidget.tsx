import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../config/firebase';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import {
  WidgetData,
  WeatherConfig,
  WeatherGlobalConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../types';
import { Toggle } from '../common/Toggle';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Palette,
  MapPin,
  RefreshCw,
  AlertCircle,
  Shirt,
} from 'lucide-react';

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

interface GlobalWeatherData {
  temp: number;
  feelsLike?: number;
  condition: string;
  locationName: string;
  updatedAt: number;
  source?: string;
}

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
  SUNNY: [0, 2, 3, 4, 7],
  RAIN: [10, 11, 12, 14, 15, 16, 17, 18, 19],
};

import { WidgetLayout } from './WidgetLayout';

export const WeatherWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const { featurePermissions } = useAuth();
  const config = widget.config as WeatherConfig;
  const {
    temp = 72,
    feelsLike,
    condition = 'sunny',
    isAuto = false,
    locationName: _locationName = 'Classroom',
    lastSync = null,
    showFeelsLike: localShowFeelsLike,
    hideClothing,
  } = config;

  const weatherPermission = featurePermissions.find(
    (p) => p.widgetType === 'weather'
  );
  const globalConfig = weatherPermission?.config as
    | WeatherGlobalConfig
    | undefined;

  // Use local config if set, otherwise fallback to global config
  const showFeelsLike =
    localShowFeelsLike ?? globalConfig?.showFeelsLike ?? false;

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
          style={{
            gap: hideClothing ? '2cqh' : 'min(12px, 2.5cqmin)',
            padding: hideClothing ? '4cqh' : 'min(8px, 2cqmin)',
          }}
        >
          <div
            className="flex flex-col items-center justify-center w-full"
            style={{ gap: hideClothing ? '1cqh' : 'min(4px, 1cqmin)' }}
          >
            <div
              className="flex items-center justify-center w-full"
              style={{
                gap: hideClothing ? '4cqw' : 'min(24px, 6cqmin)',
              }}
            >
              <div
                style={{
                  fontSize: hideClothing
                    ? 'min(60cqh, 30cqw)'
                    : 'min(80px, 25cqmin)',
                }}
              >
                {getIcon('1em')}
              </div>
              <div
                className="font-black text-slate-800 tabular-nums leading-none"
                style={{
                  fontSize: hideClothing
                    ? 'min(75cqh, 40cqw)'
                    : 'clamp(32px, 35cqmin, 400px)',
                }}
              >
                {showFeelsLike && feelsLike !== undefined
                  ? Math.round(feelsLike)
                  : Math.round(temp)}
                °
              </div>
            </div>

            {(showFeelsLike || feelsLike !== undefined) && (
              <div
                className="font-black text-slate-600 uppercase tracking-wider whitespace-nowrap leading-none text-center"
                style={{
                  fontSize: hideClothing
                    ? 'min(10cqh, 40cqw)'
                    : 'min(14px, 5cqmin)',
                  marginTop: hideClothing ? '1cqh' : 'min(2px, 0.5cqmin)',
                }}
              >
                {showFeelsLike
                  ? `Actual ${Math.round(temp)}°`
                  : `Feels like ${Math.round(feelsLike ?? temp)}°`}
              </div>
            )}
          </div>

          {!hideClothing && (
            <div
              className="w-full bg-white border border-slate-200 rounded-2xl flex items-center shadow-sm"
              style={{
                gap: 'min(16px, 4cqmin)',
                padding: 'min(12px, 2.5cqmin) min(16px, 4cqmin)',
              }}
            >
              <div
                className="shrink-0 flex items-center justify-center overflow-hidden"
                style={{
                  fontSize: 'min(48px, 12cqmin)',
                  width: 'min(64px, 15cqmin)',
                  height: 'min(64px, 15cqmin)',
                }}
              >
                {displayImage}
              </div>
              <div
                className="font-bold text-slate-700 leading-tight"
                style={{ fontSize: 'min(20px, 6cqmin)' }}
              >
                {displayMessage}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};

export const WeatherSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addToast } = useDashboard();
  const config = widget.config as WeatherConfig;
  const {
    temp = 72,
    condition = 'sunny',
    isAuto = false,
    city = '',
    locationName: _locationName = 'Classroom',
    source = 'openweather',
    showFeelsLike: localShowFeelsLike,
    hideClothing,
  } = config;

  // We should also access global config to hide controls if forced by admin proxy
  const { featurePermissions } = useAuth();
  const weatherPermission = featurePermissions.find(
    (p) => p.widgetType === 'weather'
  );
  const globalConfig = weatherPermission?.config as
    | WeatherGlobalConfig
    | undefined;

  const showFeelsLike =
    localShowFeelsLike ?? globalConfig?.showFeelsLike ?? false;

  const isAdminProxy = globalConfig?.fetchingStrategy === 'admin_proxy';

  const [loading, setLoading] = useState(false);

  const systemKey = import.meta.env.VITE_OPENWEATHER_API_KEY as
    | string
    | undefined;

  const hasApiKey = !!systemKey && systemKey.trim() !== '';

  const mapEarthNetworksIcon = (ic: number): string => {
    if (EARTH_NETWORKS_ICONS.SNOW.includes(ic)) return 'snowy';
    if (EARTH_NETWORKS_ICONS.CLOUDY.includes(ic)) return 'cloudy';
    if (EARTH_NETWORKS_ICONS.SUNNY.includes(ic)) return 'sunny';
    if (EARTH_NETWORKS_ICONS.RAIN.includes(ic)) return 'rainy';
    return 'cloudy'; // Default fallback
  };

  const fetchEarthNetworksWeather = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        ...EARTH_NETWORKS_API.PARAMS,
        si: STATION_CONFIG.id,
        locstr: `${STATION_CONFIG.lat},${STATION_CONFIG.lon}`,
      }).toString();

      const url = `${EARTH_NETWORKS_API.BASE_URL}?${queryParams}`;

      // Use our own Cloud Function proxy to avoid CORS issues entirely
      const fetchProxy = httpsCallable<{ url: string }, EarthNetworksResponse>(
        functions,
        'fetchWeatherProxy'
      );

      let data: EarthNetworksResponse | null = null;

      try {
        const result = await fetchProxy({ url });
        data = result.data;
        console.warn(
          '[WeatherWidget] Fetched Earth Networks Data via Cloud Proxy'
        );
      } catch (_proxyErr) {
        console.warn(
          '[WeatherWidget] Cloud Proxy failed, trying public proxies'
        );

        // Fallback to public proxies
        const proxies = [
          (u: string) =>
            `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
          (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
          (u: string) =>
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
        ];

        let lastError: Error | null =
          _proxyErr instanceof Error ? _proxyErr : new Error(String(_proxyErr));

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
                '[WeatherWidget] Fetched Earth Networks Data via Public Proxy'
              );
            } catch (_) {
              throw new Error('Failed to parse response as JSON');
            }

            if (data && data.o) break;
          } catch (e) {
            lastError = e instanceof Error ? e : new Error(String(e));
            console.warn(
              `[WeatherWidget] Public proxy attempt failed: ${lastError.message}`
            );
          }
        }

        if (!data) {
          throw lastError ?? new Error('All proxy attempts failed');
        }
      }

      const obs = data.o; // Current observations

      if (!obs) throw new Error('No observation data available');

      const newCondition = mapEarthNetworksIcon(obs.ic);

      updateWidget(widget.id, {
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
  };

  const fetchWeather = async (params: string) => {
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

      updateWidget(widget.id, {
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
  };

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

  const conditions = [
    { id: 'sunny', icon: Sun },
    { id: 'cloudy', icon: Cloud },
    { id: 'rainy', icon: CloudRain },
    { id: 'snowy', icon: CloudSnow },
    { id: 'windy', icon: Wind },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex flex-col gap-0.5">
          <span className="text-xxs font-bold text-slate-700 uppercase tracking-tight">
            Prioritize Feels Like
          </span>
          <span className="text-xxs text-slate-400 leading-tight">
            Swap prominence between actual and feels-like temperature.
          </span>
        </div>
        <Toggle
          size="sm"
          checked={showFeelsLike}
          onChange={(checked) =>
            updateWidget(widget.id, {
              config: { ...config, showFeelsLike: checked },
            })
          }
        />
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex flex-col gap-0.5">
          <span className="text-xxs font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
            <Shirt className="w-3 h-3" /> Hide Clothing Suggestions
          </span>
          <span className="text-xxs text-slate-400 leading-tight">
            Remove the clothing and message container from the widget.
          </span>
        </div>
        <Toggle
          size="sm"
          checked={hideClothing ?? false}
          onChange={(checked) =>
            updateWidget(widget.id, {
              config: { ...config, hideClothing: checked },
            })
          }
        />
      </div>

      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, isAuto: false },
            })
          }
          className={`flex-1 py-1.5 text-xxs  rounded-lg transition-all ${!isAuto ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          MANUAL
        </button>
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, isAuto: true },
            })
          }
          className={`flex-1 py-1.5 text-xxs  rounded-lg transition-all ${isAuto ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          AUTOMATIC
        </button>
      </div>

      {!isAuto ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
              <Thermometer className="w-3 h-3" /> Temperature (°F)
            </label>
            <div className="flex items-center gap-4 px-2">
              <input
                type="range"
                min="0"
                max="110"
                step="1"
                value={temp}
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: {
                      ...config,
                      temp: parseInt(e.target.value),
                      locationName: 'Manual Mode',
                    },
                  })
                }
                className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="w-10 text-center font-mono  text-slate-700 text-sm">
                {Math.round(temp)}°
              </span>
            </div>
          </div>

          <div>
            <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
              <Palette className="w-3 h-3" /> Condition
            </label>
            <div className="grid grid-cols-5 gap-2">
              {conditions.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    updateWidget(widget.id, {
                      config: { ...config, condition: c.id },
                    })
                  }
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${condition === c.id ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-white text-slate-400'}`}
                >
                  <c.icon className="w-4 h-4" />
                  <span className="text-[7px]  uppercase">{c.id}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {isAdminProxy ? (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xxs  text-blue-800 leading-tight flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Weather is managed by your administrator.
              </p>
            </div>
          ) : (
            <>
              {/* Source Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                <button
                  onClick={() =>
                    updateWidget(widget.id, {
                      config: { ...config, source: 'openweather' },
                    })
                  }
                  className={`flex-1 py-1.5 text-xxs  uppercase rounded-lg transition-all ${source === 'openweather' || !source ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  OpenWeather
                </button>
                <button
                  onClick={() =>
                    updateWidget(widget.id, {
                      config: { ...config, source: 'earth_networks' },
                    })
                  }
                  className={`flex-1 py-1.5 text-xxs  uppercase rounded-lg transition-all ${source === 'earth_networks' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  School Station
                </button>
              </div>

              {source === 'earth_networks' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xxs  text-indigo-900 uppercase">
                        Station Feed Ready
                      </span>
                    </div>
                    <p className="text-xs text-indigo-800  leading-tight">
                      Connected to{' '}
                      <span className="">
                        {STATION_CONFIG.name} ({STATION_CONFIG.id})
                      </span>{' '}
                      weather station.
                    </p>
                  </div>
                  <button
                    onClick={fetchEarthNetworksWeather}
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl  text-xxs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-200"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                    />
                    Refresh Station Data
                  </button>
                </div>
              ) : (
                <>
                  {!hasApiKey && (
                    <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl items-start">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xxs  text-amber-800 leading-tight">
                        Weather service is not configured. Please contact your
                        administrator to set up the API key.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> City / Zip
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. London, US"
                        value={city}
                        onChange={(e) =>
                          updateWidget(widget.id, {
                            config: { ...config, city: e.target.value },
                          })
                        }
                        disabled={!hasApiKey}
                        className="flex-1 p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 disabled:opacity-50 disabled:bg-slate-50"
                      />
                      <button
                        onClick={syncByCity}
                        disabled={loading || !hasApiKey}
                        className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100" />
                    </div>
                    <div className="relative flex justify-center text-xxxs  text-slate-300 uppercase">
                      <span className="bg-white px-2">OR</span>
                    </div>
                  </div>

                  <button
                    onClick={syncByLocation}
                    disabled={loading || !hasApiKey}
                    className="w-full py-3 border-2 border-indigo-100 text-indigo-600 rounded-xl  text-xxs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    <MapPin className="w-4 h-4" /> Use Current Location
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
