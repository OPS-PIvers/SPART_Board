import React, { useState, useCallback } from 'react';
import { Upload, Trash2, Loader2 } from 'lucide-react';
import { WidgetData } from '../../../types';
import {
  trimImageWhitespace,
  removeBackground,
} from '../../../utils/imageProcessing';

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
  widget: _widget,
}) => {
  const [customStickers, setCustomStickers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_stickers');
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        try {
          // Remove background first (simple corner flood fill), then trim
          const noBg = await removeBackground(result);
          const trimmed = await trimImageWhitespace(noBg);
          setCustomStickers((prev) => {
            const next = [...prev, trimmed];
            localStorage.setItem('custom_stickers', JSON.stringify(next));
            return next;
          });
        } catch (err) {
          console.error(err);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  }, []);

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
    const next = customStickers.filter((_, i) => i !== index);
    setCustomStickers(next);
    localStorage.setItem('custom_stickers', JSON.stringify(next));
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <span className="font-bold text-slate-700">Sticker Collection</span>
        <label
          className={`flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold cursor-pointer hover:bg-blue-100 transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Upload size={14} />
          {isProcessing ? 'Processing...' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={isProcessing}
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Defaults */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Essentials
          </h4>
          <div className="grid grid-cols-4 gap-4">
            {DEFAULT_STICKERS.map((url, i) => (
              <div
                key={i}
                draggable
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
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              My Stickers
            </h4>
            <div className="grid grid-cols-4 gap-4">
              {customStickers.map((url, i) => (
                <div
                  key={i}
                  draggable
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

        {customStickers.length === 0 && (
          <label
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={isProcessing}
            />
            {isProcessing ? (
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-slate-300" />
            )}
            <p className="text-slate-400 text-sm font-bold uppercase tracking-tight">
              {isProcessing
                ? 'Processing...'
                : 'Upload or drag images to create custom stickers!'}
            </p>
          </label>
        )}
      </div>
    </div>
  );
};
