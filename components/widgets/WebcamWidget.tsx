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
} from 'lucide-react';
import { WidgetData } from '../../types';
import { GoogleGenAI } from '@google/genai';
import { useDashboard } from '../../context/DashboardContext';

export const WebcamWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { addToast } = useDashboard();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

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

    startCamera();

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

    setIsProcessing(true);
    setOcrResult(null);

    try {
      const ai = new GoogleGenAI({
        apiKey: import.meta.env.VITE_GEMINI_API_KEY,
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

      setOcrResult(response.text || 'No text detected.');
    } catch (err) {
      console.error('OCR failed:', err);
      setOcrResult('Failed to extract text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!ocrResult) return;
    navigator.clipboard.writeText(ocrResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-2xl p-3 rounded-3xl border border-white/20 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <button
              onClick={() =>
                setFacingMode((prev) =>
                  prev === 'user' ? 'environment' : 'user'
                )
              }
              className="p-3 hover:bg-white/20 rounded-2xl text-white transition-all active:scale-90"
              title="Flip Camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={handleScreenshot}
              className="p-4 bg-white text-slate-900 rounded-2xl hover:scale-110 hover:shadow-white/20 transition-all active:scale-95 shadow-xl flex items-center gap-2 group/btn"
              title="Take Screenshot"
            >
              <Camera className="w-6 h-6 group-active/btn:scale-75 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest pr-1">
                Snap
              </span>
            </button>
            <button
              onClick={handleOCR}
              disabled={isProcessing}
              className={`p-3 rounded-2xl transition-all active:scale-90 ${isProcessing ? 'bg-amber-500/50 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'}`}
              title="Extract Text (OCR)"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </button>
          </div>
        </>
      )}

      {/* OCR Result Overlay */}
      {ocrResult && (
        <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col p-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">
                Extracted Text
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500 text-white' : 'hover:bg-white/10 text-slate-300'}`}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setOcrResult(null)}
                className="p-2 hover:bg-white/10 rounded-lg text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-sm font-medium text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
              {ocrResult}
            </p>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 px-2 py-1 bg-black/30 backdrop-blur-md rounded text-[9px] font-black text-white/50 uppercase tracking-widest pointer-events-none border border-white/5">
        {facingMode === 'user' ? 'Front' : 'Back'} Camera
      </div>
    </div>
  );
};
