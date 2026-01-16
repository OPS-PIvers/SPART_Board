import React, { useRef } from 'react';
import { useDashboard } from '@/context/useDashboard';
import { useStorage } from '@/hooks/useStorage';
import { WidgetData, StickerLibraryConfig } from '@/types';
import { Plus, Trash2, Eraser, Loader2 } from 'lucide-react';

interface Props {
  widget: WidgetData;
}

export const StickerLibraryWidget: React.FC<Props> = ({ widget }) => {
  const { updateWidget, addWidget, clearAllStickers } = useDashboard();
  const { uploadFile, uploading } = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (widget.type !== 'sticker-library') {
    return null;
  }

  // Explicitly cast the config for type safety
  const config = widget.config as StickerLibraryConfig;
  const urls = config.uploadedUrls || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !widget.id) return;

    const url = (await uploadFile(
      `stickers/${Date.now()}_${file.name}`,
      file
    )) as string | null;
    if (url) {
      updateWidget(widget.id, {
        config: { ...config, uploadedUrls: [...urls, url] },
      });
    }
  };

  const placeSticker = (url: string) => {
    addWidget(
      'sticker',
      {
        url: url,
        size: 150,
      },
      { x: 100, y: 100, w: 150, h: 150 }
    );
  };

  const removeStickerFromLibrary = (index: number) => {
    const currentUrls = config.uploadedUrls || [];

    const newUrls = [...currentUrls];
    newUrls.splice(index, 1);
    updateWidget(widget.id, {
      config: { ...config, uploadedUrls: newUrls },
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border">
      <div className="p-2 bg-slate-50 border-b flex justify-between items-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
          Upload
        </button>
        <button
          onClick={clearAllStickers}
          className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors"
        >
          <Eraser className="w-3 h-3" />
          Clear Board
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
          accept="image/*"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-3">
        {urls.map((url, i) => (
          <div
            key={i}
            className="group relative aspect-square bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-400 transition-all cursor-pointer overflow-hidden"
          >
            <img
              src={url}
              alt="Sticker"
              className="w-full h-full object-contain p-2"
              onClick={() => placeSticker(url)}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeStickerFromLibrary(i);
              }}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {urls.length === 0 && (
          <div className="col-span-3 text-center py-10 text-slate-400 text-xs italic">
            No stickers uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
};
