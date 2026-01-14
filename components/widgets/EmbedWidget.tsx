import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, EmbedConfig } from '../../types';
import { Globe, ExternalLink, AlertCircle, Code, Link2 } from 'lucide-react';

const convertToEmbedUrl = (url: string): string => {
  if (!url) return '';
  const embedUrl = url.trim();

  // YouTube
  const ytMatch =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/.exec(
      embedUrl
    );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Google Docs
  if (embedUrl.includes('docs.google.com/document')) {
    return embedUrl.replace(/\/edit.*$/, '/preview');
  }

  // Google Slides
  if (embedUrl.includes('docs.google.com/presentation')) {
    return embedUrl.replace(/\/edit.*$/, '/embed');
  }

  // Google Sheets
  if (embedUrl.includes('docs.google.com/spreadsheets')) {
    return embedUrl.replace(/\/edit.*$/, '/preview');
  }

  // Google Forms
  if (
    embedUrl.includes('docs.google.com/forms') &&
    !embedUrl.includes('embedded=true')
  ) {
    const separator = embedUrl.includes('?') ? '&' : '?';
    return `${embedUrl}${separator}embedded=true`;
  }

  return embedUrl;
};

export const EmbedWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const config = widget.config as EmbedConfig;
  const { mode = 'url', url = '', html = '' } = config;
  const embedUrl = convertToEmbedUrl(url);

  if (mode === 'url' && !url) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center gap-3">
        <Globe className="w-12 h-12 opacity-20" />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest mb-1">
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
          <p className="text-sm font-bold uppercase tracking-widest mb-1">
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
    <div className="w-full h-full bg-white flex flex-col">
      <iframe
        src={mode === 'url' ? embedUrl : undefined}
        srcDoc={mode === 'code' ? html : undefined}
        className="flex-1 w-full border-none"
        sandbox="allow-scripts allow-forms allow-popups"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};

export const EmbedSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as EmbedConfig;
  const { mode = 'url', url = '', html = '' } = config;

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
          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'url' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          <Link2 className="w-3 h-3" /> WEBSITE URL
        </button>
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, mode: 'code' },
            })
          }
          className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'code' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
        >
          <Code className="w-3 h-3" /> CUSTOM CODE
        </button>
      </div>

      {mode === 'url' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">
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
            <p className="mt-2 text-[10px] text-slate-400 leading-relaxed italic">
              Pro-tip: Links from YouTube, Google Docs, Slides, and Sheets are
              automatically formatted.
            </p>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
              Some websites prevent embedding for security. If the widget is
              blank, try a different link or document.
            </p>
          </div>

          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-2 text-[10px] font-bold text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors"
            >
              OPEN ORIGINAL <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">
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
            <p className="text-[10px] text-indigo-800 leading-relaxed font-medium">
              You can paste a full single-file mini-app here. Scripts are
              allowed but run in a secure sandbox.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
