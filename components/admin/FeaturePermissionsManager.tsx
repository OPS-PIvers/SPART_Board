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
  CatalystGlobalConfig,
  FeaturePermission,
  AccessLevel,
  WidgetType,
  GradeLevel,
  InternalToolType,
  LunchCountGlobalConfig,
  WeatherGlobalConfig,
  WebcamGlobalConfig,
} from '../../types';
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
} from 'lucide-react';
import { CatalystPermissionEditor } from './CatalystPermissionEditor';
import { Toggle } from '../common/Toggle';
import { LunchCountConfig } from './permissions/LunchCountConfig';
import { WeatherConfig } from './permissions/WeatherConfig';
import { WebcamConfig } from './permissions/WebcamConfig';
import { InstructionalRoutinesManager } from './permissions/InstructionalRoutinesManager';

// Helper type guard
const isCatalystConfig = (config: unknown): config is CatalystGlobalConfig => {
  return typeof config === 'object' && config !== null;
};

export const FeaturePermissionsManager: React.FC = () => {
  const [permissions, setPermissions] = useState<
    Map<WidgetType | InternalToolType, FeaturePermission>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<WidgetType | InternalToolType>>(
    new Set()
  );
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<
    Set<WidgetType | InternalToolType>
  >(new Set());
  const [editingConfig, setEditingConfig] = useState<
    WidgetType | InternalToolType | null
  >(null);
  const [isRoutinesLibraryOpen, setIsRoutinesLibraryOpen] = useState(false);

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
      const permMap = new Map<
        WidgetType | InternalToolType,
        FeaturePermission
      >();

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

  const getPermission = (
    widgetType: WidgetType | InternalToolType
  ): FeaturePermission => {
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
    widgetType: WidgetType | InternalToolType,
    updates: Partial<FeaturePermission>
  ) => {
    const current = getPermission(widgetType);
    const updated = { ...current, ...updates };
    setPermissions(new Map(permissions).set(widgetType, updated));
    // Mark as having unsaved changes
    setUnsavedChanges(new Set(unsavedChanges).add(widgetType));
  };

  const savePermission = async (widgetType: WidgetType | InternalToolType) => {
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

  const deletePermission = async (
    widgetType: WidgetType | InternalToolType
  ) => {
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

  const addBetaUser = (
    widgetType: WidgetType | InternalToolType,
    email: string
  ) => {
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

  const removeBetaUser = (
    widgetType: WidgetType | InternalToolType,
    email: string
  ) => {
    const permission = getPermission(widgetType);
    updatePermission(widgetType, {
      betaUsers: permission.betaUsers.filter((e) => e !== email),
    });
  };

  const toggleGradeLevel = (
    widgetType: WidgetType | InternalToolType,
    level: GradeLevel
  ) => {
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

  const toggleAllGradeLevels = (widgetType: WidgetType | InternalToolType) => {
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
                    <LunchCountConfig
                      config={
                        (permission.config ?? {}) as LunchCountGlobalConfig
                      }
                      onChange={(newConfig) =>
                        updatePermission(tool.type, {
                          config: newConfig as unknown as Record<
                            string,
                            unknown
                          >,
                        })
                      }
                    />
                  )}

                  {tool.type === 'weather' && (
                    <WeatherConfig
                      config={
                        (permission.config ?? {
                          fetchingStrategy: 'client',
                          updateFrequencyMinutes: 15,
                          temperatureRanges: [],
                        }) as unknown as WeatherGlobalConfig
                      }
                      onChange={(newConfig) =>
                        updatePermission(tool.type, {
                          config: newConfig as unknown as Record<
                            string,
                            unknown
                          >,
                        })
                      }
                      onShowMessage={showMessage}
                    />
                  )}

                  {tool.type === 'webcam' && (
                    <WebcamConfig
                      config={
                        (permission.config ??
                          {}) as unknown as WebcamGlobalConfig
                      }
                      onChange={(newConfig) =>
                        updatePermission(tool.type, {
                          config: newConfig as unknown as Record<
                            string,
                            unknown
                          >,
                        })
                      }
                    />
                  )}

                  {tool.type === 'catalyst' && (
                    <div className="space-y-4">
                      <CatalystPermissionEditor
                        config={
                          isCatalystConfig(permission.config)
                            ? permission.config
                            : {}
                        }
                        onChange={(newConfig) =>
                          updatePermission(tool.type, {
                            config: newConfig as unknown as Record<
                              string,
                              unknown
                            >,
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
              )}

              {/* Enabled Toggle */}
              <div className="flex items-center justify-between mb-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">
                  Feature Enabled
                </span>
                <Toggle
                  checked={permission.enabled}
                  onChange={(checked) =>
                    updatePermission(tool.type, {
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

      <InstructionalRoutinesManager
        isOpen={isRoutinesLibraryOpen}
        onClose={() => setIsRoutinesLibraryOpen(false)}
        onShowMessage={showMessage}
      />
    </div>
  );
};
