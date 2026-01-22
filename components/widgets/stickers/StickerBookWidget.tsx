import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Trash2, Loader2, Eraser, MousePointer2 } from 'lucide-react';
import { WidgetData, StickerBookConfig } from '@/types';
import { trimImageWhitespace, removeBackground } from '@/utils/imageProcessing';
import { useDashboard } from '@/context/useDashboard';
import { useStorage } from '@/hooks/useStorage';

const DEFAULT_STICKERS = [
  // Star
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FFD700" stroke="%23B8860B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  // Heart
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23FF69B4" stroke="%23C71585" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  // Check
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2322c55e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  // Smile
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23fbbf24" stroke="%23d97706" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
  // 100
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><text y="40" font-family="sans-serif" font-size="40" font-weight="bold" fill="%23ef4444" text-decoration="underline">100</text></svg>`,
  // Great Job
  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 50"><rect width="200" height="50" rx="10" fill="%233b82f6"/><text x="100" y="35" font-family="sans-serif" font-size="30" font-weight="bold" fill="white" text-anchor="middle">GREAT JOB!</text></svg>`,
];

export const StickerBookWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, clearAllStickers } = useDashboard();
  const { uploadFile, uploading: storageUploading } = useStorage();
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploading = storageUploading || processing;
  const config = widget.config as StickerBookConfig;
  const customStickers = React.useMemo(
    () => config.uploadedUrls ?? [],
    [config.uploadedUrls]
  );

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;

      setProcessing(true);
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Remove background and trim whitespace
        const noBg = await removeBackground(dataUrl);
        const trimmed = await trimImageWhitespace(noBg);

        // Convert back to Blob for upload
        const response = await fetch(trimmed);
        const blob = await response.blob();
        const processedFile = new File(
          [blob],
          file.name.replace(/\.[^/.]+$/, '') + '.png',
          { type: 'image/png' }
        );

        const url = (await uploadFile(
          `stickers/${Date.now()}_${processedFile.name}`,
          processedFile
        )) as string | null;

        if (url) {
          updateWidget(widget.id, {
            config: {
              ...config,
              uploadedUrls: [...customStickers, url],
            },
          });
        }
      } catch (err) {
        console.error('Failed to process/upload sticker:', err);
      } finally {
        setProcessing(false);
      }
    },
    [config, customStickers, updateWidget, uploadFile, widget.id]
  );

  // Handle global paste events when this widget is mounted
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            // Create a pseudo-filename if it's from a screenshot
            const namedFile = new File(
              [file],
              `pasted-image-${Date.now()}.png`,
              { type: file.type }
            );
            void processFile(namedFile);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [processFile]);

  const handleDragStart = (e: React.DragEvent, url: string) => {
    const img = e.currentTarget.querySelector('img');
    const ratio = img ? img.naturalWidth / img.naturalHeight : 1;
    e.dataTransfer.setData(
      'application/sticker',
      JSON.stringify({ url, ratio })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const removeCustomSticker = (index: number) => {
    const next = [...customStickers];
    next.splice(index, 1);
    updateWidget(widget.id, {
      config: { ...config, uploadedUrls: next },
    });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <span className="text-slate-700">Sticker Collection</span>
        <div className="flex gap-2">
          <button
            onClick={clearAllStickers}
            className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2.5 py-1.5 rounded-full hover:bg-red-100 transition-colors uppercase font-bold tracking-wider"
            title="Clear all stickers from board"
          >
            <Eraser size={12} />
            Clear Board
          </button>
          <label
            className={`flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs cursor-pointer hover:bg-blue-100 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} />
            )}
            {uploading ? 'Processing...' : 'Upload'}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Drop/Paste Zone - Integrated and obvious */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`mb-6 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-2 transition-all hover:bg-blue-50 hover:border-blue-200 group ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          ) : (
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-slate-500 group-hover:text-blue-600 tracking-tight">
                  Click, Drag, or Paste
                </p>
                <p className="text-[9px] text-slate-400">
                  to add custom stickers
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Defaults */}
        <div className="mb-6">
          <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">
            Essentials
          </h4>
          <div className="grid grid-cols-4 gap-4">
            {DEFAULT_STICKERS.map((url, i) => (
              <div
                key={i}
                draggable
                data-no-drag="true"
                onDragStart={(e) => handleDragStart(e, url)}
                className="aspect-square flex items-center justify-center bg-slate-50 rounded-xl hover:bg-blue-50 hover:scale-110 transition-all cursor-grab active:cursor-grabbing border border-transparent hover:border-blue-200"
              >
                <img
                  src={url}
                  alt="Sticker"
                  className="w-12 h-12 object-contain pointer-events-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Custom */}
        {customStickers.length > 0 && (
          <div>
            <h4 className="text-xs text-slate-400 uppercase tracking-wider mb-3">
              My Stickers
            </h4>
            <div className="grid grid-cols-4 gap-4">
              {customStickers.map((url, i) => (
                <div
                  key={i}
                  draggable
                  data-no-drag="true"
                  onDragStart={(e) => handleDragStart(e, url)}
                  className="group relative aspect-square flex items-center justify-center bg-slate-50 rounded-xl hover:bg-blue-50 transition-all cursor-grab active:cursor-grabbing border border-transparent hover:border-blue-200"
                >
                  <img
                    src={url}
                    alt="Custom Sticker"
                    className="w-full h-full object-contain p-2 pointer-events-none"
                  />
                  <button
                    onClick={() => removeCustomSticker(i)}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                    title="Delete Sticker"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-slate-50 border-t flex items-center gap-2">
        <MousePointer2 size={12} className="text-slate-400" />
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center flex-1">
          Drag stickers from library to the board
        </span>
      </div>
    </div>
  );
};
