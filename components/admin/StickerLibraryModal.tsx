import React, { useCallback, useRef, useState } from 'react';
import {
  X,
  Upload,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Save,
} from 'lucide-react';
import { useStorage } from '../../hooks/useStorage';

interface StickerLibraryModalProps {
  stickers: string[];
  onClose: () => void;
  onStickersChange: (stickers: string[]) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export const StickerLibraryModal: React.FC<StickerLibraryModalProps> = ({
  stickers,
  onClose,
  onStickersChange,
  onSave,
  isSaving,
  hasUnsavedChanges,
}) => {
  const { uploadAdminSticker, uploading } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (!fileArray.length) return;

      const newUrls: string[] = [];
      for (const file of fileArray) {
        try {
          const url = await uploadAdminSticker(file);
          newUrls.push(url);
        } catch (e) {
          console.error('Failed to upload sticker:', e);
        }
      }
      if (newUrls.length > 0) {
        onStickersChange([...stickers, ...newUrls]);
      }
    },
    [stickers, onStickersChange, uploadAdminSticker]
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

  const removeSticker = (url: string) => {
    onStickersChange(stickers.filter((s) => s !== url));
  };

  return (
    <div className="fixed inset-0 z-modal-nested bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">
            Global Sticker Library
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void onSave()}
              disabled={isSaving || !hasUnsavedChanges}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                hasUnsavedChanges
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                  : 'bg-brand-blue-primary hover:bg-brand-blue-dark text-white'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving
                ? 'Saving...'
                : hasUnsavedChanges
                  ? 'Save Changes'
                  : 'Saved'}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 custom-scrollbar">
          <p className="text-sm text-slate-500 font-medium mb-4">
            Stickers uploaded here appear in the{' '}
            <strong className="text-slate-700">Global Collection</strong>{' '}
            section of every user&apos;s Sticker Book widget.
          </p>

          {/* Upload zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all mb-6 p-8 gap-3 ${
              isDragging
                ? 'border-brand-blue-primary bg-brand-blue-lighter/20'
                : 'border-slate-300 bg-white hover:border-brand-blue-light hover:bg-slate-50'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-brand-blue-primary animate-spin" />
                <p className="text-sm font-bold text-slate-500">Uploading...</p>
              </>
            ) : (
              <>
                <div className="p-3 bg-slate-100 rounded-xl">
                  <Upload className="w-6 h-6 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-slate-600 uppercase tracking-tight">
                    Drop images here or click to browse
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    PNG, JPG, GIF, WebP, SVG · Multiple files supported
                  </p>
                </div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
              disabled={uploading}
            />
          </div>

          {/* Sticker grid */}
          {stickers.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
              <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-black uppercase tracking-widest text-xs">
                No global stickers yet
              </p>
              <p className="text-xs mt-1">
                Upload stickers above to make them available to all users.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
              {stickers.map((url, i) => (
                <div
                  key={i}
                  className="group relative aspect-square bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center justify-center overflow-visible"
                >
                  <img
                    src={url}
                    alt="Global sticker"
                    className="w-full h-full object-contain p-2 pointer-events-none rounded-2xl"
                  />
                  <button
                    onClick={() => removeSticker(url)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 scale-75 group-hover:scale-100 z-10 p-1"
                    title="Remove from global library"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
