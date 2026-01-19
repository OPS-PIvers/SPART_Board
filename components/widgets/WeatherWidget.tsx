import React, { useState, useCallback, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import {
  WidgetData,
  WeatherConfig,
  WeatherGlobalConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../types';
import { useScaledFont } from '../../hooks/useScaledFont';
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
  Loader2,
} from 'lucide-react';

interface OpenWeatherData {
  cod: number | string;
  message?: string;
  name: string;
  main: {
    temp: number;
  };
  weather: [{ main: string }, ...{ main: string }[]];
}

interface EarthNetworksResponse {
  o?: {
    t: number;
    ic: number;
  };
}

interface GlobalWeatherData {
  temp: number;
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
  SUNNY: [2, 3, 4],
  RAIN: [10, 11, 12, 14, 15, 16, 17, 18, 19],
};

export const WeatherWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, addToast, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const { featurePermissions } = useAuth();
  const config = widget.config as WeatherConfig;
  const {
    temp = 72,
    condition = 'sunny',
    isAuto = false,
    locationName = 'Classroom',
    lastSync = null,
    source = 'openweather',
    city = '',
  } = config;

  const [isSyncing, setIsSyncing] = useState(false);

  const weatherPermission = featurePermissions.find(
    (p) => p.widgetType === 'weather'
  );
  const globalConfig = weatherPermission?.config as
    | WeatherGlobalConfig
    | undefined;

  const systemKey = import.meta.env.VITE_OPENWEATHER_API_KEY as
    | string
    | undefined;

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
            data.condition !== condition ||
            data.updatedAt !== lastSync
          ) {
            updateWidget(widget.id, {
              config: {
                ...config,
                temp: data.temp,
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
      if (source === 'earth_networks') {
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

        if (!data?.o) throw new Error('Station data unavailable');

        updateWidget(widget.id, {
          config: {
            ...config,
            temp: data.o.t,
            condition: EARTH_NETWORKS_ICONS.SNOW.includes(data.o.ic)
              ? 'snowy'
              : EARTH_NETWORKS_ICONS.CLOUDY.includes(data.o.ic)
                ? 'cloudy'
                : EARTH_NETWORKS_ICONS.SUNNY.includes(data.o.ic)
                  ? 'sunny'
                  : EARTH_NETWORKS_ICONS.RAIN.includes(data.o.ic)
                    ? 'rainy'
                    : 'cloudy',
            locationName: STATION_CONFIG.name,
            lastSync: Date.now(),
          },
        });
      } else {
        // OpenWeather sync
        if (!systemKey) throw new Error('API Key missing');
        const params = city.trim()
          ? `q=${encodeURIComponent(city.trim())}`
          : `lat=${STATION_CONFIG.lat}&lon=${STATION_CONFIG.lon}`;

        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?${params}&appid=${systemKey}&units=imperial`
        );
        const data = (await res.json()) as OpenWeatherData;
        if (Number(data.cod) !== 200) throw new Error(String(data.message));

        updateWidget(widget.id, {
          config: {
            ...config,
            temp: data.main.temp,
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

  const getIcon = () => {
    switch (condition.toLowerCase()) {
      case 'cloudy':
      case 'clouds':
        return <Cloud className="w-12 h-12 text-slate-400" />;
      case 'rainy':
      case 'rain':
      case 'drizzle':
        return <CloudRain className="w-12 h-12 text-blue-400" />;
      case 'snowy':
      case 'snow':
        return <CloudSnow className="w-12 h-12 text-blue-200" />;
      case 'windy':
      case 'squall':
      case 'tornado':
        return <Wind className="w-12 h-12 text-slate-500" />;
      case 'sunny':
      case 'clear':
        return <Sun className="w-12 h-12 text-amber-400 animate-spin-slow" />;
      default:
        return <Sun className="w-12 h-12 text-amber-400 animate-spin-slow" />;
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
  let displayImage = <span className="text-2xl">{clothing.icon}</span>;

  if (globalConfig?.temperatureRanges) {
    const match = globalConfig.temperatureRanges.find(
      (r) => temp >= r.min && temp <= r.max
    );
    if (match) {
      displayMessage = match.message;
      if (match.imageUrl) {
        displayImage = (
          <img
            src={match.imageUrl}
            alt="Weather"
            className="w-10 h-10 object-cover rounded-lg"
          />
        );
      }
    }
  }

  const tempFontSize = useScaledFont(widget.w, widget.h, 1.2, 24, 80);

  return (
    <div
      className={`flex flex-col items-center justify-between h-full p-4 gap-2 relative font-${globalStyle.fontFamily} font-${globalStyle.fontWeight ?? 'bold'}`}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="text-[9px]  uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" /> {locationName}
        </div>

        <div className="flex items-center gap-4">
          {getIcon()}
          <div
            className=" text-slate-800 tabular-nums leading-none"
            style={{ fontSize: `${tempFontSize}px` }}
          >
            {Math.round(temp)}°
          </div>
        </div>

        <div className="text-[10px]  uppercase tracking-[0.2em] text-slate-400 mt-2">
          Instruction
        </div>

        <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
          <div className="shrink-0">{displayImage}</div>
          <div className="text-xs  text-slate-700 leading-tight">
            {displayMessage}
          </div>
        </div>
      </div>

      {isAuto && (
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-100 w-full justify-start">
          <button
            onClick={handleRefresh}
            disabled={isSyncing}
            className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all border border-slate-100 disabled:opacity-50"
            title="Refresh Weather"
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>
          <div className="text-[8px]  text-slate-300 uppercase flex items-center gap-1.5">
            <span>Last Sync</span>
            {lastSync && (
              <span className="text-slate-400">
                {new Date(lastSync).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
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
  } = config;

  // We should also access global config to hide controls if forced by admin proxy
  const { featurePermissions } = useAuth();
  const weatherPermission = featurePermissions.find(
    (p) => p.widgetType === 'weather'
  );
  const globalConfig = weatherPermission?.config as
    | WeatherGlobalConfig
    | undefined;

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

      // Use a list of proxies to improve reliability.
      const proxies = [
        (u: string) =>
          `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
        (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
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

      const obs = data.o; // Current observations

      if (!obs) throw new Error('No observation data available');

      const newCondition = mapEarthNetworksIcon(obs.ic);

      updateWidget(widget.id, {
        config: {
          ...config,
          temp: obs.t,
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
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, isAuto: false },
            })
          }
          className={`flex-1 py-1.5 text-[10px]  rounded-lg transition-all ${!isAuto ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          MANUAL
        </button>
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, isAuto: true },
            })
          }
          className={`flex-1 py-1.5 text-[10px]  rounded-lg transition-all ${isAuto ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          AUTOMATIC
        </button>
      </div>

      {!isAuto ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="text-[10px]  text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
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
            <label className="text-[10px]  text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
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
              <p className="text-[10px]  text-blue-800 leading-tight flex items-center gap-2">
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
                  className={`flex-1 py-1.5 text-[9px]  uppercase rounded-lg transition-all ${source === 'openweather' || !source ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  OpenWeather
                </button>
                <button
                  onClick={() =>
                    updateWidget(widget.id, {
                      config: { ...config, source: 'earth_networks' },
                    })
                  }
                  className={`flex-1 py-1.5 text-[9px]  uppercase rounded-lg transition-all ${source === 'earth_networks' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  School Station
                </button>
              </div>

              {source === 'earth_networks' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px]  text-indigo-900 uppercase">
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
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl  text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md shadow-indigo-200"
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
                      <p className="text-[10px]  text-amber-800 leading-tight">
                        Weather service is not configured. Please contact your
                        administrator to set up the API key.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px]  text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
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
                    <div className="relative flex justify-center text-[8px]  text-slate-300 uppercase">
                      <span className="bg-white px-2">OR</span>
                    </div>
                  </div>

                  <button
                    onClick={syncByLocation}
                    disabled={loading || !hasApiKey}
                    className="w-full py-3 border-2 border-indigo-100 text-indigo-600 rounded-xl  text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors disabled:opacity-50"
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
