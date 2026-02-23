import React, { useState } from 'react';
import { WeatherGlobalConfig, WeatherTemperatureRange } from '../../../types';
import { useStorage } from '../../../hooks/useStorage';
import { Toggle } from '../../common/Toggle';
import {
  Plus,
  Trash2,
  Loader2,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';

interface WeatherConfigProps {
  config: WeatherGlobalConfig;
  onChange: (config: WeatherGlobalConfig) => void;
  onShowMessage: (type: 'success' | 'error', text: string) => void;
}

export const WeatherConfig: React.FC<WeatherConfigProps> = ({
  config,
  onChange,
  onShowMessage,
}) => {
  const [uploadingRangeId, setUploadingRangeId] = useState<string | null>(null);
  const { uploadWeatherImage } = useStorage();

  const addWeatherRange = () => {
    const newRange: WeatherTemperatureRange = {
      id: crypto.randomUUID(),
      min: 0,
      max: 100,
      message: 'New Range',
    };

    onChange({
      ...config,
      temperatureRanges: [...(config.temperatureRanges ?? []), newRange],
    });
  };

  const updateWeatherRange = (
    rangeId: string,
    updates: Partial<WeatherTemperatureRange>
  ) => {
    const ranges = config.temperatureRanges ?? [];
    const newRanges = ranges.map((r) =>
      r.id === rangeId ? { ...r, ...updates } : r
    );

    onChange({ ...config, temperatureRanges: newRanges });
  };

  const removeWeatherRange = (rangeId: string) => {
    const ranges = config.temperatureRanges ?? [];
    onChange({
      ...config,
      temperatureRanges: ranges.filter((r) => r.id !== rangeId),
    });
  };

  const handleWeatherImageUpload = async (rangeId: string, file: File) => {
    if (!file) return;
    setUploadingRangeId(rangeId);
    try {
      const url = await uploadWeatherImage(rangeId, file);
      updateWeatherRange(rangeId, { imageUrl: url });
      onShowMessage('success', 'Image uploaded');
    } catch (e) {
      console.error(e);
      onShowMessage('error', 'Upload failed');
    } finally {
      setUploadingRangeId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
          Fetching Strategy
        </label>
        <div className="flex bg-white rounded-lg border border-slate-200 p-1">
          <button
            onClick={() =>
              onChange({
                ...config,
                fetchingStrategy: 'client',
              })
            }
            className={`flex-1 py-1.5 text-xxs font-bold rounded transition-colors ${
              config.fetchingStrategy === 'client' || !config.fetchingStrategy
                ? 'bg-brand-blue-primary text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Client (Direct)
          </button>
          <button
            onClick={() =>
              onChange({
                ...config,
                fetchingStrategy: 'admin_proxy',
              })
            }
            className={`flex-1 py-1.5 text-xxs font-bold rounded transition-colors ${
              config.fetchingStrategy === 'admin_proxy'
                ? 'bg-brand-blue-primary text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Admin Proxy
          </button>
        </div>
        <p className="text-xxs text-slate-400 mt-1">
          <strong>Client:</strong> Each user fetches data directly (higher API
          usage).
          <br />
          <strong>Admin Proxy:</strong> Admin fetches data, users sync from
          database (saves API calls).
        </p>
      </div>

      {config.fetchingStrategy === 'admin_proxy' && (
        <div className="space-y-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div>
            <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
              Data Source
            </label>
            <div className="flex bg-white rounded-lg border border-slate-200 p-1">
              <button
                onClick={() =>
                  onChange({
                    ...config,
                    source: 'openweather',
                  })
                }
                className={`flex-1 py-1.5 text-xxs font-bold rounded transition-colors ${
                  config.source === 'openweather' || !config.source
                    ? 'bg-brand-blue-primary text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                OpenWeather
              </button>
              <button
                onClick={() =>
                  onChange({
                    ...config,
                    source: 'earth_networks',
                  })
                }
                className={`flex-1 py-1.5 text-xxs font-bold rounded transition-colors ${
                  config.source === 'earth_networks'
                    ? 'bg-brand-blue-primary text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Earth Networks
              </button>
            </div>
          </div>

          {(config.source === 'openweather' || !config.source) && (
            <div>
              <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
                City (Optional)
              </label>
              <input
                type="text"
                placeholder="Default: Local Station"
                value={config.city ?? ''}
                onChange={(e) =>
                  onChange({
                    ...config,
                    city: e.target.value,
                  })
                }
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue-primary outline-none"
              />
            </div>
          )}
        </div>
      )}

      <div>
        <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
          Update Frequency (Minutes)
        </label>
        <input
          type="number"
          min="5"
          max="1440"
          value={config.updateFrequencyMinutes ?? 15}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            onChange({
              ...config,
              updateFrequencyMinutes: isNaN(val) ? 15 : val,
            });
          }}
          className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-brand-blue-primary outline-none"
        />
      </div>

      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
        <span className="text-xxs font-bold text-slate-500 uppercase">
          Show &quot;Feels Like&quot; Temperature
        </span>
        <Toggle
          checked={config.showFeelsLike ?? false}
          onChange={(checked) =>
            onChange({
              ...config,
              showFeelsLike: checked,
            })
          }
          size="xs"
          showLabels={false}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xxs font-bold text-slate-500 uppercase block">
            Temperature Ranges
          </label>
          <button
            onClick={addWeatherRange}
            className="text-xxs font-bold text-brand-blue-primary hover:text-brand-blue-dark flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Range
          </button>
        </div>

        <div className="space-y-2">
          {(config.temperatureRanges || []).map((range) => (
            <div
              key={range.id}
              className="bg-white border border-slate-200 rounded-lg p-2 space-y-2"
            >
              <div className="flex items-center gap-2">
                <select
                  value={range.type ?? 'range'}
                  onChange={(e) =>
                    updateWeatherRange(range.id, {
                      type: e.target.value as WeatherTemperatureRange['type'],
                    })
                  }
                  className="text-xxs font-bold border border-slate-200 rounded px-1 py-1"
                >
                  <option value="range">Range</option>
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>

                {(range.type === 'range' || !range.type) && (
                  <>
                    <input
                      type="number"
                      placeholder="Min"
                      value={range.min}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateWeatherRange(range.id, {
                          min: isNaN(val) ? 0 : val,
                        });
                      }}
                      className="w-14 px-1.5 py-1 text-xs border border-slate-200 rounded text-center"
                      title="Min Temp"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={range.max}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateWeatherRange(range.id, {
                          max: isNaN(val) ? 0 : val,
                        });
                      }}
                      className="w-14 px-1.5 py-1 text-xs border border-slate-200 rounded text-center"
                      title="Max Temp"
                    />
                  </>
                )}

                {range.type === 'above' && (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xxs font-bold text-slate-400 uppercase">
                      Above
                    </span>
                    <input
                      type="number"
                      placeholder="Temp"
                      value={range.min}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateWeatherRange(range.id, {
                          min: isNaN(val) ? 0 : val,
                        });
                      }}
                      className="w-14 px-1.5 py-1 text-xs border border-slate-200 rounded text-center"
                    />
                  </div>
                )}

                {range.type === 'below' && (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xxs font-bold text-slate-400 uppercase">
                      Below
                    </span>
                    <input
                      type="number"
                      placeholder="Temp"
                      value={range.max}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        updateWeatherRange(range.id, {
                          max: isNaN(val) ? 0 : val,
                        });
                      }}
                      className="w-14 px-1.5 py-1 text-xs border border-slate-200 rounded text-center"
                    />
                  </div>
                )}

                <div className="flex-1" />
                <button
                  onClick={() => removeWeatherRange(range.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                placeholder="Display Message..."
                value={range.message}
                onChange={(e) =>
                  updateWeatherRange(range.id, {
                    message: e.target.value,
                  })
                }
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:border-brand-blue-primary outline-none"
              />

              <div className="flex items-center gap-2">
                {range.imageUrl ? (
                  <div className="relative w-10 h-10 rounded bg-slate-100 overflow-hidden shrink-0 group">
                    <img
                      src={range.imageUrl}
                      alt="Range"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() =>
                        updateWeatherRange(range.id, {
                          imageUrl: undefined,
                        })
                      }
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4 text-slate-300" />
                  </div>
                )}

                <div className="flex-1">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-3 py-1.5 transition-colors w-max">
                    {uploadingRangeId === range.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue-primary" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span className="text-xxs font-bold text-slate-600 uppercase">
                      {range.imageUrl ? 'Change Image' : 'Upload Image'}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          void handleWeatherImageUpload(range.id, file);
                        }
                      }}
                      disabled={!!uploadingRangeId}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
