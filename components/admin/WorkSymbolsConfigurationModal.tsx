import React, { useCallback, useRef, useState } from 'react';
import {
  X,
  Upload,
  Trash2,
  Loader2,
  Save,
  Image as ImageIcon,
} from 'lucide-react';
import { BUILDINGS } from '@/config/buildings';
import {
  FeaturePermission,
  WorkSymbol,
  WorkSymbolsGlobalConfig,
  WorkSymbolsBuildingConfig,
} from '@/types';
import { useStorage } from '@/hooks/useStorage';
import { Toast } from '../common/Toast';
import { Button } from '../common/Button';

interface WorkSymbolsConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission: FeaturePermission;
  onSave: (updates: Partial<FeaturePermission>) => void;
}

const normalizeConfig = (raw: unknown): WorkSymbolsGlobalConfig => {
  const config = raw as WorkSymbolsGlobalConfig | undefined;
  return { buildings: config?.buildings ?? {} };
};

export const WorkSymbolsConfigurationModal: React.FC<
  WorkSymbolsConfigurationModalProps
> = ({ isOpen, onClose, permission, onSave }) => {
  const [selectedBuilding, setSelectedBuilding] = useState(
    BUILDINGS.length > 0 ? BUILDINGS[0].id : ''
  );
  const [globalConfig, setGlobalConfig] = useState<WorkSymbolsGlobalConfig>(
    () => normalizeConfig(permission.config)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedThisSessionRef = useRef<Set<string>>(new Set());

  const { uploadAdminWorkSymbol, deleteFile } = useStorage();

  // Sync state if permission.config changes externally
  const [prevConfig, setPrevConfig] = useState(permission.config);
  if (permission.config !== prevConfig) {
    setPrevConfig(permission.config);
    setGlobalConfig(normalizeConfig(permission.config));
  }

  const getBuildingConfig = useCallback(
    (buildingId: string): WorkSymbolsBuildingConfig => {
      return globalConfig.buildings[buildingId] ?? { symbols: [] };
    },
    [globalConfig]
  );

  const setBuildingSymbols = useCallback(
    (buildingId: string, symbols: WorkSymbol[]) => {
      setGlobalConfig((prev) => ({
        ...prev,
        buildings: {
          ...prev.buildings,
          [buildingId]: { symbols },
        },
      }));
    },
    []
  );

  const currentSymbols = getBuildingConfig(selectedBuilding).symbols;

  // --- Upload ---
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (!fileArray.length) return;

      setUploading(true);
      const newSymbols: WorkSymbol[] = [];
      for (const file of fileArray) {
        try {
          const url = await uploadAdminWorkSymbol(file);
          if (url) {
            uploadedThisSessionRef.current.add(url);
            newSymbols.push({
              id: crypto.randomUUID(),
              title: file.name.replace(/\.[^.]+$/, ''),
              imageUrl: url,
            });
          }
        } catch (e) {
          console.error('Failed to upload work symbol:', e);
        }
      }
      if (newSymbols.length > 0) {
        setBuildingSymbols(selectedBuilding, [
          ...currentSymbols,
          ...newSymbols,
        ]);
      }
      setUploading(false);
    },
    [
      currentSymbols,
      selectedBuilding,
      setBuildingSymbols,
      uploadAdminWorkSymbol,
    ]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      void handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void handleFiles(e.dataTransfer.files);
  };

  const removeSymbol = (symbol: WorkSymbol) => {
    if (uploadedThisSessionRef.current.has(symbol.imageUrl)) {
      uploadedThisSessionRef.current.delete(symbol.imageUrl);
      void deleteFile(symbol.imageUrl);
    }
    setBuildingSymbols(
      selectedBuilding,
      currentSymbols.filter((s) => s.id !== symbol.id)
    );
  };

  const updateSymbolTitle = (symbolId: string, title: string) => {
    setBuildingSymbols(
      selectedBuilding,
      currentSymbols.map((s) => (s.id === symbolId ? { ...s, title } : s))
    );
  };

  // --- Save / Close ---
  const handleSave = () => {
    setIsSaving(true);
    try {
      onSave({
        config: globalConfig as unknown as Record<string, unknown>,
      });
      uploadedThisSessionRef.current.clear();
      setToastMessage('Work Symbols configuration saved');
      onClose();
    } catch (error) {
      console.error('Error saving config:', error);
      setToastMessage('Error saving configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Clean up any uploads from this session that weren't saved
    for (const url of uploadedThisSessionRef.current) {
      void deleteFile(url);
    }
    uploadedThisSessionRef.current.clear();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal-nested bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Work Symbols</h2>
              <p className="text-xs text-slate-500">
                Upload images for work-time expectations
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Building Selector */}
        {BUILDINGS.length > 1 && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex gap-2 flex-wrap">
              {BUILDINGS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBuilding(b.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedBuilding === b.id
                      ? 'bg-violet-100 text-violet-700 border border-violet-200'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {/* Symbol Grid */}
          {currentSymbols.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {currentSymbols.map((symbol) => (
                <div
                  key={symbol.id}
                  className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50"
                >
                  <div className="aspect-square p-2">
                    <img
                      src={symbol.imageUrl}
                      alt={symbol.title}
                      className="w-full h-full object-contain rounded-lg"
                      loading="lazy"
                    />
                  </div>
                  <div className="px-2 pb-2">
                    <input
                      type="text"
                      value={symbol.title}
                      onChange={(e) =>
                        updateSymbolTitle(symbol.id, e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-400 focus:outline-none"
                      placeholder="Symbol title..."
                    />
                  </div>
                  <button
                    onClick={() => removeSymbol(symbol)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 rounded-lg shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
              isDragging
                ? 'border-violet-400 bg-violet-50'
                : 'border-slate-300 hover:border-violet-300 hover:bg-violet-50/50'
            }`}
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-slate-400" />
            )}
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                {uploading
                  ? 'Uploading...'
                  : 'Drop images here or click to upload'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, or WebP images
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
            icon={<Save className="w-4 h-4" />}
          >
            Save
          </Button>
        </div>
      </div>

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
