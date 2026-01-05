import React, { useEffect, useRef, useState } from 'react';
import {
  CameraOff,
  Loader2,
  Camera,
  RefreshCw,
  FileText,
  X,
  Copy,
  Check,
  Trash2,
  List,
  Download,
  CheckCircle,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { WidgetData } from '../../types';
import { GoogleGenAI } from '@google/genai';
import { useDashboard } from '../../context/useDashboard';

interface CapturedItem {
  id: string;
  timestamp: number;
  text: string | null;
  status: 'processing' | 'success' | 'error';
  imageUrl?: string;
}

export const WebcamWidget: React.FC<{ widget: WidgetData }> = ({
  widget: _widget,
}) => {
  const { addToast } = useDashboard();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const [capturedItems, setCapturedItems] = useState<CapturedItem[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const [showFlash, setShowFlash] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      setLoading(true);
      setError(null);
      try {
        if (stream) {
          stream.getTracks().forEach((t) => {
            t.stop();
          });
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: facingMode,
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setLoading(false);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Please check permissions.');
        setLoading(false);
      }
    };

    void startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [facingMode]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Apply mirror if user facing
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleScreenshot = () => {
    const dataUrl = captureFrame();
    if (!dataUrl) return;

    // Visual feedback
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `screenshot-${new Date().getTime()}.jpg`;
    link.click();

    addToast('Screenshot saved!', 'success');
  };

  const handleOCR = async () => {
    const dataUrl = captureFrame();
    if (!dataUrl) return;

    // 1. Immediate Visual Feedback
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);

    // 2. Create and Queue Item
    const newItem: CapturedItem = {
      id: uuidv4(),
      timestamp: Date.now(),
      text: null,
      status: 'processing',
    };

    setCapturedItems((prev) => [newItem, ...prev]);

    // 3. Process asynchronously
    try {
      const ai = new GoogleGenAI({
        apiKey: (import.meta.env.VITE_GEMINI_API_KEY as string) || '',
      });
      const base64Data = dataUrl.split(',')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
            {
              text: "Extract all the text visible in this image. Only return the extracted text, nothing else. If there is no text, say 'No text found'.",
            },
          ],
        },
      });

      const text = response.text ?? 'No text detected.';

      setCapturedItems((prev) =>
        prev.map((item) =>
          item.id === newItem.id ? { ...item, status: 'success', text } : item
        )
      );
    } catch (err) {
      console.error('OCR failed:', err);
      setCapturedItems((prev) =>
        prev.map((item) =>
          item.id === newItem.id
            ? { ...item, status: 'error', text: 'Failed to extract text.' }
            : item
        )
      );
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('Text copied to clipboard', 'success');
  };

  const deleteItem = (id: string) => {
    setCapturedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all items?')) {
      setCapturedItems([]);
    }
  };

  const downloadText = (text: string, timestamp: number) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extracted-text-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center group">
      <canvas ref={canvasRef} className="hidden" />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50 z-10 bg-slate-900">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Waking up lens...
          </span>
        </div>
      )}

      {/* Camera Flash Effect */}
      {showFlash && (
        <div className="absolute inset-0 bg-white z-[30] animate-out fade-out duration-150 pointer-events-none" />
      )}

      {/* Immediate Success Feedback (Green Check) */}
      {showSuccess && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-green-500/90 p-8 rounded-full shadow-2xl animate-in zoom-in duration-300">
            <Check className="w-16 h-16 text-white" strokeWidth={4} />
          </div>
        </div>
      )}

      {error ? (
        <div className="flex flex-col items-center gap-4 text-slate-400 p-8 text-center">
          <CameraOff className="w-12 h-12 opacity-20" />
          <p className="text-xs font-medium leading-relaxed">{error}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />

          {/* Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-2xl p-3 rounded-3xl border border-white/20 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-30">
            <button
              onClick={() =>
                setFacingMode((prev) =>
                  prev === 'user' ? 'environment' : 'user'
                )
              }
              className="p-3 hover:bg-white/20 rounded-2xl text-white transition-all active:scale-90"
              title="Flip Camera"
              aria-label="Flip Camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleScreenshot}
              className="p-4 bg-white text-slate-900 rounded-2xl hover:scale-110 hover:shadow-white/20 transition-all active:scale-95 shadow-xl flex items-center gap-2 group/btn"
              title="Take Screenshot"
              aria-label="Take Screenshot"
            >
              <Camera className="w-6 h-6 group-active/btn:scale-75 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest pr-1">
                Snap
              </span>
            </button>
            <button
              onClick={() => void handleOCR()}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white shadow-lg rounded-2xl transition-all active:scale-90"
              title="Extract Text (OCR)"
              aria-label="Extract Text (OCR)"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowGallery(true)}
              className="relative p-3 hover:bg-white/20 rounded-2xl text-white transition-all active:scale-90"
              title="View Captured Text"
              aria-label="View Captured Text"
            >
              <List className="w-5 h-5" />
              {capturedItems.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        </>
      )}

      {/* Gallery/Results Overlay */}
      {showGallery && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <List className="w-4 h-4 text-blue-400" />
              Captured Text ({capturedItems.length})
            </h3>
            <div className="flex gap-2">
              {capturedItems.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-2 hover:bg-white/10 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                  title="Clear All"
                  aria-label="Clear All"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                aria-label="Close Gallery"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {capturedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                <FileText className="w-12 h-12 opacity-20" />
                <p className="text-sm">No text captured yet.</p>
              </div>
            ) : (
              capturedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.status === 'processing' && (
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      )}
                      {item.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      {item.status === 'error' && (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                      <span className="text-[10px] text-white/40 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.status === 'success' && item.text && (
                        <>
                          <button
                            onClick={() =>
                              copyToClipboard(item.text ?? '', item.id)
                            }
                            className={`p-1.5 rounded-lg transition-colors ${copiedId === item.id ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
                            title="Copy"
                            aria-label="Copy Text"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              downloadText(item.text ?? '', item.timestamp)
                            }
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Download"
                            aria-label="Download Text"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete"
                        aria-label="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-slate-300 font-mono bg-black/30 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                    {item.status === 'processing' ? (
                      <span className="text-amber-400/70 italic">
                        Processing image...
                      </span>
                    ) : (
                      item.text
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 px-2 py-1 bg-black/30 backdrop-blur-md rounded text-[9px] font-black text-white/50 uppercase tracking-widest pointer-events-none border border-white/5">
        {facingMode === 'user' ? 'Front' : 'Back'} Camera
      </div>
    </div>
  );
};
