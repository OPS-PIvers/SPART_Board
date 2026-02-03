import React from 'react';
import { useDashboard } from '../../../context/useDashboard';
import {
  WidgetData,
  WeatherConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../../types';
import { useScaledFont } from '../../../hooks/useScaledFont';
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
import { useWeather } from './useWeather';

export const WeatherWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as WeatherConfig;
  const {
    temp = 72,
    feelsLike,
    condition = 'sunny',
    isAuto = false,
    locationName = 'Classroom',
    lastSync = null,
    showFeelsLike: localShowFeelsLike,
  } = config;

  const { isLoading, refreshWeather, globalConfig } = useWeather(widget.id, config);

  // Use local config if set, otherwise fallback to global config
  const showFeelsLike =
    localShowFeelsLike ?? globalConfig?.showFeelsLike ?? false;

  const getIcon = () => {
    const iconClasses = 'w-20 h-20';
    switch (condition.toLowerCase()) {
      case 'cloudy':
      case 'clouds':
        return <Cloud className={`${iconClasses} text-slate-400`} />;
      case 'rainy':
      case 'rain':
      case 'drizzle':
        return <CloudRain className={`${iconClasses} text-blue-400`} />;
      case 'snowy':
      case 'snow':
        return <CloudSnow className={`${iconClasses} text-blue-200`} />;
      case 'windy':
      case 'squall':
      case 'tornado':
        return <Wind className={`${iconClasses} text-slate-500`} />;
      case 'sunny':
      case 'clear':
        return (
          <Sun className={`${iconClasses} text-amber-400 animate-spin-slow`} />
        );
      default:
        return (
          <Sun className={`${iconClasses} text-amber-400 animate-spin-slow`} />
        );
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
            className="w-10 h-10 object-cover rounded-lg"
          />
        );
      }
    }
  }

  const tempFontSize = useScaledFont(widget.w, widget.h, 1.2, 24, 80);

  return (
    <div
      className={`flex flex-col items-center justify-between h-full p-4 gap-2 font-${globalStyle.fontFamily}`}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="text-xxs font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" /> {locationName}
        </div>

        <div className="flex items-center gap-4">
          {getIcon()}
          <div className="flex flex-col">
            <div
              className="font-black text-slate-800 tabular-nums leading-none"
              style={{ fontSize: `${tempFontSize}px` }}
            >
              {showFeelsLike && feelsLike !== undefined
                ? Math.round(feelsLike)
                : Math.round(temp)}
              °
            </div>
            {showFeelsLike ? (
              // If showing Feels Like as main, show regular temp as sub-text
              <div className="text-xxs font-black text-slate-400 mt-1 uppercase tracking-wider">
                Actual {Math.round(temp)}°
              </div>
            ) : (
              // Standard view: Regular temp as main, Feels Like as sub-text
              feelsLike !== undefined && (
                <div className="text-xxs font-black text-slate-400 mt-1 uppercase tracking-wider">
                  Feels like {Math.round(feelsLike)}°
                </div>
              )
            )}
          </div>
        </div>

        <div className="text-xxs font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
          Instruction
        </div>

        <div className="w-full bg-white/20 border border-white/30 backdrop-blur-sm rounded-2xl p-3 flex items-center gap-3">
          <div className="shrink-0">{displayImage}</div>
          <div className="text-xs font-bold text-slate-700 leading-tight">
            {displayMessage}
          </div>
        </div>
      </div>

      {isAuto && (
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/20 w-full justify-start">
          <button
            onClick={refreshWeather}
            disabled={isLoading}
            className="p-2 bg-white/20 hover:bg-white/40 text-slate-500 hover:text-indigo-600 rounded-lg transition-all border border-white/30 backdrop-blur-sm disabled:opacity-50 shadow-sm"
            title="Refresh Weather"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>
          <div className="text-xxxs  text-slate-300 uppercase flex items-center gap-1.5">
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
