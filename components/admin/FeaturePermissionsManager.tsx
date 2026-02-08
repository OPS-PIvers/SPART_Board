import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db, isAuthBypass } from '../../config/firebase';
import {
  FeaturePermission,
  AccessLevel,
  WidgetType,
  GradeLevel,
  LunchCountGlobalConfig,
  WeatherGlobalConfig,
  WeatherTemperatureRange,
} from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { TOOLS } from '../../config/tools';
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
  AlertCircle,
  Settings,
  Upload,
  Loader2,
  Image as ImageIcon,
  X,
  Edit,
  Sparkles,
} from 'lucide-react';
import { useInstructionalRoutines } from '../../hooks/useInstructionalRoutines';
import { LibraryManager } from '../widgets/InstructionalRoutines/LibraryManager';
import { InstructionalRoutine } from '../../config/instructionalRoutines';
import { ConfirmDialog } from '../widgets/InstructionalRoutines/ConfirmDialog';
import { getRoutineColorClasses } from '../widgets/InstructionalRoutines/colorHelpers';

export const FeaturePermissionsManager: React.FC = () => {
  const { routines, deleteRoutine, saveRoutine } = useInstructionalRoutines();
  const [editingRoutine, setEditingRoutine] =
    useState<InstructionalRoutine | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    routineId: string;
    routineName: string;
  } | null>(null);
  const [permissions, setPermissions] = useState<
    Map<WidgetType, FeaturePermission>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<WidgetType>>(new Set());
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<Set<WidgetType>>(
    new Set()
  );
  const [editingConfig, setEditingConfig] = useState<WidgetType | null>(null);
  const [isRoutinesLibraryOpen, setIsRoutinesLibraryOpen] = useState(false);
  const [uploadingRangeId, setUploadingRangeId] = useState<string | null>(null);
  const { uploadWeatherImage } = useStorage();

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    const timeoutId = setTimeout(() => setMessage(null), 3000);
    // Return cleanup function
    return () => clearTimeout(timeoutId);
  }, []);

  const loadPermissions = useCallback(async () => {
    if (isAuthBypass) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'feature_permissions'));
      const permMap = new Map<WidgetType, FeaturePermission>();

      snapshot.forEach((doc) => {
        const data = doc.data() as FeaturePermission;
        // Migration fix: If fetched permission still has "universal", clean it up
        if (
          data.gradeLevels &&
          data.gradeLevels.includes('universal' as GradeLevel)
        ) {
          data.gradeLevels = ALL_GRADE_LEVELS;
        }
        permMap.set(data.widgetType, data);
      });

      setPermissions(permMap);
    } catch (error) {
      console.error('Error loading permissions:', error);
      showMessage('error', 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // Load permissions from Firestore
  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  const getPermission = (widgetType: WidgetType): FeaturePermission => {
    return (
      permissions.get(widgetType) ?? {
        widgetType,
        accessLevel: 'public',
        betaUsers: [],
        enabled: true,
      }
    );
  };

  const updatePermission = (
    widgetType: WidgetType,
    updates: Partial<FeaturePermission>
  ) => {
    const current = getPermission(widgetType);
    const updated = { ...current, ...updates };
    setPermissions(new Map(permissions).set(widgetType, updated));
    // Mark as having unsaved changes
    setUnsavedChanges(new Set(unsavedChanges).add(widgetType));
  };

  const savePermission = async (widgetType: WidgetType) => {
    try {
      setSaving(new Set(saving).add(widgetType));
      const permission = getPermission(widgetType);

      await setDoc(doc(db, 'feature_permissions', widgetType), permission);

      // Clear unsaved changes flag for this widget
      setUnsavedChanges((prev) => {
        const next = new Set(prev);
        next.delete(widgetType);
        return next;
      });

      showMessage('success', `Saved ${widgetType} permissions`);
    } catch (error) {
      console.error('Error saving permission:', error);
      showMessage('error', `Failed to save ${widgetType} permissions`);
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(widgetType);
        return next;
      });
    }
  };

  const deletePermission = async (widgetType: WidgetType) => {
    if (
      !confirm(
        `Remove permission rules for ${widgetType}? It will revert to default (public access).`
      )
    ) {
      return;
    }

    try {
      setSaving(new Set(saving).add(widgetType));
      await deleteDoc(doc(db, 'feature_permissions', widgetType));

      setPermissions((prev) => {
        const next = new Map(prev);
        next.delete(widgetType);
        return next;
      });

      // Clear unsaved changes flag for this widget
      setUnsavedChanges((prev) => {
        const next = new Set(prev);
        next.delete(widgetType);
        return next;
      });

      showMessage('success', `Removed ${widgetType} permissions`);
    } catch (error) {
      console.error('Error deleting permission:', error);
      showMessage('error', `Failed to remove ${widgetType} permissions`);
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(widgetType);
        return next;
      });
    }
  };

  const addBetaUser = (widgetType: WidgetType, email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showMessage('error', 'Please enter a valid email address.');
      return;
    }

    const permission = getPermission(widgetType);
    if (!permission.betaUsers.includes(trimmedEmail)) {
      updatePermission(widgetType, {
        betaUsers: [...permission.betaUsers, trimmedEmail],
      });
    }
  };

  const removeBetaUser = (widgetType: WidgetType, email: string) => {
    const permission = getPermission(widgetType);
    updatePermission(widgetType, {
      betaUsers: permission.betaUsers.filter((e) => e !== email),
    });
  };

  const addWeatherRange = (widgetType: WidgetType) => {
    const permission = getPermission(widgetType);
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

    updatePermission(widgetType, {
      config: {
        ...config,
        temperatureRanges: [...(config.temperatureRanges ?? []), newRange],
      },
    });
  };

  const updateWeatherRange = (
    widgetType: WidgetType,
    rangeId: string,
    updates: Partial<WeatherTemperatureRange>
  ) => {
    const permission = getPermission(widgetType);
    const config = (permission.config ?? {}) as unknown as WeatherGlobalConfig;
    const ranges = config.temperatureRanges ?? [];

    const newRanges = ranges.map((r) =>
      r.id === rangeId ? { ...r, ...updates } : r
    );

    updatePermission(widgetType, {
      config: { ...config, temperatureRanges: newRanges },
    });
  };

  const removeWeatherRange = (widgetType: WidgetType, rangeId: string) => {
    const permission = getPermission(widgetType);
    const config = (permission.config ?? {}) as unknown as WeatherGlobalConfig;
    const ranges = config.temperatureRanges ?? [];

    updatePermission(widgetType, {
      config: {
        ...config,
        temperatureRanges: ranges.filter((r) => r.id !== rangeId),
      },
    });
  };

  const handleWeatherImageUpload = async (
    widgetType: WidgetType,
    rangeId: string,
    file: File
  ) => {
    if (!file) return;
    setUploadingRangeId(rangeId);
    try {
      const url = await uploadWeatherImage(rangeId, file);
      updateWeatherRange(widgetType, rangeId, { imageUrl: url });
      showMessage('success', 'Image uploaded');
    } catch (e) {
      console.error(e);
      showMessage('error', 'Upload failed');
    } finally {
      setUploadingRangeId(null);
    }
  };

  const toggleGradeLevel = (widgetType: WidgetType, level: GradeLevel) => {
    const permission = getPermission(widgetType);
    const currentLevels =
      permission.gradeLevels ?? getWidgetGradeLevels(widgetType);

    let newLevels: GradeLevel[];

    if (currentLevels.includes(level)) {
      newLevels = currentLevels.filter((l) => l !== level);
    } else {
      newLevels = [...currentLevels, level];
    }

    // NOTE: If newLevels is empty, the widget will be hidden from all specific grade filters
    // but will still be visible when the 'All' filter is selected.
    updatePermission(widgetType, { gradeLevels: newLevels });
  };

  const toggleAllGradeLevels = (widgetType: WidgetType) => {
    const permission = getPermission(widgetType);
    const currentLevels =
      permission.gradeLevels ?? getWidgetGradeLevels(widgetType);

    const allSelected = ALL_GRADE_LEVELS.every((l) =>
      currentLevels.includes(l)
    );

    updatePermission(widgetType, {
      gradeLevels: allSelected ? [] : [...ALL_GRADE_LEVELS],
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Message Toast */}
      {message && (
        <div
          className={`fixed top-6 right-6 z-toast px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top ${
            message.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      {/* Widget Permission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {TOOLS.map((tool) => {
          const permission = getPermission(tool.type);
          const hasCustomPermission = permissions.has(tool.type);
          const isSaving = saving.has(tool.type);

          const currentLevels =
            permission.gradeLevels ?? getWidgetGradeLevels(tool.type);
          const isAllSelected = ALL_GRADE_LEVELS.every((l) =>
            currentLevels.includes(l)
          );

          return (
            <div
              key={tool.type}
              className="bg-white border-2 border-slate-200 rounded-xl p-4 hover:border-brand-blue-light transition-colors"
            >
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
                        updatePermission(tool.type, {
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
                        setIsRoutinesLibraryOpen(true);
                      } else {
                        setEditingConfig(
                          editingConfig === tool.type ? null : tool.type
                        );
                      }
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      (tool.type === 'instructionalRoutines' &&
                        isRoutinesLibraryOpen) ||
                      editingConfig === tool.type
                        ? 'bg-brand-blue-primary text-white'
                        : 'text-slate-400 hover:bg-slate-100'
                    }`}
                    title="Edit widget configuration"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  {hasCustomPermission && (
                    <button
                      onClick={() => deletePermission(tool.type)}
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
              {editingConfig === tool.type && (
                <div className="mb-4 p-3 bg-brand-blue-lighter/20 border border-brand-blue-lighter rounded-lg animate-in slide-in-from-top-2">
                  <h4 className="text-xs font-black text-brand-blue-dark uppercase mb-3 flex items-center gap-2">
                    <Settings className="w-3 h-3" /> {tool.label} Configuration
                  </h4>

                  {tool.type === 'lunchCount' && (
                    <div className="space-y-3">
                      {(() => {
                        const config = (permission.config ??
                          {}) as LunchCountGlobalConfig;
                        const isIdMalformed =
                          config.googleSheetId &&
                          config.googleSheetId.includes('/');
                        const isUrlMalformed =
                          config.submissionUrl &&
                          !config.submissionUrl.startsWith('https://');

                        return (
                          <>
                            <div>
                              <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
                                Google Sheet ID
                              </label>
                              <input
                                type="text"
                                value={config.googleSheetId ?? ''}
                                onChange={(e) =>
                                  updatePermission(tool.type, {
                                    config: {
                                      ...config,
                                      googleSheetId: e.target.value.trim(),
                                    },
                                  })
                                }
                                className={`w-full px-2 py-1.5 text-xs font-mono border rounded focus:ring-1 outline-none ${
                                  isIdMalformed
                                    ? 'border-red-300 bg-red-50 focus:ring-red-500'
                                    : 'border-slate-300 focus:ring-brand-blue-primary'
                                }`}
                                placeholder="Spreadsheet ID from URL"
                              />
                              {isIdMalformed && (
                                <p className="text-xxs text-red-600 font-bold mt-1">
                                  Warning: Enter only the ID, not the full URL.
                                </p>
                              )}
                              <p className="text-xxs text-slate-400 mt-1">
                                Found in the URL:
                                docs.google.com/spreadsheets/d/<b>[ID]</b>/edit
                                <br />
                                <span className="text-orange-600 font-bold">
                                  Tip: For better security, hardcode this ID in
                                  your Apps Script instead.
                                </span>
                              </p>
                            </div>
                            <div>
                              <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
                                Submission URL (Apps Script)
                              </label>
                              <input
                                type="text"
                                value={config.submissionUrl ?? ''}
                                onChange={(e) =>
                                  updatePermission(tool.type, {
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
                                    updatePermission(tool.type, {
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
                                    updatePermission(tool.type, {
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
                                <strong>Client:</strong> Each user fetches data
                                directly (higher API usage).
                                <br />
                                <strong>Admin Proxy:</strong> Admin fetches
                                data, users sync from database (saves API
                                calls).
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
                                        updatePermission(tool.type, {
                                          config: {
                                            ...config,
                                            source: 'openweather',
                                          },
                                        })
                                      }
                                      className={`flex-1 py-1.5 text-xxs font-bold rounded transition-colors ${
                                        config.source === 'openweather' ||
                                        !config.source
                                          ? 'bg-brand-blue-primary text-white shadow-sm'
                                          : 'text-slate-500 hover:bg-slate-50'
                                      }`}
                                    >
                                      OpenWeather
                                    </button>
                                    <button
                                      onClick={() =>
                                        updatePermission(tool.type, {
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

                                {(config.source === 'openweather' ||
                                  !config.source) && (
                                  <div>
                                    <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
                                      City (Optional)
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Default: Local Station"
                                      value={config.city ?? ''}
                                      onChange={(e) =>
                                        updatePermission(tool.type, {
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
                                  updatePermission(tool.type, {
                                    config: {
                                      ...config,
                                      updateFrequencyMinutes: isNaN(val)
                                        ? 15
                                        : val,
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
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={config.showFeelsLike ?? false}
                                  onChange={(e) =>
                                    updatePermission(tool.type, {
                                      config: {
                                        ...config,
                                        showFeelsLike: e.target.checked,
                                      },
                                    })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-blue-primary"></div>
                              </label>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-xxs font-bold text-slate-500 uppercase block">
                                  Temperature Ranges
                                </label>
                                <button
                                  onClick={() => addWeatherRange(tool.type)}
                                  className="text-xxs font-bold text-brand-blue-primary hover:text-brand-blue-dark flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" /> Add Range
                                </button>
                              </div>

                              <div className="space-y-2">
                                {(config.temperatureRanges || []).map(
                                  (range) => (
                                    <div
                                      key={range.id}
                                      className="bg-white border border-slate-200 rounded-lg p-2 space-y-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        <select
                                          value={range.type ?? 'range'}
                                          onChange={(e) =>
                                            updateWeatherRange(
                                              tool.type,
                                              range.id,
                                              {
                                                type: e.target
                                                  .value as WeatherTemperatureRange['type'],
                                              }
                                            )
                                          }
                                          className="text-xxs font-bold border border-slate-200 rounded px-1 py-1"
                                        >
                                          <option value="range">Range</option>
                                          <option value="above">Above</option>
                                          <option value="below">Below</option>
                                        </select>

                                        {(range.type === 'range' ||
                                          !range.type) && (
                                          <>
                                            <input
                                              type="number"
                                              placeholder="Min"
                                              value={range.min}
                                              onChange={(e) => {
                                                const val = parseFloat(
                                                  e.target.value
                                                );
                                                updateWeatherRange(
                                                  tool.type,
                                                  range.id,
                                                  {
                                                    min: isNaN(val) ? 0 : val,
                                                  }
                                                );
                                              }}
                                              className="w-14 px-1.5 py-1 text-xs border border-slate-200 rounded text-center"
                                              title="Min Temp"
                                            />
                                            <span className="text-slate-400 text-xs">
                                              -
                                            </span>
                                            <input
                                              type="number"
                                              placeholder="Max"
                                              value={range.max}
                                              onChange={(e) => {
                                                const val = parseFloat(
                                                  e.target.value
                                                );
                                                updateWeatherRange(
                                                  tool.type,
                                                  range.id,
                                                  {
                                                    max: isNaN(val) ? 0 : val,
                                                  }
                                                );
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
                                                const val = parseFloat(
                                                  e.target.value
                                                );
                                                updateWeatherRange(
                                                  tool.type,
                                                  range.id,
                                                  {
                                                    min: isNaN(val) ? 0 : val,
                                                  }
                                                );
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
                                                const val = parseFloat(
                                                  e.target.value
                                                );
                                                updateWeatherRange(
                                                  tool.type,
                                                  range.id,
                                                  {
                                                    max: isNaN(val) ? 0 : val,
                                                  }
                                                );
                                              }}
                                              className="w-14 px-1.5 py-1 text-xs border border-slate-200 rounded text-center"
                                            />
                                          </div>
                                        )}

                                        <div className="flex-1" />
                                        <button
                                          onClick={() =>
                                            removeWeatherRange(
                                              tool.type,
                                              range.id
                                            )
                                          }
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
                                          updateWeatherRange(
                                            tool.type,
                                            range.id,
                                            {
                                              message: e.target.value,
                                            }
                                          )
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
                                                updateWeatherRange(
                                                  tool.type,
                                                  range.id,
                                                  {
                                                    imageUrl: undefined,
                                                  }
                                                )
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
                                                const file =
                                                  e.target.files?.[0];
                                                if (file) {
                                                  void handleWeatherImageUpload(
                                                    tool.type,
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
                                  )
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {tool.type === 'instructionalRoutines' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <label className="text-xxs font-bold text-slate-500 uppercase">
                          Global Library
                        </label>
                        <button
                          onClick={() =>
                            setEditingRoutine({
                              id: crypto.randomUUID(),
                              name: '',
                              grades: 'Universal',
                              gradeLevels: ['k-2', '3-5', '6-8', '9-12'],
                              icon: 'Zap',
                              color: 'blue',
                              steps: [
                                {
                                  text: '',
                                  icon: 'Zap',
                                  color: 'blue',
                                  label: 'Step',
                                },
                              ],
                            })
                          }
                          className="text-xxs font-bold text-brand-blue-primary hover:text-brand-blue-dark flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> New Routine
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar p-1">
                        {routines.map((routine) => (
                          <div
                            key={routine.id}
                            className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between group hover:border-brand-blue-light transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`p-1.5 rounded-md ${getRoutineColorClasses(routine.color || 'blue').bg} ${getRoutineColorClasses(routine.color || 'blue').text}`}
                              >
                                <div className="w-3 h-3 rounded-full bg-current opacity-50" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700 leading-tight">
                                  {routine.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium uppercase">
                                  {routine.grades}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditingRoutine(routine)}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                title="Edit Routine"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm({
                                    routineId: routine.id,
                                    routineName: routine.name,
                                  });
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete Routine"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!['lunchCount', 'weather', 'instructionalRoutines'].includes(
                    tool.type
                  ) && (
                    <p className="text-xs text-slate-500 italic">
                      No additional configuration available for this widget.
                    </p>
                  )}
                </div>
              )}

              {/* Enabled Toggle */}
              <div className="flex items-center justify-between mb-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">
                  Feature Enabled
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permission.enabled}
                    onChange={(e) =>
                      updatePermission(tool.type, {
                        enabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue-lighter rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue-primary"></div>
                </label>
              </div>

              {/* Access Level */}
              <div className="mb-3">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Access Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'beta', 'public'] as AccessLevel[]).map(
                    (level) => (
                      <button
                        key={level}
                        onClick={() =>
                          updatePermission(tool.type, { accessLevel: level })
                        }
                        className={`px-3 py-2 rounded-lg border-2 text-sm font-medium flex items-center justify-center gap-1 transition-all ${
                          permission.accessLevel === level
                            ? getAccessLevelColor(level)
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {getAccessLevelIcon(level)}
                        <span className="capitalize">{level}</span>
                      </button>
                    )
                  )}
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
                        onClick={() => toggleGradeLevel(tool.type, level)}
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
                    onClick={() => toggleAllGradeLevels(tool.type)}
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
                          onClick={() => removeBetaUser(tool.type, email)}
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
                            addBetaUser(
                              tool.type,
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
                          addBetaUser(tool.type, input.value);
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

              {/* Save Button */}
              <button
                onClick={() => savePermission(tool.type)}
                disabled={isSaving}
                className={`w-full px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  unsavedChanges.has(tool.type)
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-brand-blue-primary hover:bg-brand-blue-dark text-white'
                }`}
              >
                <Save className="w-4 h-4" />
                {isSaving
                  ? 'Saving...'
                  : unsavedChanges.has(tool.type)
                    ? 'Save Changes'
                    : 'Save Permissions'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Instructional Routines Library Modal */}
      {isRoutinesLibraryOpen && (
        <div className="fixed inset-0 z-modal-nested bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">
                Instructional Routines Library
              </h3>
              <button
                onClick={() => setIsRoutinesLibraryOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium">
                    Manage global templates available to all teachers.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setEditingRoutine({
                      id: crypto.randomUUID(),
                      name: '',
                      grades: 'Universal',
                      gradeLevels: ['k-2', '3-5', '6-8', '9-12'],
                      icon: 'Zap',
                      color: 'blue',
                      steps: [
                        {
                          text: '',
                          icon: 'Zap',
                          color: 'blue',
                          label: 'Step',
                        },
                      ],
                    })
                  }
                  className="px-4 py-2 bg-brand-blue-primary text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-brand-blue-dark transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> New Routine
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {routines.map((routine) => {
                  const colorClasses = getRoutineColorClasses(
                    routine.color || 'blue'
                  );
                  return (
                    <div
                      key={routine.id}
                      className="bg-white border-2 border-slate-200 rounded-2xl p-4 flex items-center justify-between group hover:border-brand-blue-light transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-xl ${colorClasses.bg} ${colorClasses.text}`}
                        >
                          <div className="w-6 h-6 flex items-center justify-center">
                            {/* Generic icon since dynamic lucide loading is complex here */}
                            <div className="w-4 h-4 rounded-full bg-current opacity-50" />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 leading-tight">
                            {routine.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
                            {routine.grades}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => setEditingRoutine(routine)}
                          className="p-2 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-brand-blue-primary transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                          title="Edit Routine"
                        >
                          <Edit size={16} />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              routineId: routine.id,
                              routineName: routine.name,
                            });
                          }}
                          className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                          title="Delete Routine"
                        >
                          <Trash2 size={16} />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {routines.length === 0 && (
                  <div className="py-12 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                    <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-black uppercase tracking-widest text-xs">
                      No routines in library
                    </p>
                    <p className="text-xs mt-1">
                      Create your first routine template to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Routine Editor Modal */}
      {editingRoutine && (
        <div className="fixed inset-0 z-modal-deep bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <LibraryManager
              routine={editingRoutine}
              onChange={setEditingRoutine}
              onSave={async () => {
                await saveRoutine(editingRoutine);
                setEditingRoutine(null);
                showMessage('success', 'Routine saved to library');
              }}
              onCancel={() => setEditingRoutine(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Routine"
          message={`Are you sure you want to delete "${deleteConfirm.routineName}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={async () => {
            try {
              await deleteRoutine(deleteConfirm.routineId);
              showMessage('success', 'Routine deleted successfully');
            } catch (error) {
              console.error('Failed to delete routine:', error);
              showMessage(
                'error',
                'Failed to delete routine. Please try again.'
              );
            } finally {
              setDeleteConfirm(null);
            }
          }}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};
