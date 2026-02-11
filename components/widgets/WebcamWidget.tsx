import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  Download,
  Trash2,
  X,
  Grid,
  FileText,
} from 'lucide-react';
import { WidgetData } from '../../types';
import { ScaledEmptyState } from '../common/ScaledEmptyState';

interface CapturedItem {
  id: string;
  timestamp: number;
  dataUrl: string;
  status: 'captured' | 'processing' | 'error';
}

import { WidgetLayout } from './WidgetLayout';

export const WebcamWidget: React.FC<{ widget: WidgetData }> = ({
  widget: _widget,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMirrored, setIsMirrored] = useState(true);
  const [capturedItems, setCapturedItems] = useState<CapturedItem[]>([]);
  const [showGallery, setShowGallery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        currentStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setError(null);
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Could not access webcam');
      }
    }

    void startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const takePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (isMirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const newItem: CapturedItem = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          dataUrl,
          status: 'captured',
        };
        setCapturedItems((prev) => [newItem, ...prev]);
      }
    }
  }, [isMirrored]);

  const toggleMirror = useCallback(() => setIsMirrored((prev) => !prev), []);

  const downloadPhoto = useCallback((dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `photo-${Date.now()}.png`;
    link.click();
  }, []);

  const clearPhotos = useCallback(() => {
    if (confirm('Are you sure you want to delete all photos?')) {
      setCapturedItems([]);
    }
  }, []);

  const deletePhoto = useCallback((id: string) => {
    setCapturedItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div className="relative h-full w-full bg-slate-950 overflow-hidden group">
          {error ? (
            <ScaledEmptyState
              icon={Camera}
              title="Camera Error"
              subtitle={error}
              className="text-white/50"
              action={
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  style={{
                    fontSize: '3cqmin',
                    padding: 'min(8px, 1.5cqmin) min(16px, 3cqmin)',
                  }}
                >
                  Retry Camera
                </button>
              }
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-transform duration-500 ${isMirrored ? 'scale-x-[-1]' : 'scale-x-1'}`}
              />

              {/* Controls Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-2xl p-2 rounded-3xl border border-white/30 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-30">
                <div className="flex items-center gap-1 pr-2 border-r border-white/20">
                  <button
                    onClick={takePhoto}
                    disabled={!stream}
                    className="p-3 hover:bg-white/30 rounded-2xl text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Take Photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <button
                    onClick={toggleMirror}
                    disabled={!stream}
                    className={`p-3 rounded-2xl text-white transition-all ${isMirrored ? 'bg-blue-500/30 text-blue-400' : 'hover:bg-white/30'}`}
                    title="Mirror Camera"
                  >
                    <RefreshCw
                      className={`w-5 h-5 ${isMirrored ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                <button
                  onClick={() => setShowGallery(true)}
                  className="relative p-3 hover:bg-white/30 rounded-2xl text-white"
                  title="View Gallery"
                >
                  <Grid className="w-5 h-5" />
                  {capturedItems.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border border-black" />
                  )}
                </button>
              </div>
            </>
          )}

          {/* Gallery Overlay */}
          {showGallery && (
            <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between p-4 border-b border-white/20 shrink-0">
                <h3 className="text-white  uppercase tracking-widest text-xs">
                  Photo Gallery
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearPhotos}
                    className="p-2 hover:bg-white/30 rounded-lg text-red-400"
                    title="Clear All"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowGallery(false)}
                    className="p-2 hover:bg-white/30 rounded-lg text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto custom-scrollbar flex flex-col"
                style={{
                  padding: 'min(16px, 4cqmin)',
                  gap: 'min(16px, 4cqmin)',
                }}
              >
                {capturedItems.length === 0 ? (
                  <ScaledEmptyState
                    icon={FileText}
                    title="No photos yet"
                    className="text-white/30"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {capturedItems.map((item) => (
                      <div
                        key={item.id}
                        className="group/photo relative aspect-video bg-white/10 rounded-xl overflow-hidden border border-white/20"
                      >
                        <img
                          src={item.dataUrl}
                          alt="Captured"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            onClick={() => downloadPhoto(item.dataUrl)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-all"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePhoto(item.id)}
                            className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full text-red-400 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};

export const WebcamSettings: React.FC<{ widget: WidgetData }> = ({
  widget: _widget,
}) => {
  return (
    <div className="text-slate-500 italic text-sm">
      Camera settings are managed automatically.
    </div>
  );
};
