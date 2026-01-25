import React, { useState, useEffect, useCallback } from 'react';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  AccessLevel,
  GlobalFeature,
  GlobalFeaturePermission,
} from '../../types';
import {
  Shield,
  Users,
  Globe,
  Save,
  AlertCircle,
  Plus,
  Trash2,
  Zap,
  Cast,
  Share2,
  Download,
} from 'lucide-react';
import { Toggle } from '../common/Toggle';

const GLOBAL_FEATURES: {
  id: GlobalFeature;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: 'gemini-functions',
    label: 'Gemini AI Functions',
    icon: Zap,
    description: 'AI-powered mini-app generation, poll generation, and more.',
  },
  {
    id: 'live-session',
    label: 'Live Sessions',
    icon: Cast,
    description: 'Ability to host live sessions and sync with students.',
  },
  {
    id: 'dashboard-sharing',
    label: 'Board Sharing',
    icon: Share2,
    description: 'Generate shareable links for dashboards.',
  },
  {
    id: 'dashboard-import',
    label: 'Board Importing',
    icon: Download,
    description: 'Import dashboards from JSON strings.',
  },
];

export const GlobalPermissionsManager: React.FC = () => {
  const [permissions, setPermissions] = useState<
    Map<string, GlobalFeaturePermission>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    const timeoutId = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'global_permissions'));
      const permMap = new Map<string, GlobalFeaturePermission>();

      snapshot.forEach((doc) => {
        const data = doc.data() as GlobalFeaturePermission;
        permMap.set(data.featureId, data);
      });

      setPermissions(permMap);
    } catch (error) {
      console.error('Error loading global permissions:', error);
      showMessage('error', 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    void loadPermissions();
  }, [loadPermissions]);

  const getPermission = (featureId: GlobalFeature): GlobalFeaturePermission => {
    return (
      permissions.get(featureId) ?? {
        featureId,
        accessLevel: 'public',
        betaUsers: [],
        enabled: true,
        config: featureId === 'gemini-functions' ? { dailyLimit: 20 } : {},
      }
    );
  };

  const updatePermission = (
    featureId: GlobalFeature,
    updates: Partial<GlobalFeaturePermission>
  ) => {
    const current = getPermission(featureId);
    const updated = { ...current, ...updates };
    setPermissions(new Map(permissions).set(featureId, updated));
    setUnsavedChanges(new Set(unsavedChanges).add(featureId));
  };

  const savePermission = async (featureId: GlobalFeature) => {
    try {
      setSaving(new Set(saving).add(featureId));
      const permission = getPermission(featureId);

      await setDoc(doc(db, 'global_permissions', featureId), permission);

      setUnsavedChanges((prev) => {
        const next = new Set(prev);
        next.delete(featureId);
        return next;
      });

      showMessage('success', `Saved ${featureId} settings`);
    } catch (error) {
      console.error('Error saving permission:', error);
      showMessage('error', `Failed to save ${featureId} settings`);
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(featureId);
        return next;
      });
    }
  };

  const addBetaUser = (featureId: GlobalFeature, email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      showMessage('error', 'Please enter a valid email address.');
      return;
    }

    const permission = getPermission(featureId);
    if (!permission.betaUsers.includes(trimmedEmail)) {
      updatePermission(featureId, {
        betaUsers: [...permission.betaUsers, trimmedEmail],
      });
    }
  };

  const removeBetaUser = (featureId: GlobalFeature, email: string) => {
    const permission = getPermission(featureId);
    updatePermission(featureId, {
      betaUsers: permission.betaUsers.filter((e) => e !== email),
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
        <div className="text-slate-600">Loading global settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`fixed top-6 right-6 z-[10001] px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top ${
            message.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {GLOBAL_FEATURES.map((feature) => {
          const permission = getPermission(feature.id);
          const isSaving = saving.has(feature.id);

          return (
            <div
              key={feature.id}
              className="bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-brand-blue-light transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-brand-blue-lighter p-3 rounded-xl text-brand-blue-primary">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-lg">
                    {feature.label}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Enabled Toggle */}
              <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">
                  Feature Enabled
                </span>
                <Toggle
                  checked={permission.enabled}
                  onChange={(checked) =>
                    updatePermission(feature.id, {
                      enabled: checked,
                    })
                  }
                  size="md"
                  activeColor="bg-brand-blue-primary"
                />
              </div>

              {/* Access Level */}
              <div className="mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">
                  Who can access this?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['admin', 'beta', 'public'] as AccessLevel[]).map(
                    (level) => (
                      <button
                        key={level}
                        onClick={() =>
                          updatePermission(feature.id, { accessLevel: level })
                        }
                        className={`px-3 py-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                          permission.accessLevel === level
                            ? getAccessLevelColor(level)
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {getAccessLevelIcon(level)}
                        <span className="capitalize">{level}</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Beta Users */}
              {permission.accessLevel === 'beta' && (
                <div className="mb-6 animate-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">
                    Beta Testers
                  </label>
                  <div className="space-y-2 mb-3">
                    {permission.betaUsers.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-100 rounded-lg group"
                      >
                        <span className="text-xs font-medium text-slate-700">
                          {email}
                        </span>
                        <button
                          onClick={() => removeBetaUser(feature.id, email)}
                          className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="user@example.com"
                      className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-primary"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addBetaUser(
                            feature.id,
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
                        addBetaUser(feature.id, input.value);
                        input.value = '';
                      }}
                      className="p-2.5 bg-brand-blue-primary text-white rounded-xl hover:bg-brand-blue-dark transition-colors shadow-md"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Feature Specific Config (Gemini Limit) */}
              {feature.id === 'gemini-functions' && (
                <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <label className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-2 block">
                    Daily Usage Limit (Standard Users)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={(permission.config?.dailyLimit as number) ?? 20}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        updatePermission(feature.id, {
                          config: {
                            ...permission.config,
                            dailyLimit: isNaN(val) ? 20 : val,
                          },
                        });
                      }}
                      className="w-24 px-3 py-2 border border-purple-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-xs text-purple-600 font-medium">
                      generations per day
                    </span>
                  </div>
                  <p className="text-[10px] text-purple-500 mt-2 leading-tight">
                    Administrators have unlimited usage. Standard users will see
                    a &quot;limit reached&quot; message after this many
                    generations.
                  </p>
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={() => savePermission(feature.id)}
                disabled={isSaving}
                className={`w-full py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm shadow-md disabled:opacity-50 ${
                  unsavedChanges.has(feature.id)
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-brand-blue-primary hover:bg-brand-blue-dark text-white'
                }`}
              >
                {isSaving ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {unsavedChanges.has(feature.id)
                      ? 'Save Changes'
                      : 'Settings Up-to-Date'}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
