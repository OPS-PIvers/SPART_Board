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
import { ScaledEmptyState } from '../common/ScaledEmptyState';
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
          <ScaledEmptyState
            icon={AlertCircle}
            title="No Weather Data"
            subtitle="Add a Weather widget to automatically see required recess gear."
          />
        }
      />
    );
  }

  return (
    <WidgetLayout
      padding="p-0"
      header={
        <div
          className="flex items-center justify-between border-b border-slate-100 bg-white/50 backdrop-blur-sm shrink-0"
          style={{ padding: 'min(12px, 2.5cqw, 4cqh) min(16px, 3cqw, 5cqh)' }}
        >
          <div
            className="flex items-center"
            style={{ gap: 'min(8px, 1.5cqw, 2.5cqh)' }}
          >
            <div
              className="bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm flex items-center justify-center"
              style={{ padding: 'min(6px, 1.2cqw, 2cqh)' }}
            >
              <Shirt
                className="text-emerald-600"
                style={{
                  width: 'min(16px, 3.5cqw, 5cqh)',
                  height: 'min(16px, 3.5cqw, 5cqh)',
                }}
              />
            </div>
            <span
              className="font-black uppercase tracking-widest text-slate-400"
              style={{ fontSize: 'clamp(10px, 2.8cqw, 12px)' }}
            >
              Recess Gear
            </span>
          </div>
          <div
            className="flex items-center bg-emerald-50 rounded-full border border-emerald-100 shadow-sm"
            style={{
              gap: 'min(6px, 1.2cqw, 2cqh)',
              padding: 'min(4px, 0.8cqw, 1.5cqh) min(10px, 2cqw, 3.5cqh)',
            }}
          >
            <Thermometer
              className="text-emerald-600"
              style={{
                width: 'min(12px, 2.8cqw, 4cqh)',
                height: 'min(12px, 2.8cqw, 4cqh)',
              }}
            />
            <span
              className="font-black text-emerald-700 tracking-tight"
              style={{ fontSize: 'clamp(10px, 2.8cqw, 12px)' }}
            >
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
        <div
          className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50/30"
          style={{ padding: 'min(16px, 3cqw, 5cqh)' }}
        >
          <div
            className="grid grid-cols-1 @[240px]:grid-cols-2"
            style={{ gap: 'min(12px, 2.5cqw, 4cqh)' }}
          >
            {gearList.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="flex items-center bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group"
                style={{
                  gap: 'min(12px, 2.5cqw, 4cqh)',
                  padding: 'min(16px, 3cqw, 5cqh)',
                }}
              >
                <span
                  className="group-hover:scale-125 transition-transform duration-300 transform-gpu drop-shadow-sm shrink-0"
                  style={{ fontSize: 'clamp(20px, 7cqmin, 30px)' }}
                >
                  {item.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span
                    className="font-black text-slate-700 uppercase leading-tight tracking-tight"
                    style={{ fontSize: 'clamp(12px, 3.5cqw, 14px)' }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="font-bold text-slate-300 uppercase tracking-widest"
                    style={{
                      fontSize: 'clamp(9px, 2.8cqw, 11px)',
                      marginTop: 'min(4px, 0.8cqw)',
                    }}
                  >
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
      footer={
        <div
          className="bg-slate-50/50 border-t border-slate-100 flex items-center justify-between font-black text-slate-400 uppercase tracking-widest shrink-0"
          style={{
            padding: 'min(10px, 2cqw, 3.5cqh) min(16px, 3cqw, 5cqh)',
            fontSize: 'clamp(9px, 2.5cqw, 11px)',
          }}
        >
          <div
            className="flex items-center truncate max-w-[70%]"
            style={{ gap: 'min(6px, 1.2cqw, 2cqh)' }}
          >
            <LinkIcon
              className="opacity-60"
              style={{
                width: 'min(10px, 2.5cqw, 3.5cqh)',
                height: 'min(10px, 2.5cqw, 3.5cqh)',
              }}
            />
            <span className="truncate">
              {weatherConfig.locationName ?? 'Weather'} Source
            </span>
          </div>
          <div
            className="flex items-center shrink-0"
            style={{ gap: 'min(4px, 0.8cqw, 1.5cqh)' }}
          >
            <div
              className="bg-emerald-400 rounded-full animate-pulse"
              style={{
                width: 'min(5px, 1cqw, 1.5cqh)',
                height: 'min(5px, 1cqw, 1.5cqh)',
              }}
            />
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
