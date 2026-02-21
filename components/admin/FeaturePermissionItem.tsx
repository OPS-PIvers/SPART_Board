import React, { useState } from 'react';
import {
  FeaturePermission,
  AccessLevel,
  WidgetType,
  GradeLevel,
  InternalToolType,
  LunchCountGlobalConfig,
  WeatherGlobalConfig,
  WebcamGlobalConfig,
  WeatherTemperatureRange,
  CatalystGlobalConfig,
} from '../../types';
import { useStorage } from '../../hooks/useStorage';
import {
  getWidgetGradeLevels,
  ALL_GRADE_LEVELS,
} from '../../config/widgetGradeLevels';
import {
  Shield,
  Users,
  Globe,
  Plus,
  Trash2,
  Save,
  Settings,
  Upload,
  Loader2,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { Toggle } from '../common/Toggle';
import { CatalystPermissionEditor } from './CatalystPermissionEditor';

// Helper type guard
const isCatalystConfig = (config: unknown): config is CatalystGlobalConfig => {
  return typeof config === 'object' && config !== null;
};

interface FeaturePermissionItemProps {
  tool: {
    type: WidgetType | InternalToolType;
    label: string;
    icon: React.ElementType;
    color: string;
  };
  permission: FeaturePermission;
  viewMode: 'grid' | 'list';
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  hasCustomPermission: boolean;
  isEditing: boolean;
  isLibraryOpen?: boolean;
  onUpdate: (updates: Partial<FeaturePermission>) => void;
  onSave: () => void;
  onDelete: () => void;
  onToggleEditing: () => void;
  onOpenLibrary: () => void;
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export const FeaturePermissionItem: React.FC<FeaturePermissionItemProps> = ({
  tool,
  permission,
  viewMode,
  isSaving,
  hasUnsavedChanges,
  hasCustomPermission,
  isEditing,
  isLibraryOpen = false,
  onUpdate,
  onSave,
  onDelete,
  onToggleEditing,
  onOpenLibrary,
  showMessage,
}) => {
  const { uploadWeatherImage } = useStorage();
  const [uploadingRangeId, setUploadingRangeId] = useState<string | null>(null);

  const currentLevels =
    permission.gradeLevels ?? getWidgetGradeLevels(tool.type);
  const isAllSelected = ALL_GRADE_LEVELS.every((l) =>
    currentLevels.includes(l)
  );

  // --- Helper Functions ---

  const addBetaUser = (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showMessage('error', 'Please enter a valid email address.');
      return;
    }

    if (!permission.betaUsers.includes(trimmedEmail)) {
      onUpdate({
        betaUsers: [...permission.betaUsers, trimmedEmail],
      });
    }
  };

  const removeBetaUser = (email: string) => {
    onUpdate({
      betaUsers: permission.betaUsers.filter((e) => e !== email),
    });
  };

  const addWeatherRange = () => {
    const config = (permission.config ?? {
      fetchingStrategy: 'client',
      updateFrequencyMinutes: 15,
      temperatureRanges: [],
    }) as unknown as WeatherGlobalConfig;

    const newRange: WeatherTemperatureRange = {
      id: crypto.randomUUID(),
      min: 0,
      max: 100,
      message: 'New Range',
    };

    onUpdate({
      config: {
        ...config,
        temperatureRanges: [...(config.temperatureRanges ?? []), newRange],
      },
    });
  };

  const updateWeatherRange = (
    rangeId: string,
    updates: Partial<WeatherTemperatureRange>
  ) => {
    const config = (permission.config ?? {}) as unknown as WeatherGlobalConfig;
    const ranges = config.temperatureRanges ?? [];

    const newRanges = ranges.map((r) =>
      r.id === rangeId ? { ...r, ...updates } : r
    );

    onUpdate({
      config: { ...config, temperatureRanges: newRanges },
    });
  };

  const removeWeatherRange = (rangeId: string) => {
    const config = (permission.config ?? {}) as unknown as WeatherGlobalConfig;
    const ranges = config.temperatureRanges ?? [];

    onUpdate({
      config: {
        ...config,
        temperatureRanges: ranges.filter((r) => r.id !== rangeId),
      },
    });
  };

  const handleWeatherImageUpload = async (rangeId: string, file: File) => {
    if (!file) return;
    setUploadingRangeId(rangeId);
    try {
      const url = await uploadWeatherImage(rangeId, file);
      updateWeatherRange(rangeId, { imageUrl: url });
      showMessage('success', 'Image uploaded');
    } catch (e) {
      console.error(e);
      showMessage('error', 'Upload failed');
    } finally {
      setUploadingRangeId(null);
    }
  };

  const toggleGradeLevel = (level: GradeLevel) => {
    let newLevels: GradeLevel[];

    if (currentLevels.includes(level)) {
      newLevels = currentLevels.filter((l) => l !== level);
    } else {
      newLevels = [...currentLevels, level];
    }
    onUpdate({ gradeLevels: newLevels });
  };

  const toggleAllGradeLevels = () => {
    onUpdate({
      gradeLevels: isAllSelected ? [] : [...ALL_GRADE_LEVELS],
    });
  };

  const getAccessLevelIcon = (level: AccessLevel) => {
    switch (level) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'beta':
        return <Users className="w-4 h-4" />;
      case 'public':
        return <Globe className="w-4 h-4" />;
    }
  };

  const getAccessLevelColor = (level: AccessLevel) => {
    switch (level) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'beta':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'public':
        return 'bg-green-100 text-green-700 border-green-300';
    }
  };

  // --- Render Components ---

  const renderConfigPanel = () => (
    <div className="mb-4 p-3 bg-brand-blue-lighter/20 border border-brand-blue-lighter rounded-lg animate-in slide-in-from-top-2">
      <h4 className="text-xs font-black text-brand-blue-dark uppercase mb-3 flex items-center gap-2">
        <Settings className="w-3 h-3" /> {tool.label} Configuration
      </h4>

      {tool.type === 'lunchCount' && (
        <div className="space-y-3">
          {(() => {
            const config = (permission.config ??
              {}) as LunchCountGlobalConfig;
            const isSchumannIdMalformed =
              config.schumannSheetId && config.schumannSheetId.includes('/');
            const isIntermediateIdMalformed =
              config.intermediateSheetId &&
              config.intermediateSheetId.includes('/');
            const isUrlMalformed =
              config.submissionUrl &&
              !config.submissionUrl.startsWith('https://');

            return (
              <>
                <p className="text-xxs text-slate-400 leading-tight">
                  Found in the URL: docs.google.com/spreadsheets/d/
                  <b>[ID]</b>/edit
                </p>
                <div>
                  <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
                    Schumann Elementary — Sheet ID
                  </label>
                  <input
                    type="text"
                    value={config.schumannSheetId ?? ''}
                    onChange={(e) =>
                      onUpdate({
                        config: {
                          ...config,
                          schumannSheetId: e.target.value.trim(),
                        },
                      })
                    }
                    className={`w-full px-2 py-1.5 text-xs font-mono border rounded focus:ring-1 outline-none ${
                      isSchumannIdMalformed
                        ? 'border-red-300 bg-red-50 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-brand-blue-primary'
                    }`}
                    placeholder="Schumann spreadsheet ID"
                  />
                  {isSchumannIdMalformed && (
                    <p className="text-xxs text-red-600 font-bold mt-1">
                      Warning: Enter only the ID, not the full URL.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
                    Intermediate School — Sheet ID
                  </label>
                  <input
                    type="text"
                    value={config.intermediateSheetId ?? ''}
                    onChange={(e) =>
                      onUpdate({
                        config: {
                          ...config,
                          intermediateSheetId: e.target.value.trim(),
                        },
                      })
                    }
                    className={`w-full px-2 py-1.5 text-xs font-mono border rounded focus:ring-1 outline-none ${
                      isIntermediateIdMalformed
                        ? 'border-red-300 bg-red-50 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-brand-blue-primary'
                    }`}
                    placeholder="Intermediate spreadsheet ID"
                  />
                  {isIntermediateIdMalformed && (
                    <p className="text-xxs text-red-600 font-bold mt-1">
                      Warning: Enter only the ID, not the full URL.
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
                    Submission URL (Apps Script)
                  </label>
                  <input
                    type="text"
                    value={config.submissionUrl ?? ''}
                    onChange={(e) =>
                      onUpdate({
                        config: {
                          ...config,
                          submissionUrl: e.target.value.trim(),
                        },
                      })
                    }
                    className={`w-full px-2 py-1.5 text-xs font-mono border rounded focus:ring-1 outline-none ${
                      isUrlMalformed
                        ? 'border-red-300 bg-red-50 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-brand-blue-primary'
                    }`}
                    placeholder="https://script.google.com/macros/s/.../exec"
                  />
                  {isUrlMalformed && (
                    <p className="text-xxs text-red-600 font-bold mt-1">
                      Warning: URL must start with https://
                    </p>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {tool.type === 'weather' && (
        <div className="space-y-4">
          {(() => {
            const config = (permission.config ?? {
              fetchingStrategy: 'client',
              updateFrequencyMinutes: 15,
              temperatureRanges: [],
            }) as unknown as WeatherGlobalConfig;

            return (
              <>
                <div>
                  <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
                    Fetching Strategy
                  </label>
                  <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                    <button
                      onClick={() =>
                        onUpdate({
                          config: {
                            ...config,
                            fetchingStrategy: 'client',
                          },
                        })
                      }
                      className={`flex-1 py-1.5 text-xxs font-bold rounded transition-colors ${
                        config.fetchingStrategy === 'client' ||
                        !config.fetchingStrategy
                          ? 'bg-brand-blue-primary text-white shadow-sm'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Client (Direct)
                    </button>
                    <button
                      onClick={() =>
                        onUpdate({
                          config: {
                            ...config,
                            fetchingStrategy: 'admin_proxy',
                          },
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
                    <strong>Client:</strong> Each user fetches data directly
                    (higher API usage).
                    <br />
                    <strong>Admin Proxy:</strong> Admin fetches data, users sync
                    from database (saves API calls).
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
                            onUpdate({
                              config: {
                                ...config,
                                source: 'openweather',
                              },
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
                            onUpdate({
                              config: {
                                ...config,
                                source: 'earth_networks',
                              },
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
                            onUpdate({
                              config: {
                                ...config,
                                city: e.target.value,
                              },
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
                      onUpdate({
                        config: {
                          ...config,
                          updateFrequencyMinutes: isNaN(val) ? 15 : val,
                        },
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
                      onUpdate({
                        config: {
                          ...config,
                          showFeelsLike: checked,
                        },
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
                                type: e.target
                                  .value as WeatherTemperatureRange['type'],
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
                                title="Max Temp"
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
                                title="Max Temp"
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
                                {range.imageUrl
                                  ? 'Change Image'
                                  : 'Upload Image'}
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    void handleWeatherImageUpload(
                                      range.id,
                                      file
                                    );
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
              </>
            );
          })()}
        </div>
      )}

      {tool.type === 'catalyst' && (
        <div className="space-y-4">
          <CatalystPermissionEditor
            config={
              isCatalystConfig(permission.config) ? permission.config : {}
            }
            onChange={(newConfig) =>
              onUpdate({
                config: newConfig as unknown as Record<string, unknown>,
              })
            }
            onShowMessage={showMessage}
          />
        </div>
      )}

      {![
        'lunchCount',
        'weather',
        'instructionalRoutines',
        'catalyst',
        'webcam',
      ].includes(tool.type) && (
        <p className="text-xs text-slate-500 italic">
          No additional configuration available for this widget.
        </p>
      )}
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden transition-all hover:border-brand-blue-light">
        <div className="flex items-center p-3 gap-4">
          {/* 1. Info Column */}
          <div className="flex items-center gap-3 flex-[1.5] min-w-0">
            <div className={`${tool.color} p-2 rounded-lg text-white shrink-0`}>
              <tool.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={permission.displayName ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdate({
                    displayName: val || undefined,
                  });
                }}
                className="w-full font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-blue-primary focus:outline-none px-0 py-0.5 transition-colors text-sm"
                placeholder={tool.label}
              />
              <p className="text-xs text-slate-500">{tool.type}</p>
            </div>
          </div>

          {/* 2. Status Column */}
          <div className="flex flex-col items-center justify-center w-20 shrink-0">
            <Toggle
              checked={permission.enabled}
              onChange={(checked) =>
                onUpdate({
                  enabled: checked,
                })
              }
              size="sm"
            />
            <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              {permission.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* 3. Access Column */}
          <div className="flex flex-col gap-1 w-32 shrink-0">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Access Level
            </label>
            <div className="flex bg-slate-100 p-0.5 rounded-lg">
              {(['admin', 'beta', 'public'] as AccessLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => onUpdate({ accessLevel: level })}
                  title={level.charAt(0).toUpperCase() + level.slice(1)}
                  className={`flex-1 p-1 rounded-md flex items-center justify-center transition-all ${
                    permission.accessLevel === level
                      ? 'bg-white shadow-sm text-brand-blue-primary'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {getAccessLevelIcon(level)}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Grades Column */}
          <div className="flex flex-col gap-1 flex-[1.2] min-w-0">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Grades
              </label>
              <button
                onClick={toggleAllGradeLevels}
                className="text-[10px] font-bold text-brand-blue-primary hover:underline"
              >
                {isAllSelected ? 'None' : 'All'}
              </button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {ALL_GRADE_LEVELS.map((level) => {
                const isSelected = currentLevels.includes(level);
                return (
                  <button
                    key={level}
                    onClick={() => toggleGradeLevel(level)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                      isSelected
                        ? 'bg-brand-blue-primary text-white border-brand-blue-primary'
                        : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {level.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Actions Column */}
          <div className="flex items-center gap-2 justify-end w-32 shrink-0">
            <button
              onClick={() => {
                if (tool.type === 'instructionalRoutines') {
                  onOpenLibrary();
                } else {
                  onToggleEditing();
                }
              }}
              className={`p-2 rounded-lg transition-colors ${
                (tool.type === 'instructionalRoutines' && isLibraryOpen) || isEditing
                  ? 'bg-brand-blue-primary text-white'
                  : 'text-slate-400 hover:bg-slate-100'
              }`}
              title="Edit widget configuration"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onSave}
              disabled={isSaving || !hasUnsavedChanges}
              className={`p-2 rounded-lg transition-colors ${
                hasUnsavedChanges
                    ? 'text-orange-600 hover:bg-orange-50'
                    : 'text-slate-300 cursor-default'
              }`}
              title="Save Changes"
            >
               <Save className="w-4 h-4" />
            </button>

            {hasCustomPermission && (
              <button
                onClick={onDelete}
                disabled={isSaving}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Remove custom permissions"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Expandable Configuration Area */}
        {(isEditing || permission.accessLevel === 'beta') && (
            <div className="px-3 pb-3 bg-slate-50 border-t border-slate-100 pt-3">
                {isEditing && renderConfigPanel()}

                 {/* Beta Users (only show if access level is beta) - Reusing logic but simpler layout */}
                {permission.accessLevel === 'beta' && (
                    <div className="mt-2">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">
                            Beta Users
                        </label>
                        <div className="flex flex-wrap gap-2 items-center">
                            {permission.betaUsers.map((email) => (
                                <div
                                    key={email}
                                    className="flex items-center gap-1 pl-2 pr-1 py-1 bg-blue-100 text-blue-800 rounded-md text-xs"
                                >
                                    <span>{email}</span>
                                    <button
                                        onClick={() => removeBetaUser(email)}
                                        className="hover:bg-blue-200 rounded p-0.5 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}

                            <div className="flex gap-1 items-center">
                                <input
                                    type="email"
                                    placeholder="Add beta user..."
                                    className="px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand-blue-primary w-48"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            addBetaUser(
                                                (e.target as HTMLInputElement).value
                                            );
                                            (e.target as HTMLInputElement).value = '';
                                        }
                                    }}
                                />
                                <button
                                    onClick={(e) => {
                                        const input = e.currentTarget
                                            .previousElementSibling as HTMLInputElement;
                                        addBetaUser(input.value);
                                        input.value = '';
                                    }}
                                    className="p-1 bg-brand-blue-primary text-white rounded hover:bg-brand-blue-dark transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    );
  }

  // Grid View (Original)
  return (
    <div className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-brand-blue-light transition-colors h-full flex flex-col">
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`${tool.color} p-2 rounded-lg text-white`}>
            <tool.icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={permission.displayName ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                onUpdate({
                  displayName: val || undefined,
                });
              }}
              className="w-full font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-blue-primary focus:outline-none px-0 py-0.5 transition-colors"
              placeholder={tool.label}
            />
            <p className="text-xs text-slate-500">{tool.type}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (tool.type === 'instructionalRoutines') {
                onOpenLibrary();
              } else {
                onToggleEditing();
              }
            }}
            className={`p-2 rounded-lg transition-colors ${
              (tool.type === 'instructionalRoutines' && isLibraryOpen) || isEditing
                ? 'bg-brand-blue-primary text-white'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title="Edit widget configuration"
          >
            <Settings className="w-4 h-4" />
          </button>
          {hasCustomPermission && (
            <button
              onClick={onDelete}
              disabled={isSaving}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Remove custom permissions"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Configuration Panel */}
      {isEditing && renderConfigPanel()}

      {/* Enabled Toggle */}
      <div className="flex items-center justify-between mb-3 p-3 bg-slate-50 rounded-lg">
        <span className="text-sm font-medium text-slate-700">
          Feature Enabled
        </span>
        <Toggle
          checked={permission.enabled}
          onChange={(checked) =>
            onUpdate({
              enabled: checked,
            })
          }
          size="md"
        />
      </div>

      {/* Access Level */}
      <div className="mb-3">
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Access Level
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['admin', 'beta', 'public'] as AccessLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => onUpdate({ accessLevel: level })}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium flex items-center justify-center gap-1 transition-all ${
                permission.accessLevel === level
                  ? getAccessLevelColor(level)
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {getAccessLevelIcon(level)}
              <span className="capitalize">{level}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grade Levels */}
      <div className="mb-3">
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          Grade Levels
        </label>
        <div className="grid grid-cols-5 gap-1">
          {ALL_GRADE_LEVELS.map((level) => {
            const isSelected = currentLevels.includes(level);

            return (
              <button
                key={level}
                onClick={() => toggleGradeLevel(level)}
                className={`py-1.5 rounded-md text-xxs font-bold border transition-all ${
                  isSelected
                    ? 'bg-brand-blue-primary text-white border-brand-blue-primary shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {level.toUpperCase()}
              </button>
            );
          })}
          <button
            onClick={toggleAllGradeLevels}
            className={`py-1.5 rounded-md text-xxs font-bold border transition-all ${
              isAllSelected
                ? 'bg-brand-blue-primary text-white border-brand-blue-primary shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            ALL
          </button>
        </div>
      </div>

      {/* Beta Users (only show if access level is beta) */}
      {permission.accessLevel === 'beta' && (
        <div className="mb-3">
          <label className="text-sm font-medium text-slate-700 mb-2 block">
            Beta Users
          </label>
          <div className="space-y-2">
            {permission.betaUsers.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between p-2 bg-blue-50 rounded-lg"
              >
                <span className="text-sm text-slate-700">{email}</span>
                <button
                  onClick={() => removeBetaUser(email)}
                  className="text-red-600 hover:bg-red-100 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="user@example.com"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addBetaUser((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget
                    .previousElementSibling as HTMLInputElement;
                  addBetaUser(input.value);
                  input.value = '';
                }}
                className="px-3 py-2 bg-brand-blue-primary text-white rounded-lg hover:bg-brand-blue-dark transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          hasUnsavedChanges
            ? 'bg-orange-600 hover:bg-orange-700 text-white'
            : 'bg-brand-blue-primary hover:bg-brand-blue-dark text-white'
        }`}
      >
        <Save className="w-4 h-4" />
        {isSaving
          ? 'Saving...'
          : hasUnsavedChanges
            ? 'Save Changes'
            : 'Save Permissions'}
      </button>
    </div>
  );
};
