import React from 'react';
import { WidgetData, WeatherConfig } from '../../../types';
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
  const config = widget.config as WeatherConfig;
  const {
    temp = 72,
    feelsLike,
    condition = 'sunny',
    isAuto = false,
    locationName = 'Classroom',
    lastSync = null,
  } = config;

  const { isSyncing, refresh, globalStyle, globalConfig, showFeelsLike } =
    useWeather(widget.id, config);

  const iconSize = useScaledFont(widget.w, widget.h, 1.2, 32, 120);

  const getIcon = () => {
    switch (condition.toLowerCase()) {
      case 'cloudy':
      case 'clouds':
        return <Cloud size={iconSize} className="text-slate-500" />;
      case 'rainy':
      case 'rain':
      case 'drizzle':
        return <CloudRain size={iconSize} className="text-blue-400" />;
      case 'snowy':
      case 'snow':
        return <CloudSnow size={iconSize} className="text-blue-200" />;
      case 'windy':
      case 'squall':
      case 'tornado':
        return <Wind size={iconSize} className="text-slate-500" />;
      case 'sunny':
      case 'clear':
        return (
          <Sun size={iconSize} className="text-amber-400 animate-spin-slow" />
        );
      default:
        return (
          <Sun size={iconSize} className="text-amber-400 animate-spin-slow" />
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

  const tempFontSize = useScaledFont(widget.w, widget.h, 1.2, 24, 160);
  const labelFontSize = useScaledFont(widget.w, widget.h, 0.2, 8, 18);
  const instructionFontSize = useScaledFont(widget.w, widget.h, 0.25, 12, 28);
  const clothingImgSize = useScaledFont(widget.w, widget.h, 0.5, 20, 60);

  return (
    <div
      className={`flex flex-col items-center justify-between h-full p-2 gap-2 font-${globalStyle.fontFamily}`}
    >
      <div className="flex flex-col items-center justify-center gap-2">
        <div
          className="font-black uppercase tracking-widest text-slate-600 mb-1 flex items-center gap-1"
          style={{ fontSize: `${labelFontSize}px` }}
        >
          <MapPin style={{ width: labelFontSize, height: labelFontSize }} />{' '}
          {locationName}
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
              <div
                className="font-black text-slate-600 mt-1 uppercase tracking-wider"
                style={{ fontSize: `${labelFontSize}px` }}
              >
                Actual {Math.round(temp)}°
              </div>
            ) : (
              feelsLike !== undefined && (
                <div
                  className="font-black text-slate-600 mt-1 uppercase tracking-wider"
                  style={{ fontSize: `${labelFontSize}px` }}
                >
                  Feels like {Math.round(feelsLike)}°
                </div>
              )
            )}
          </div>
        </div>

        <div
          className="font-black uppercase tracking-[0.2em] text-slate-600 mt-2"
          style={{ fontSize: `${labelFontSize}px` }}
        >
          Instruction
        </div>

        <div className="w-full bg-white border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
          <div
            className="shrink-0"
            style={{ fontSize: `${clothingImgSize}px` }}
          >
            {displayImage}
          </div>
          <div
            className="font-bold text-slate-700 leading-tight"
            style={{ fontSize: `${instructionFontSize}px` }}
          >
            {displayMessage}
          </div>
        </div>
      </div>

      {isAuto && (
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-200 w-full justify-start">
          <button
            onClick={refresh}
            disabled={isSyncing}
            className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-all border border-slate-200 disabled:opacity-50 shadow-sm"
            title="Refresh Weather"
          >
            {isSyncing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </button>
          <div className="text-xxxs text-slate-600 uppercase flex items-center gap-1.5">
            <span>Last Sync</span>
            {lastSync && (
              <span className="text-slate-700">
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
