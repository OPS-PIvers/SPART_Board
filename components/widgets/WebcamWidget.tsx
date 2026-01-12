import React, { useEffect, useRef, useState } from 'react';
import {
  CameraOff,
  Loader2,
  Camera,
  FileText,
  X,
  Copy,
  Check,
  Trash2,
  List,
  ZoomIn,
  ZoomOut,
  FlipHorizontal,
  Video,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { WidgetData, WebcamConfig } from '../../types';
import { GoogleGenAI } from '@google/genai';
import { useDashboard } from '../../context/useDashboard';

interface CapturedItem {
  id: string;
  timestamp: number;
  text: string | null;
  status: 'processing' | 'success' | 'error';
  imageUrl?: string;
}

export const WebcamWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, addToast } = useDashboard();
  // Safe cast with fallback
  const config = (widget.config || {}) as WebcamConfig;

  // Default values
  const deviceId = config.deviceId;
  const zoomLevel = config.zoomLevel ?? 1;
  const isMirrored = config.isMirrored ?? true;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        // Stop any existing tracks
        if (videoRef.current && videoRef.current.srcObject) {
          const oldStream = videoRef.current.srcObject as MediaStream;
          oldStream.getTracks().forEach((t) => t.stop());
        }

        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setLoading(false);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Could not access camera. Check permissions or settings.');
        setLoading(false);
      }
    };

    void startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [deviceId]);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Apply mirror if enabled
    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleScreenshot = () => {
    const dataUrl = captureFrame();
    if (!dataUrl) return;

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

    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);

    const newItem: CapturedItem = {
      id: uuidv4(),
      timestamp: Date.now(),
      text: null,
      status: 'processing',
    };

    setCapturedItems((prev) => [newItem, ...prev]);

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

      // FIXED: Access text directly from the response object for @google/genai
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

  const changeZoom = (delta: number) => {
    const newZoom = Math.min(3, Math.max(1, zoomLevel + delta));
    updateWidget(widget.id, {
      config: { ...config, zoomLevel: newZoom },
    });
  };

  const toggleMirror = () => {
    updateWidget(widget.id, {
      config: { ...config, isMirrored: !isMirrored },
    });
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden flex items-center justify-center group">
      <canvas ref={canvasRef} className="hidden" />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/50 z-10 bg-slate-900">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-widest">
            Starting Camera...
          </span>
        </div>
      )}

      {showFlash && (
        <div className="absolute inset-0 bg-white z-[30] animate-out fade-out duration-150 pointer-events-none" />
      )}

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
          <div className="w-full h-full overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transition-transform duration-200"
              style={{
                transform: `scale(${zoomLevel}) scaleX(${isMirrored ? -1 : 1})`,
              }}
            />
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-2xl p-2 rounded-3xl border border-white/20 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-30">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 pr-2 border-r border-white/10">
              <button
                onClick={() => changeZoom(-0.5)}
                disabled={zoomLevel <= 1}
                className="p-3 hover:bg-white/20 rounded-2xl text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-white w-6 text-center">
                {zoomLevel}x
              </span>
              <button
                onClick={() => changeZoom(0.5)}
                disabled={zoomLevel >= 3}
                className="p-3 hover:bg-white/20 rounded-2xl text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={toggleMirror}
              className={`p-3 rounded-2xl text-white transition-all ${isMirrored ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/20'}`}
              title="Mirror Flip"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>

            <button
              onClick={handleScreenshot}
              className="p-4 bg-white text-slate-900 rounded-2xl hover:scale-110 shadow-xl flex items-center gap-2 mx-1"
              title="Take Screenshot"
            >
              <Camera className="w-6 h-6" />
            </button>

            <button
              onClick={() => void handleOCR()}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg rounded-2xl"
              title="Extract Text (AI)"
            >
              <FileText className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowGallery(true)}
              className="relative p-3 hover:bg-white/20 rounded-2xl text-white"
              title="History"
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
          <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <List className="w-4 h-4 text-blue-400" />
              Captured Text ({capturedItems.length})
            </h3>
            <div className="flex gap-2">
              {capturedItems.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear history?')) setCapturedItems([]);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowGallery(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {capturedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                <FileText className="w-12 h-12 opacity-20" />
                <p className="text-sm">No items yet.</p>
              </div>
            ) : (
              capturedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.status === 'processing' && (
                        <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                      )}
                      <span className="text-[10px] text-white/40 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {item.status === 'success' && item.text && (
                      <button
                        onClick={() =>
                          copyToClipboard(item.text ?? '', item.id)
                        }
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 font-mono bg-black/30 p-3 rounded-lg whitespace-pre-wrap">
                    {item.text ?? 'Processing...'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const WebcamSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = (widget.config || {}) as WebcamConfig;
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first to get labels
        await navigator.mediaDevices.getUserMedia({ video: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        setDevices(allDevices.filter((d) => d.kind === 'videoinput'));
      } catch (e) {
        console.error('Error listing devices', e);
      }
    };
    void getDevices();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Video className="w-3 h-3" /> Camera Source
        </label>
        <div className="space-y-2">
          {devices.map((device) => (
            <button
              key={device.deviceId}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, deviceId: device.deviceId },
                })
              }
              className={`w-full p-3 rounded-xl text-left border-2 transition-all flex items-center justify-between ${
                config.deviceId === device.deviceId
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-100 hover:border-slate-200 text-slate-600'
              }`}
            >
              <span className="text-xs font-bold truncate">
                {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
              </span>
              {config.deviceId === device.deviceId && (
                <Check className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          ))}
          {devices.length === 0 && (
            <div className="text-xs text-slate-400 italic">
              No cameras found or permission denied.
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <strong>Tip:</strong> Use the buttons on the front of the widget to
          flip (mirror) the image or zoom in digitally.
        </p>
      </div>
    </div>
  );
};
