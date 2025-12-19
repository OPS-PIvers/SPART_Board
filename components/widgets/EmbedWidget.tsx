
import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetData } from '../../types';
import { Globe, ExternalLink, AlertCircle } from 'lucide-react';

const convertToEmbedUrl = (url: string): string => {
  if (!url) return '';
  let embedUrl = url.trim();

  // YouTube
  const ytMatch = embedUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
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
  if (embedUrl.includes('docs.google.com/forms') && !embedUrl.includes('embedded=true')) {
    const separator = embedUrl.includes('?') ? '&' : '?';
    return `${embedUrl}${separator}embedded=true`;
  }

  return embedUrl;
};

export const EmbedWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const url = widget.config.url || '';
  const embedUrl = convertToEmbedUrl(url);

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center gap-3">
        <Globe className="w-12 h-12 opacity-20" />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest mb-1">No URL Provided</p>
          <p className="text-xs">Flip this widget to add a link to a website, video, or document.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <iframe
        src={embedUrl}
        className="flex-1 w-full border-none"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
};

export const EmbedSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const url = widget.config.url || '';

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Target URL</label>
        <div className="relative">
          <input
            type="text"
            value={url}
            placeholder="https://example.com or Google Docs link..."
            onChange={(e) => updateWidget(widget.id, { config: { ...widget.config, url: e.target.value } })}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-10 text-slate-900"
          />
          <Globe className="absolute right-3 top-2.5 w-4 h-4 text-slate-300" />
        </div>
        <p className="mt-2 text-[10px] text-slate-400 leading-relaxed italic">
          Pro-tip: Links from YouTube, Google Docs, Slides, and Sheets are automatically formatted for the best display.
        </p>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
          Some websites (like Google Search or Wikipedia) prevent being embedded for security. If the widget is blank, try a different link or document.
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
  );
};
