import React, { useState, useEffect, useRef } from 'react';
import { Settings, X, Camera } from 'lucide-react';
import { WidgetData } from '../../types';
import { useDashboard } from '../../context/useDashboard';

export const WebcamWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Local state for UI interaction (Flip)
  const [isFlipped, setIsFlipped] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Widget Persisted State (Defaults)
  const deviceId = widget.deviceId ?? '';
  const isMirrored = widget.isMirrored ?? false; // Default to normal
  const zoom = widget.zoom ?? 1;

  const widgetId = widget.id;

  // 1. Enumerate Devices on Mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true }); // Request perm first
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevices);

        // If no device saved, and devices exist, set the first one
        if (!deviceId && videoDevices.length > 0) {
          updateWidget(widgetId, { deviceId: videoDevices[0].deviceId });
        }
      } catch (err) {
        console.error('Error enumerating devices:', err);
        setError('Camera permission denied or no camera found.');
      }
    };
    void getDevices();
  }, [deviceId, updateWidget, widgetId]);

  // 2. Handle Stream Connection
  useEffect(() => {
    const startStream = async () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // If we don't have a device ID yet, wait (unless there are no devices)
      if (!deviceId && devices.length > 0) return;

      try {
        const constraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        };

        const newStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        setStream(newStream);
        setError(null);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      } catch (err) {
        console.error('Error starting stream:', err);
        setError('Could not start video stream.');
      }
    };

    void startStream();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]); // Re-run when deviceId changes

  // 3. Handlers
  const handleUpdate = (updates: Partial<typeof widget>) => {
    updateWidget(widget.id, updates);
  };

  const toggleFlip = () => setIsFlipped(!isFlipped);

  // Calculate CSS Transform for Zoom + Mirror
  // Logic: Scale applies Zoom. ScaleX(-1) applies mirror.
  const transformStyle = `scale(${zoom}) scaleX(${isMirrored ? -1 : 1})`;

  return (
    <div className="w-full h-full relative" style={{ perspective: '1000px' }}>
      {/* CARD FLIPPER */}
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* === FRONT FACE (VIDEO) === */}
        <div
          className="absolute w-full h-full bg-black rounded-lg overflow-hidden flex items-center justify-center group"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {error ? (
            <div className="text-white/70 flex flex-col items-center gap-2 p-4 text-center">
              <Camera className="w-8 h-8 opacity-50" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transition-transform duration-200 ease-out origin-center"
              style={{ transform: transformStyle }}
            />
          )}

          {/* Overlay Controls */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={toggleFlip}
              className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 backdrop-blur-sm transition-colors"
              title="Camera Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Indicator (Only show if zoomed) */}
          {zoom > 1 && (
            <div className="absolute bottom-2 left-2 bg-black/30 px-2 py-1 rounded text-white/70 text-[10px] pointer-events-none backdrop-blur-sm">
              {zoom.toFixed(1)}x
            </div>
          )}
        </div>

        {/* === BACK FACE (SETTINGS) === */}
        <div
          className="absolute w-full h-full bg-white rounded-lg p-4 flex flex-col"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" /> Settings
            </h3>
            <button
              onClick={toggleFlip}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls */}
          <div className="space-y-6 flex-1 overflow-y-auto">
            {/* Source Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                Camera Source
              </label>
              <select
                value={deviceId}
                onChange={(e) => handleUpdate({ deviceId: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                  </option>
                ))}
              </select>
            </div>

            {/* Mirror Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Mirror Video
              </label>
              <button
                onClick={() => handleUpdate({ isMirrored: !isMirrored })}
                className={`
                  w-11 h-6 rounded-full relative transition-colors duration-200 focus:outline-none
                  ${isMirrored ? 'bg-blue-600' : 'bg-slate-200'}
                `}
              >
                <div
                  className={`
                    w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform duration-200 shadow-sm
                    ${isMirrored ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* Zoom Slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-bold text-slate-400 uppercase">
                  Digital Zoom
                </label>
                <span className="text-xs font-bold text-blue-600">
                  {zoom.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) =>
                  handleUpdate({ zoom: parseFloat(e.target.value) })
                }
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                <span>1x</span>
                <span>2x</span>
                <span>3x</span>
              </div>
            </div>
          </div>

          {/* Done Button */}
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={toggleFlip}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
            >
              Return to Camera
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
