import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, EmbedConfig } from '../../types';
import { Globe, ExternalLink, AlertCircle, Code, Link2 } from 'lucide-react';
import { convertToEmbedUrl } from '../../utils/urlHelpers';

export const EmbedWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const config = widget.config as EmbedConfig;
  const { mode = 'url', url = '', html = '', refreshInterval = 0 } = config;
  const embedUrl = convertToEmbedUrl(url);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(
        () => {
          setRefreshKey((prev) => prev + 1);
        },
        refreshInterval * 60 * 1000
      );
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  const sandbox = React.useMemo(() => {
    let base = 'allow-scripts allow-forms allow-popups';
    if (mode === 'url') {
      base += ' allow-modals';
      try {
        const parsedUrl = new URL(
          url.startsWith('http') ? url : `https://${url}`
        );
        const hostname = parsedUrl.hostname.toLowerCase();
        const allowSameOriginHosts = new Set([
          'docs.google.com',
          'www.youtube.com',
          'youtube.com',
        ]);
        if (allowSameOriginHosts.has(hostname)) {
          base += ' allow-same-origin';
        }
      } catch (_e) {
        // Fallback for malformed URLs
      }
    }
    return base;
  }, [mode, url]);

  if (mode === 'url' && !url) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center gap-3">
        <Globe className="w-12 h-12 opacity-20" />
        <div>
          <p className="text-sm  uppercase tracking-widest mb-1">
            No URL Provided
          </p>
          <p className="text-xs">
            Flip this widget to add a link to a website, video, or document.
          </p>
        </div>
      </div>
    );
  }

  if (mode === 'code' && !html) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center gap-3">
        <Code className="w-12 h-12 opacity-20" />
        <div>
          <p className="text-sm  uppercase tracking-widest mb-1">
            No Code Provided
          </p>
          <p className="text-xs">
            Flip this widget and paste your HTML/CSS/JS code to run it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-transparent flex flex-col">
      <iframe
        key={refreshKey}
        title="Embed Content"
        src={mode === 'url' ? embedUrl : undefined}
        srcDoc={mode === 'code' ? html : undefined}
        className="flex-1 w-full border-none"
        sandbox={sandbox}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};

export const EmbedSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as EmbedConfig;
  const { mode = 'url', url = '', html = '', refreshInterval = 0 } = config;

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, mode: 'url' },
            })
          }
          className={`flex-1 py-1.5 text-xxs  rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'url' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          <Link2 className="w-3 h-3" /> WEBSITE URL
        </button>
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, mode: 'code' },
            })
          }
          className={`flex-1 py-1.5 text-xxs  rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'code' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          <Code className="w-3 h-3" /> CUSTOM CODE
        </button>
      </div>

      {mode === 'url' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="text-xxs  text-slate-500 uppercase mb-2 block tracking-widest">
              Target URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={url}
                placeholder="https://example.com or Google Docs link..."
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: { ...config, url: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-10 text-slate-900"
              />
              <Globe className="absolute right-3 top-2.5 w-4 h-4 text-slate-300" />
            </div>
            <p className="mt-2 text-xxs text-slate-400 leading-relaxed italic">
              Pro-tip: Links from YouTube, Google Docs, Slides, and Sheets are
              automatically formatted.
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xxs text-amber-800 leading-relaxed ">
              Some websites prevent embedding for security. If the widget is
              blank, try a different link or document.
            </p>
          </div>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-2 text-xxs  text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
            >
              OPEN ORIGINAL <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div>
            <label className="text-xxs  text-slate-500 uppercase mb-2 block tracking-widest">
              HTML / CSS / JS
            </label>
            <textarea
              value={html}
              placeholder="<html>&#10;  <style>body { background: #f0f; }</style>&#10;  <body><h1>Hello Class!</h1></body>&#10;</html>"
              onChange={(e) =>
                updateWidget(widget.id, {
                  config: { ...config, html: e.target.value },
                })
              }
              className="w-full h-48 p-3 text-[11px] font-mono bg-slate-900 text-emerald-400 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none leading-relaxed custom-scrollbar"
              spellCheck={false}
            />
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-3">
            <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xxs text-indigo-800 leading-relaxed ">
              You can paste a full single-file mini-app here. Scripts are
              allowed but run in a secure sandbox.
            </p>
          </div>
        </div>
      )}

      {/* Auto-Refresh Setting */}
      <div className="pt-4 border-t border-slate-100">
        <label
          htmlFor="refresh-interval"
          className="text-xxs  text-slate-500 uppercase mb-2 block tracking-widest"
        >
          Auto-Refresh
        </label>
        <select
          id="refresh-interval"
          value={refreshInterval}
          onChange={(e) =>
            updateWidget(widget.id, {
              config: { ...config, refreshInterval: parseInt(e.target.value) },
            })
          }
          className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-slate-900"
        >
          <option value={0}>Disabled</option>
          <option value={1}>Every 1 Minute</option>
          <option value={5}>Every 5 Minutes</option>
          <option value={15}>Every 15 Minutes</option>
          <option value={30}>Every 30 Minutes</option>
          <option value={60}>Every 1 Hour</option>
        </select>
      </div>
    </div>
  );
};
