import React, { useState, useCallback, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import { WidgetData, WeatherConfig } from '../../types';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Wind,
  MapPin,
  RefreshCw,
  AlertCircle,
  Settings2,
  Lock,
} from 'lucide-react';

// Earth Networks Response Interface
interface EarthNetworksData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  dewPoint: number;
  pressure: number;
  wind: {
    current: {
      speed: number;
      direction: string;
      gust: number;
    };
  };
  precipitation: {
    today: number;
    rate: number;
  };
  timestamp: string;
}

export const WeatherWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const config = widget.config as WeatherConfig;
  const {
    temp = 72,
    condition = 'sunny',
    locationName = 'Orono IS',
    stationId = 'BLLST',
    lastSync = null,
  } = config;

  // Helper to map conditions based on available data
  const getIcon = () => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle'))
      return <CloudRain className="w-12 h-12 text-blue-400" />;
    if (c.includes('snow'))
      return <CloudSnow className="w-12 h-12 text-blue-200" />;
    if (c.includes('cloud'))
      return <Cloud className="w-12 h-12 text-slate-400" />;
    if (c.includes('wind'))
      return <Wind className="w-12 h-12 text-slate-500" />;
    return <Sun className="w-12 h-12 text-amber-400 animate-spin-slow" />;
  };

  const getClothingRecommendation = () => {
    if (temp < 40) return { label: 'Coat & Hat', icon: '🧤' };
    if (temp < 60) return { label: 'Light Jacket', icon: '🧥' };
    if (temp < 75) return { label: 'Long Sleeves', icon: '👕' };
    return { label: 'Short Sleeves', icon: '🩳' };
  };

  const clothing = getClothingRecommendation();

  return (
    <div className="flex flex-col h-full p-4 relative">
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" /> {locationName}
          </div>
          <div className="text-[8px] font-bold text-slate-300">
            Station {stationId}
          </div>
        </div>
        {lastSync && (
          <div className="text-[8px] font-mono text-slate-300">
            {new Date(lastSync).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      {/* Main Display */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-4">
          {getIcon()}
          <div className="text-5xl font-black text-slate-800 tabular-nums tracking-tighter">
            {Math.round(temp)}°
          </div>
        </div>

        {/* Recommendation Chip */}
        <div className="bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-2 border border-indigo-100">
          <span className="text-lg">{clothing.icon}</span>
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
            Wear {clothing.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export const WeatherSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addToast } = useDashboard();
  const { isAdmin } = useAuth();
  const config = widget.config as WeatherConfig;
  const {
    stationId = 'BLLST',
    proxyUrl = 'https://cors-anywhere.herokuapp.com/',
    isAuto = true,
  } = config;

  const [loading, setLoading] = useState(false);

  // For security, only confirmed admin users can modify proxy URL
  const isConfirmedNonAdmin = isAdmin === false;
  const canEditProxyUrl = isAdmin === true;

  // Validate proxy URL to prevent SSRF attacks
  const isValidProxyUrl = useCallback((url: string): boolean => {
    if (!url) return true; // Allow empty (direct connection)
    try {
      const parsed = new URL(url);
      // Only allow https protocol and trusted domains
      const trustedDomains = [
        'cors-anywhere.herokuapp.com',
        'api.allorigins.win',
        'corsproxy.io',
      ];
      return (
        parsed.protocol === 'https:' &&
        trustedDomains.some((domain) => parsed.hostname === domain)
      );
    } catch {
      return false;
    }
  }, []);

  const fetchWeather = useCallback(async () => {
    // Validate proxy URL before making request
    if (proxyUrl && !isValidProxyUrl(proxyUrl)) {
      addToast(
        'Invalid proxy URL. Only trusted HTTPS proxy services are allowed.',
        'error'
      );
      return;
    }

    setLoading(true);
    try {
      // 1. Construct the Target URL (Earth Networks)
      const baseUrl =
        'https://owc.enterprise.earthnetworks.com/Data/GetData.ashx';
      const params = new URLSearchParams({
        dt: 'o', // Observations
        pi: '3', // Parameter ID: 3 = basic weather observations (temp, humidity, wind, precipitation)
        si: stationId,
        units: 'english',
        verbose: 'false',
      });
      const targetUrl = `${baseUrl}?${params.toString()}`;

      // 2. Wrap it with the Proxy URL
      // If proxyUrl is present, append the targetUrl to it
      const finalUrl = proxyUrl ? `${proxyUrl}${targetUrl}` : targetUrl;

      const res = await fetch(finalUrl);

      if (!res.ok) {
        if (res.status === 403 && proxyUrl) {
          throw new Error(
            'The CORS proxy responded with HTTP 403. Please ensure your proxy service is configured and accessible.'
          );
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as EarthNetworksData;

      // Validate API response structure
      if (
        typeof data !== 'object' ||
        data === null ||
        typeof data.temperature !== 'number' ||
        !Number.isFinite(data.temperature)
      ) {
        throw new Error('Invalid API response structure');
      }

      // Determine condition based on precipitation, temperature, wind, and humidity
      // Use type guards to ensure numeric values are finite
      const precipRate =
        typeof data.precipitation?.rate === 'number' &&
        Number.isFinite(data.precipitation?.rate)
          ? data.precipitation.rate
          : 0;
      const tempF = data.temperature;
      const windSpeed =
        typeof data.wind?.current?.speed === 'number' &&
        Number.isFinite(data.wind?.current?.speed)
          ? data.wind.current.speed
          : 0;
      const windGust =
        typeof data.wind?.current?.gust === 'number' &&
        Number.isFinite(data.wind?.current?.gust)
          ? data.wind.current.gust
          : 0;
      const humidity =
        typeof data.humidity === 'number' && Number.isFinite(data.humidity)
          ? data.humidity
          : 0;

      let condition = config.condition ?? 'sunny'; // Keep existing if data unavailable

      // Only update condition if we have valid data
      if (typeof precipRate === 'number' && typeof tempF === 'number') {
        if (precipRate > 0) {
          // Treat precipitation at near-freezing temperatures as snow
          if (tempF <= 34) {
            condition = 'snowy';
          } else {
            condition = 'rainy';
          }
        } else if (windGust >= 25 || windSpeed >= 20) {
          condition = 'windy';
        } else if (humidity >= 80) {
          condition = 'cloudy';
        } else {
          condition = 'sunny';
        }
      }

      updateWidget(widget.id, {
        config: {
          ...config,
          temp: data.temperature,
          condition,
          lastSync: Date.now(),
        },
      });

      addToast('Weather data updated from Station', 'success');
    } catch (err) {
      console.error('Weather Fetch Error:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addToast(`Fetch Failed: ${msg}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [
    config,
    proxyUrl,
    stationId,
    updateWidget,
    widget.id,
    addToast,
    isValidProxyUrl,
  ]);

  // Auto-refresh mechanism: fetch weather every 30 seconds when enabled
  useEffect(() => {
    if (!isAuto) return;

    // Initial fetch
    void fetchWeather();

    // Set up interval for subsequent fetches
    const intervalId = setInterval(() => {
      void fetchWeather();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [isAuto, fetchWeather]);

  return (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-[10px] text-blue-700 leading-relaxed">
          <span className="font-bold block mb-1">
            Earth Networks Connection
          </span>
          This widget connects to a physical weather station.
          <br />
          <a
            href="https://cors-anywhere.herokuapp.com/corsdemo"
            target="_blank"
            rel="noreferrer"
            className="underline font-bold"
          >
            Click here to enable the demo proxy
          </a>{' '}
          if connection fails.
        </div>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
          <MapPin className="w-3 h-3" /> Station ID
        </label>
        <input
          type="text"
          value={stationId}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, stationId: e.target.value },
            })
          }
          className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
          placeholder="e.g. BLLST"
        />
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
          <Settings2 className="w-3 h-3" /> Proxy URL
          {isConfirmedNonAdmin && <Lock className="w-3 h-3" />}
        </label>
        {isConfirmedNonAdmin && (
          <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <Lock className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[9px] text-amber-700 leading-relaxed">
              <span className="font-bold">Admin Only:</span> Proxy URL
              configuration is restricted to administrators for security
              purposes.
            </p>
          </div>
        )}
        <input
          type="text"
          value={proxyUrl}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, proxyUrl: e.target.value },
            })
          }
          disabled={!canEditProxyUrl}
          className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
          placeholder="https://cors-anywhere.herokuapp.com/"
        />
      </div>

      <button
        onClick={fetchWeather}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Connecting...' : 'Test Connection & Sync'}
      </button>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <label className="text-[10px] font-bold text-slate-600 uppercase">
          Auto-Refresh (30s)
        </label>
        <input
          type="checkbox"
          checked={isAuto}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, isAuto: e.target.checked },
            })
          }
          className="accent-indigo-600 w-4 h-4"
        />
      </div>
    </div>
  );
};
