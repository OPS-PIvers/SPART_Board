/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData } from '../../types';
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
  Key,
  AlertCircle,
} from 'lucide-react';

export const WeatherWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const {
    temp = 72,
    condition = 'sunny',
    isAuto = false,
    locationName = 'Classroom',
    lastSync = null,
  } = widget.config;

  const getIcon = () => {
    switch ((condition as string).toLowerCase()) {
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

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 gap-2">
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
        <MapPin className="w-2.5 h-2.5" /> {locationName}
      </div>

      <div className="flex items-center gap-4">
        {getIcon()}
        <div className="text-4xl font-black text-slate-800 tabular-nums">
          {Math.round(temp)}°
        </div>
      </div>

      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
        Instruction
      </div>

      <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
        <span className="text-2xl">{clothing.icon}</span>
        <div className="text-xs font-bold text-slate-700 leading-tight">
          Today is{' '}
          <span className="text-indigo-600 uppercase">{condition}</span>.<br />
          Wear a <span className="text-indigo-600">{clothing.label}</span>!
        </div>
      </div>

      {isAuto && lastSync && (
        <div className="text-[8px] font-bold text-slate-300 uppercase mt-2">
          Last Sync:{' '}
          {new Date(lastSync).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
};

export const WeatherSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addToast } = useDashboard();
  const {
    temp = 72,
    condition = 'sunny',
    isAuto = false,
    city = '',
    apiKey = '',
    locationName: _locationName = 'Classroom',
  } = widget.config;

  const [loading, setLoading] = useState(false);

  const fetchWeather = async (params: string) => {
    const cleanKey = (apiKey as string).trim();
    if (!cleanKey) {
      addToast('OpenWeather API Key required', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?${params}&appid=${cleanKey}&units=imperial`
      );

      if (res.status === 401) {
        throw new Error(
          'Invalid API Key. If newly created, wait up to 2 hours for activation.'
        );
      }

      const data = await res.json();

      if (data.cod !== 200)
        throw new Error((data.message as string) || 'Failed to fetch');

      updateWidget(widget.id, {
        config: {
          ...widget.config,

          temp: data.main.temp,

          condition: data.weather[0].main.toLowerCase(),

          locationName: data.name,
          lastSync: Date.now(),
        },
      });

      addToast(`Weather updated for ${data.name as string}`, 'success');
    } catch (err: any) {
      addToast((err.message as string) || 'Weather sync failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncByCity = () => {
    if (!(city as string).trim())
      return addToast('Please enter a city name', 'info');

    void fetchWeather(`q=${encodeURIComponent((city as string).trim())}`);
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
              config: { ...widget.config, isAuto: false },
            })
          }
          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${!isAuto ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          MANUAL
        </button>
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...widget.config, isAuto: true },
            })
          }
          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${isAuto ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          AUTOMATIC
        </button>
      </div>

      {!isAuto ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
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
                      ...widget.config,
                      temp: parseInt(e.target.value),
                      locationName: 'Manual Mode',
                    },
                  })
                }
                className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="w-10 text-center font-mono font-bold text-slate-700 text-sm">
                {Math.round(temp)}°
              </span>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
              <Palette className="w-3 h-3" /> Condition
            </label>
            <div className="grid grid-cols-5 gap-2">
              {conditions.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    updateWidget(widget.id, {
                      config: { ...widget.config, condition: c.id },
                    })
                  }
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${condition === c.id ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-white text-slate-400'}`}
                >
                  <c.icon className="w-4 h-4" />
                  <span className="text-[7px] font-black uppercase">
                    {c.id}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
              <Key className="w-3 h-3" /> OpenWeather API Key
            </label>
            <input
              type="password"
              placeholder="Paste your API key here..."
              value={apiKey}
              onChange={(e) =>
                updateWidget(widget.id, {
                  config: { ...widget.config, apiKey: e.target.value },
                })
              }
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
            />
            <div className="flex gap-1.5 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[8px] text-slate-500 font-bold leading-normal">
                New keys can take{' '}
                <span className="text-amber-600">up to 2 hours</span> to
                activate. If you just created yours, please wait a while before
                syncing.
              </p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
              <MapPin className="w-3 h-3" /> City / Zip
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. London, US"
                value={city}
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: { ...widget.config, city: e.target.value },
                  })
                }
                className="flex-1 p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
              />
              <button
                onClick={syncByCity}
                disabled={loading}
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
            <div className="relative flex justify-center text-[8px] font-black text-slate-300 uppercase">
              <span className="bg-white px-2">OR</span>
            </div>
          </div>

          <button
            onClick={syncByLocation}
            disabled={loading}
            className="w-full py-3 border-2 border-indigo-100 text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            <MapPin className="w-4 h-4" /> Use Current Location
          </button>
        </div>
      )}
    </div>
  );
};
