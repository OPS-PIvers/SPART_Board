import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { BackgroundPreset, AccessLevel } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { useAuth } from '../../context/useAuth';
import {
  Upload,
  Trash2,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Shield,
  Users,
  Globe,
  Plus,
  Pencil,
  X,
  Check,
} from 'lucide-react';

export const BackgroundManager: React.FC = () => {
  const [presets, setPresets] = useState<BackgroundPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadBackgroundImage } = useStorage();
  const { user } = useAuth();

  const DEFAULT_PRESETS = [
    {
      url: 'https://images.unsplash.com/photo-1566378246598-5b11a0d486cc?q=80&w=2000',
      label: 'Chalkboard',
    },
    {
      url: 'https://images.unsplash.com/photo-1519750783826-e2420f4d687f?q=80&w=2000',
      label: 'Corkboard',
    },
    {
      url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000',
      label: 'Geometric',
    },
    {
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2000',
      label: 'Nature',
    },
    {
      url: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?q=80&w=2000',
      label: 'Paper',
    },
    {
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000',
      label: 'Tech',
    },
  ];

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    const timeoutId = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  const loadPresets = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'admin_backgrounds'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const loadedPresets: BackgroundPreset[] = [];

      snapshot.forEach((doc) => {
        loadedPresets.push(doc.data() as BackgroundPreset);
      });

      setPresets(loadedPresets);
    } catch (error) {
      console.error('Error loading backgrounds:', error);
      showMessage('error', 'Failed to load backgrounds');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    void loadPresets();
  }, [loadPresets]);

  const restoreDefaults = async () => {
    if (
      !confirm(
        'This will add the 6 stock images to your managed list. Continue?'
      )
    )
      return;

    try {
      setLoading(true);
      for (const item of DEFAULT_PRESETS) {
        // Check if already exists to avoid duplicates
        const exists = presets.some((p) => p.url === item.url);
        if (!exists) {
          const newPreset: BackgroundPreset = {
            id: crypto.randomUUID(),
            url: item.url,
            label: item.label,
            active: true,
            accessLevel: 'public',
            betaUsers: [],
            createdAt: Date.now(),
          };
          await setDoc(doc(db, 'admin_backgrounds', newPreset.id), newPreset);
        }
      }
      void loadPresets();
      showMessage('success', 'Default presets restored');
    } catch (error) {
      console.error('Error restoring defaults:', error);
      showMessage('error', 'Failed to restore defaults');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image too large (Max 5MB)');
      return;
    }

    setUploading(true);
    try {
      // Use the existing storage hook, but we might want a specific folder for admin uploads
      // For now, using the same user-based path is okay, or we could modify useStorage.
      // Actually, useStorage puts it under `backgrounds/${userId}/${file.name}`.
      // This is fine, as long as the URL is accessible.
      const downloadURL = await uploadBackgroundImage(user.uid, file);

      const newPreset: BackgroundPreset = {
        id: crypto.randomUUID(),
        url: downloadURL,
        label: file.name.split('.')[0].replace(/[-_]/g, ' '),
        active: true,
        accessLevel: 'public',
        betaUsers: [],
        createdAt: Date.now(),
      };

      await setDoc(doc(db, 'admin_backgrounds', newPreset.id), newPreset);
      setPresets((prev) => [newPreset, ...prev]);
      showMessage('success', 'Background uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      showMessage('error', 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updatePreset = async (
    id: string,
    updates: Partial<BackgroundPreset>
  ) => {
    try {
      await updateDoc(doc(db, 'admin_backgrounds', id), updates);
      setPresets((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    } catch (error) {
      console.error('Error updating preset:', error);
      showMessage('error', 'Failed to update background');
    }
  };

  const deletePreset = async (id: string) => {
    if (!confirm('Are you sure you want to delete this background?')) return;

    try {
      await deleteDoc(doc(db, 'admin_backgrounds', id));
      setPresets((prev) => prev.filter((p) => p.id !== id));
      showMessage('success', 'Background deleted');
    } catch (error) {
      console.error('Error deleting preset:', error);
      showMessage('error', 'Failed to delete background');
    }
  };

  const addBetaUser = async (presetId: string, email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    if (!preset.betaUsers.includes(trimmedEmail)) {
      const newBetaUsers = [...preset.betaUsers, trimmedEmail];
      await updatePreset(presetId, { betaUsers: newBetaUsers });
    }
  };

  const removeBetaUser = async (presetId: string, email: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    const newBetaUsers = preset.betaUsers.filter((e) => e !== email);
    await updatePreset(presetId, { betaUsers: newBetaUsers });
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
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Message Toast */}
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

      {/* Header Actions */}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-700">
          Managed Backgrounds
        </h3>

        <div className="flex gap-2">
          <button
            onClick={() => void restoreDefaults()}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
            title="Restore original stock images"
          >
            <Plus className="w-4 h-4" />
            Restore Defaults
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Upload New
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => void handleFileUpload(e)}
        />
      </div>

      {/* Grid */}
      <div className="flex-1">
        {presets.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 transition-all flex flex-col h-[360px]"
              >
                {/* Image Preview */}
                <div className="relative h-40 bg-slate-100 group shrink-0">
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1.5 right-1.5 z-10">
                    <button
                      onClick={() => void deletePreset(preset.id)}
                      className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition-all scale-90 hover:scale-100"
                      title="Delete background"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center bg-black/20 backdrop-blur-sm rounded-lg px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Toggle Active */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase text-white">
                        Active
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preset.active}
                          onChange={(e) =>
                            void updatePreset(preset.id, {
                              active: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-6 h-3 bg-white/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="p-3 flex-1 flex flex-col min-h-0">
                  {/* Label Editing */}
                  <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
                    {editingId === preset.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2 py-1 text-xs border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            if (editName.trim()) {
                              void updatePreset(preset.id, {
                                label: editName.trim(),
                              });
                            }
                            setEditingId(null);
                          }}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4
                          className="font-bold text-slate-800 truncate text-sm"
                          title={preset.label}
                        >
                          {preset.label}
                        </h4>
                        <button
                          onClick={() => {
                            setEditingId(preset.id);
                            setEditName(preset.label);
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Access Level */}
                  <div className="mb-3 shrink-0">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block shrink-0">
                      Access Level
                    </label>
                    <div className="flex gap-1">
                      {(['admin', 'beta', 'public'] as AccessLevel[]).map(
                        (level) => (
                          <button
                            key={level}
                            onClick={() =>
                              void updatePreset(preset.id, {
                                accessLevel: level,
                              })
                            }
                            className={`flex-1 py-1 rounded-[4px] text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all ${
                              preset.accessLevel === level
                                ? getAccessLevelColor(level)
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'
                            }`}
                            title={`Set to ${level}`}
                          >
                            {getAccessLevelIcon(level)}
                            <span className="hidden xl:inline">{level}</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Beta Users (only show if access level is beta) */}
                  <div className="flex-1 min-h-0 flex flex-col">
                    {preset.accessLevel === 'beta' && (
                      <div className="flex flex-col h-full">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block shrink-0">
                          Beta Users
                        </label>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 mb-2">
                          {preset.betaUsers.map((email) => (
                            <div
                              key={email}
                              className="flex items-center justify-between p-1 px-1.5 bg-blue-50/50 rounded text-[10px] border border-blue-100/50"
                            >
                              <span className="text-slate-700 truncate mr-2">
                                {email}
                              </span>
                              <button
                                onClick={() =>
                                  void removeBetaUser(preset.id, email)
                                }
                                className="text-red-600 hover:bg-red-100 p-0.5 rounded transition-colors shrink-0"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-1 shrink-0">
                          <input
                            type="email"
                            placeholder="Add email..."
                            className="flex-1 px-2 py-1 border border-slate-200 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                void addBetaUser(
                                  preset.id,
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
                              void addBetaUser(preset.id, input.value);
                              input.value = '';
                            }}
                            className="p-1 px-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
            <p className="font-bold">No managed backgrounds found.</p>
            <p className="text-sm">Upload images to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
