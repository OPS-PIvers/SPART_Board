import React, { useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, RecessGearConfig, WeatherConfig } from '../../types';
import {
  Shirt,
  Thermometer,
  Info,
  Link as LinkIcon,
  AlertCircle,
} from 'lucide-react';
import { Toggle } from '../common/Toggle';

interface GearItem {
  label: string;
  icon: string;
  category: 'clothing' | 'footwear' | 'accessory';
}

import { WidgetLayout } from './WidgetLayout';

export const RecessGearWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { activeDashboard } = useDashboard();
  const config = widget.config as RecessGearConfig;

  const widgets = activeDashboard?.widgets;

  // Find linked or first available weather widget
  const weatherWidget = useMemo(() => {
    if (!widgets) return null;
    if (config.linkedWeatherWidgetId) {
      const linked = widgets.find((w) => w.id === config.linkedWeatherWidgetId);
      if (linked && linked.type === 'weather') return linked;
    }
    return widgets.find((w) => w.type === 'weather') ?? null;
  }, [widgets, config.linkedWeatherWidgetId]);

  const weatherConfig = weatherWidget?.config as WeatherConfig | undefined;

  const getRecessGear = () => {
    if (!weatherConfig || weatherConfig.temp === undefined) return [];

    const temp =
      config.useFeelsLike && weatherConfig.feelsLike !== undefined
        ? weatherConfig.feelsLike
        : weatherConfig.temp;
    const condition = weatherConfig.condition?.toLowerCase() ?? 'sunny';

    const gear: GearItem[] = [];

    // Temperature-based clothing
    if (temp < 32) {
      gear.push({ label: 'Heavy Coat', icon: '🧥', category: 'clothing' });
      gear.push({ label: 'Hat & Gloves', icon: '🧤', category: 'accessory' });
    } else if (temp < 45) {
      gear.push({ label: 'Winter Coat', icon: '🧥', category: 'clothing' });
    } else if (temp < 60) {
      gear.push({ label: 'Light Jacket', icon: '🧥', category: 'clothing' });
    } else if (temp < 75) {
      gear.push({ label: 'Long Sleeves', icon: '👕', category: 'clothing' });
    } else {
      gear.push({ label: 'Short Sleeves', icon: '👕', category: 'clothing' });
    }

    // Condition-based gear
    if (
      condition.includes('rain') ||
      condition.includes('drizzle') ||
      condition.includes('storm')
    ) {
      gear.push({ label: 'Rain Boots', icon: '👢', category: 'footwear' });
      gear.push({ label: 'Umbrella', icon: '☂️', category: 'accessory' });
    } else if (condition.includes('snow')) {
      gear.push({ label: 'Snow Boots', icon: '🥾', category: 'footwear' });
      gear.push({ label: 'Snow Pants', icon: '👖', category: 'clothing' });
    } else if (temp < 50) {
      gear.push({ label: 'Closed Shoes', icon: '👟', category: 'footwear' });
    }

    return gear;
  };

  const gearList = getRecessGear();

  if (!weatherWidget || !weatherConfig || weatherConfig.temp === undefined) {
    return (
      <WidgetLayout
        padding="p-0"
        content={
          <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
            <div className="bg-slate-100 p-4 rounded-full">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-600 uppercase tracking-tight">
                No Weather Data
              </p>
              <p className="text-xxs text-slate-400 leading-tight">
                Add a Weather widget to automatically see required recess gear.
              </p>
            </div>
          </div>
        }
      />
    );
  }

  return (
    <WidgetLayout
      padding="p-0"
      header={
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-white/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100 shadow-sm">
              <Shirt className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Recess Gear
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">
            <Thermometer className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 tracking-tight">
              {Math.round(
                (config.useFeelsLike && weatherConfig.feelsLike !== undefined
                  ? weatherConfig.feelsLike
                  : weatherConfig.temp) ?? 72
              )}
              °
            </span>
          </div>
        </div>
      }
      content={
        <div className="flex-1 w-full h-full overflow-y-auto p-4 custom-scrollbar bg-slate-50/30">
          <div className="grid grid-cols-1 @[240px]:grid-cols-2 gap-3">
            {gearList.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="flex items-center gap-3 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group"
              >
                <span className="text-3xl group-hover:scale-125 transition-transform duration-300 transform-gpu drop-shadow-sm">
                  {item.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-slate-700 uppercase leading-tight tracking-tight">
                    {item.label}
                  </span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      footer={
        <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-1.5 truncate max-w-[70%]">
            <LinkIcon className="w-2.5 h-2.5 opacity-60" />
            <span className="truncate">
              {weatherConfig.locationName ?? 'Weather'} Source
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
            <span>Auto</span>
          </div>
        </div>
      }
    />
  );
};

export const RecessGearSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { activeDashboard, updateWidget } = useDashboard();
  const config = widget.config as RecessGearConfig;

  const weatherWidgets = useMemo(() => {
    return activeDashboard?.widgets.filter((w) => w.type === 'weather') ?? [];
  }, [activeDashboard?.widgets]);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-emerald-900">
          <Info className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">
            Smart Linking
          </span>
        </div>
        <p className="text-xxs text-emerald-800 leading-relaxed">
          Recess Gear automatically updates based on the current temperature and
          conditions from your Weather widget.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex flex-col gap-0.5">
            <span className="text-xxs font-bold text-slate-700 uppercase tracking-tight">
              Use &quot;Feels Like&quot; Temp
            </span>
            <span className="text-xxs text-slate-400 leading-tight">
              Use wind chill and heat index for gear calculation.
            </span>
          </div>
          <Toggle
            size="sm"
            checked={config.useFeelsLike ?? true}
            onChange={(checked) =>
              updateWidget(widget.id, {
                config: { ...config, useFeelsLike: checked },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-xxs font-black text-slate-400 uppercase tracking-widest block px-1">
            Source Weather Widget
          </label>
          <select
            value={config.linkedWeatherWidgetId ?? ''}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  linkedWeatherWidgetId: e.target.value || null,
                },
              })
            }
            className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700"
          >
            <option value="">Auto-select (First available)</option>
            {weatherWidgets.map((w) => (
              <option key={w.id} value={w.id}>
                Weather at{' '}
                {(w.config as WeatherConfig).locationName ?? 'Classroom'}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
