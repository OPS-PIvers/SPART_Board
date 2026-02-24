import React, { useState, useRef } from 'react';
import { Upload, Loader2, Grid } from 'lucide-react';
import { useBackgrounds } from '../../../hooks/useBackgrounds';
import { useStorage } from '../../../hooks/useStorage';
import { useAuth } from '../../../context/useAuth';
import { useDashboard } from '../../../context/useDashboard';

interface SidebarBackgroundsProps {
  isVisible: boolean;
}

export const SidebarBackgrounds: React.FC<SidebarBackgroundsProps> = ({
  isVisible,
}) => {
  const { presets, colors, gradients } = useBackgrounds();
  const { uploadBackgroundImage } = useStorage();
  const { user } = useAuth();
  const { activeDashboard, setBackground, addToast } = useDashboard();

  const [designTab, setDesignTab] = useState<
    'presets' | 'colors' | 'gradients'
  >('presets');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Image too large (Max 5MB)', 'error');
      return;
    }

    setUploading(true);
    try {
      const downloadURL = await uploadBackgroundImage(user.uid, file);
      setBackground(downloadURL);
      addToast('Custom background uploaded to cloud', 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      const message = error instanceof Error ? error.message : 'Upload failed';
      addToast(message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`absolute inset-0 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
        isVisible
          ? 'translate-x-0 opacity-100 visible'
          : 'translate-x-full opacity-0 invisible'
      }`}
    >
      <div className="flex bg-slate-100 p-0.5 rounded-lg text-xxs font-bold uppercase tracking-widest">
        <button
          onClick={() => setDesignTab('presets')}
          className={`flex-1 py-1.5 rounded-md transition-all ${
            designTab === 'presets'
              ? 'bg-white shadow-sm text-brand-blue-primary'
              : 'text-slate-500'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setDesignTab('colors')}
          className={`flex-1 py-1.5 rounded-md transition-all ${
            designTab === 'colors'
              ? 'bg-white shadow-sm text-brand-blue-primary'
              : 'text-slate-500'
          }`}
        >
          Colors
        </button>
        <button
          onClick={() => setDesignTab('gradients')}
          className={`flex-1 py-1.5 rounded-md transition-all ${
            designTab === 'gradients'
              ? 'bg-white shadow-sm text-brand-blue-primary'
              : 'text-slate-500'
          }`}
        >
          Gradients
        </button>
      </div>

      {designTab === 'presets' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-video rounded-lg border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-brand-blue-primary hover:text-brand-blue-primary hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5 mb-1" />
                <span className="text-xxs font-bold uppercase">Upload</span>
              </>
            )}
          </button>
          {presets.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setBackground(bg.id)}
              className={`group relative aspect-video rounded-lg overflow-hidden border transition-all ${
                activeDashboard?.background === bg.id
                  ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter'
                  : 'border-slate-200'
              }`}
            >
              <img
                src={bg.thumbnailUrl ?? bg.id}
                alt={bg.label}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xxxs font-bold uppercase px-1 text-center">
                  {bg.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {designTab === 'colors' && (
        <div className="grid grid-cols-3 gap-2">
          {colors.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setBackground(bg.id)}
              className={`aspect-square rounded-lg border transition-all relative ${bg.id} ${
                activeDashboard?.background === bg.id
                  ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter'
                  : 'border-slate-200'
              }`}
            >
              {bg.label === 'Dot Grid' && (
                <Grid className="w-4 h-4 absolute inset-0 m-auto text-slate-300" />
              )}
            </button>
          ))}
        </div>
      )}

      {designTab === 'gradients' && (
        <div className="grid grid-cols-2 gap-2">
          {gradients.map((bg) => (
            <button
              key={bg.id}
              onClick={() => setBackground(bg.id)}
              className={`aspect-video rounded-lg border transition-all relative ${
                activeDashboard?.background === bg.id
                  ? 'border-brand-blue-primary ring-2 ring-brand-blue-lighter'
                  : 'border-slate-200'
              }`}
            >
              <div className={`w-full h-full rounded-md ${bg.id}`} />
              <div className="absolute bottom-1.5 left-1.5 text-xxxs font-bold uppercase text-white drop-shadow-md">
                {bg.label}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => void handleFileUpload(e)}
      />
    </div>
  );
};
