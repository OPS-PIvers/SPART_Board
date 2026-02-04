import React, { useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, QRConfig, TextConfig } from '../../types';
import { Link, AlertCircle } from 'lucide-react';
import { Toggle } from '../common/Toggle';

const stripHtml = (html: string) => {
  if (typeof DOMParser === 'undefined') {
    // Basic fallback for SSR environments to remove HTML tags.
    return html.replace(/<[^>]*>?/gm, '');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
};

export const QRWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { activeDashboard, updateWidget } = useDashboard();
  const config = widget.config as QRConfig;
  const url = config.url ?? 'https://google.com';

  // Nexus Connection: Link Repeater (Text -> QR)
  useEffect(() => {
    if (config.syncWithTextWidget && activeDashboard?.widgets) {
      const textWidget = activeDashboard.widgets.find((w) => w.type === 'text');
      if (textWidget) {
        const textConfig = textWidget.config as TextConfig;
        const plainText = stripHtml(textConfig.content || '').trim();

        if (plainText && plainText !== config.url) {
          updateWidget(widget.id, {
            config: { url: plainText, syncWithTextWidget: true } as QRConfig,
          });
        }
      }
    }
  }, [
    config.syncWithTextWidget,
    activeDashboard?.widgets,
    config.url,
    widget.id,
    updateWidget,
  ]);

  // Use a simple public API for QR codes
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 relative">
      {config.syncWithTextWidget && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 animate-in fade-in zoom-in">
          <Link className="w-3 h-3 text-indigo-500" />
          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">
            Linked
          </span>
        </div>
      )}
      <div className="bg-white p-2 rounded-xl mb-3 shadow-inner">
        <img
          src={qrUrl}
          alt="QR Code"
          className="w-full h-auto max-w-[180px] mix-blend-multiply"
        />
      </div>
      <div className="text-xxs font-mono text-slate-400 break-all text-center max-w-full overflow-hidden px-2">
        {url}
      </div>
    </div>
  );
};

export const QRSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as QRConfig;

  const hasTextWidget = activeDashboard?.widgets.some((w) => w.type === 'text');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">
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
          disabled={config.syncWithTextWidget}
          className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400 transition-all"
          placeholder="https://..."
        />
      </div>

      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-indigo-900">
          <Link className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">
            Link Repeater
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-indigo-800">Sync with Text Widget</span>
          <Toggle
            checked={config.syncWithTextWidget ?? false}
            onChange={(checked: boolean) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  syncWithTextWidget: checked,
                } as QRConfig,
              })
            }
            size="sm"
            activeColor="bg-indigo-600"
            showLabels={false}
          />
        </div>

        {config.syncWithTextWidget && !hasTextWidget && (
          <div className="flex gap-2 items-start text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-100">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong>No Text Widget found!</strong>
              <br />
              Add a Text Widget to the dashboard to start syncing.
            </div>
          </div>
        )}

        <div className="text-xxs text-indigo-400 font-medium leading-relaxed">
          Automatically updates the QR code to match the content of the first
          Text Widget on your dashboard.
        </div>
      </div>
    </div>
  );
};
