import React, { useState, useCallback } from 'react';
import { useDashboard } from '../../context/useDashboard';
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
            <MapPin className="w-2.5 h-2.5" /> {stationId}
          </div>
          <div className="text-[8px] font-bold text-slate-300">
            {locationName}
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
  const config = widget.config as WeatherConfig;
  const {
    stationId = 'BLLST',
    proxyUrl = 'https://cors-anywhere.herokuapp.com/',
    isAuto = true,
  } = config;

  const [loading, setLoading] = useState(false);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Construct the Target URL (Earth Networks)
      const baseUrl =
        'https://owc.enterprise.earthnetworks.com/Data/GetData.ashx';
      const params = new URLSearchParams({
        dt: 'o', // Observations
        pi: '3',
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
        if (res.status === 403 && proxyUrl.includes('cors-anywhere')) {
          throw new Error(
            'CORS Demo requires activation. Visit https://cors-anywhere.herokuapp.com/corsdemo'
          );
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = (await res.json()) as EarthNetworksData;

      // Determine condition loosely based on precipitation/cloud data
      let condition = 'sunny';
      if (data.precipitation?.rate > 0) condition = 'rainy';

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
  }, [config, proxyUrl, stationId, updateWidget, widget.id, addToast]);

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
        </label>
        <input
          type="text"
          value={proxyUrl}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, proxyUrl: e.target.value },
            })
          }
          className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
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
