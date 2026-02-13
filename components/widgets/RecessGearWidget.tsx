import React, { useMemo, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useDashboard } from '../../context/useDashboard';
import { useAuth } from '../../context/useAuth';
import {
  WidgetData,
  RecessGearConfig,
  WeatherConfig,
  GlobalWeatherData,
  WeatherGlobalConfig,
} from '../../types';
import {
  Shirt,
  Thermometer,
  Info,
  Link as LinkIcon,
  AlertCircle,
} from 'lucide-react';
import { ScaledEmptyState } from '../common/ScaledEmptyState';
import { Toggle } from '../common/Toggle';
import { WidgetLayout } from './WidgetLayout';

interface GearItem {
  label: string;
  icon: string;
  category: 'clothing' | 'footwear' | 'accessory';
}

export const RecessGearWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { activeDashboard } = useDashboard();
  const { featurePermissions } = useAuth();
  const [globalWeather, setGlobalWeather] = useState<GlobalWeatherData | null>(
    null
  );
  const config = widget.config as RecessGearConfig;

  const weatherPermission = useMemo(
    () => featurePermissions.find((p) => p.widgetType === 'weather'),
    [featurePermissions]
  );

  const globalWeatherConfig = weatherPermission?.config as
    | WeatherGlobalConfig
    | undefined;

  // Global Weather Subscription (Admin Proxy)
  useEffect(() => {
    if (globalWeatherConfig?.fetchingStrategy !== 'admin_proxy') return;

    const unsubscribe = onSnapshot(
      doc(db, 'global_weather', 'current'),
      (snapshot) => {
        if (snapshot.exists()) {
          setGlobalWeather(snapshot.data() as GlobalWeatherData);
        }
      },
      (error) => {
        console.error(
          'RecessGear: Failed to subscribe to global weather:',
          error
        );
      }
    );

    return () => unsubscribe();
  }, [globalWeatherConfig?.fetchingStrategy]);

  const weatherWidget = useMemo(() => {
    if (config.linkedWeatherWidgetId) {
      return activeDashboard?.widgets.find(
        (w) => w.id === config.linkedWeatherWidgetId
      );
    }
    return activeDashboard?.widgets.find((w) => w.type === 'weather');
  }, [activeDashboard?.widgets, config.linkedWeatherWidgetId]);

  // Combined Weather Data
  const weatherData = useMemo(() => {
    if (weatherWidget) {
      const wConfig = weatherWidget.config as WeatherConfig;
      return {
        temp: wConfig.temp,
        feelsLike: wConfig.feelsLike,
        condition: wConfig.condition,
        locationName: wConfig.locationName,
      };
    }

    if (globalWeather) {
      return {
        temp: globalWeather.temp,
        feelsLike: globalWeather.feelsLike,
        condition: globalWeather.condition,
        locationName: globalWeather.locationName,
      };
    }

    return null;
  }, [weatherWidget, globalWeather]);

  const getRecessGear = () => {
    if (!weatherData || weatherData.temp === undefined) return [];

    const temp =
      config.useFeelsLike && weatherData.feelsLike !== undefined
        ? weatherData.feelsLike
        : weatherData.temp;
    const condition = weatherData.condition?.toLowerCase() ?? 'sunny';

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

  if (!weatherData || weatherData.temp === undefined) {
    return (
      <WidgetLayout
        padding="p-0"
        content={
          <ScaledEmptyState
            icon={AlertCircle}
            title="No Weather Data"
            subtitle="Connect to a weather source in settings or add a Weather widget."
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
          style={{ padding: 'min(12px, 2cqmin) min(16px, 3cqmin)' }}
        >
          <div
            className="flex items-center"
            style={{ gap: 'min(10px, 2cqmin)' }}
          >
            <div
              className="bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm flex items-center justify-center"
              style={{ padding: 'min(6px, 1.5cqmin)' }}
            >
              <Shirt
                className="text-emerald-600"
                style={{
                  width: 'min(20px, 6cqmin)',
                  height: 'min(20px, 6cqmin)',
                }}
              />
            </div>
            <span
              className="font-black uppercase tracking-widest text-slate-400"
              style={{ fontSize: 'min(16px, 5cqmin, 25cqw)' }}
            >
              Recess Gear
            </span>
          </div>
          <div
            className="flex items-center bg-emerald-50 rounded-full border border-emerald-100 shadow-sm"
            style={{
              gap: 'min(8px, 1.5cqmin)',
              padding: 'min(3px, 0.8cqmin) min(8px, 2cqmin)',
            }}
          >
            <Thermometer
              className="text-emerald-600"
              style={{
                width: 'min(18px, 5cqmin)',
                height: 'min(18px, 5cqmin)',
              }}
            />
            <span
              className="font-black text-emerald-700 tracking-tight"
              style={{ fontSize: 'min(20px, 6cqmin, 30cqw)' }}
            >
              {Math.round(
                (config.useFeelsLike && weatherData.feelsLike !== undefined
                  ? weatherData.feelsLike
                  : weatherData.temp) ?? 72
              )}
              °
            </span>
          </div>
        </div>
      }
      content={
        <div
          className="flex-1 w-full h-full overflow-y-auto custom-scrollbar bg-slate-50/30"
          style={{ padding: 'min(16px, 3cqmin)' }}
        >
          <div
            className="grid grid-cols-1 @[240px]:grid-cols-2"
            style={{ gap: 'min(12px, 3cqmin)' }}
          >
            {gearList.map((item, idx) => (
              <div
                key={`${item.label}-${idx}`}
                className="flex items-center bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group"
                style={{
                  gap: 'min(12px, 3cqmin)',
                  padding: 'min(16px, 3cqmin)',
                }}
              >
                <span
                  className="group-hover:scale-125 transition-transform duration-300 transform-gpu drop-shadow-sm shrink-0"
                  style={{ fontSize: 'min(60px, 16cqmin, 20cqw)' }}
                >
                  {item.icon}
                </span>
                <div className="flex flex-col min-w-0">
                  <span
                    className="font-black text-slate-700 uppercase leading-tight tracking-tight"
                    style={{ fontSize: 'min(24px, 8cqmin, 45cqw)' }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="font-bold text-slate-300 uppercase tracking-widest"
                    style={{
                      fontSize: 'min(14px, 5cqmin, 25cqw)',
                      marginTop: 'min(2px, 0.5cqmin)',
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
            padding: 'min(12px, 2cqmin) min(16px, 3cqmin)',
            fontSize: 'min(12px, 4cqmin, 20cqw)',
          }}
        >
          <div
            className="flex items-center truncate max-w-[70%]"
            style={{ gap: 'min(8px, 1.5cqmin)' }}
          >
            <LinkIcon
              className="opacity-60"
              style={{
                width: 'min(10px, 3cqmin)',
                height: 'min(10px, 3cqmin)',
              }}
            />
            <span className="truncate">
              {weatherData.locationName ?? 'Weather'} Source
            </span>
          </div>
          <div
            className="flex items-center shrink-0"
            style={{ gap: 'min(6px, 1cqmin)' }}
          >
            <div
              className="bg-emerald-400 rounded-full animate-pulse"
              style={{
                width: 'min(5px, 1.5cqmin)',
                height: 'min(5px, 1.5cqmin)',
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
  const { featurePermissions } = useAuth();

  // Try both sources for permissions (dashboard context or auth context)
  const permissions = featurePermissions ?? [];
  const weatherPermission = permissions.find((p) => p.widgetType === 'weather');
  const isAdminProxy =
    weatherPermission?.config?.fetchingStrategy === 'admin_proxy';

  const config = widget.config as RecessGearConfig;

  const weatherWidgets = useMemo(() => {
    return activeDashboard?.widgets.filter((w) => w.type === 'weather') ?? [];
  }, [activeDashboard?.widgets]);

  return (
    <div className="space-y-6">
      {isAdminProxy && (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xxs font-black text-blue-900 uppercase tracking-tight">
              Managed by Admin
            </p>
            <p className="text-xxs text-blue-800 leading-tight">
              Your school station weather data is automatically linked.
            </p>
          </div>
        </div>
      )}
      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-emerald-900">
          <Info className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">
            Smart Linking
          </span>
        </div>
        <p className="text-xxs text-emerald-800 leading-relaxed">
          Recess Gear automatically updates based on your weather source (Admin
          Panel or a Weather widget on your dashboard).
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
