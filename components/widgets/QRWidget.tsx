import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, QRConfig } from '../../types';

export const QRWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const config = widget.config as QRConfig;
  const url = config.url ?? 'https://google.com';
  // Use a simple public API for QR codes
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-transparent rounded-lg">
      <div className="bg-white p-2 rounded-xl mb-3 shadow-inner">
        <img
          src={qrUrl}
          alt="QR Code"
          className="w-full h-auto max-w-[180px] mix-blend-multiply"
        />
      </div>
      <div className="text-[10px] font-mono text-slate-400 break-all text-center max-w-full overflow-hidden px-2">
        {url}
      </div>
    </div>
  );
};

export const QRSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as QRConfig;
  return (
    <div className="space-y-4">
      <label className="text-xs  text-slate-500 uppercase">
        Destination URL
      </label>
      <input
        type="text"
        value={config.url}
        onChange={(e) =>
          updateWidget(widget.id, {
            config: { ...config, url: e.target.value } as QRConfig,
          })
        }
        className="w-full p-2 text-sm border rounded-lg"
        placeholder="https://..."
      />
    </div>
  );
};
