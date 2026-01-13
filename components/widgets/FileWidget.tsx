import React, { useState, useEffect } from 'react';
import { FileConfig, WidgetData } from '../../types';
import { fileStorage } from '../../utils/fileStorage';
import { AlertCircle, FileText, Download } from 'lucide-react';

export const FileWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const config = widget.config as FileConfig;
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let url: string | null = null;

    const loadFile = async () => {
      try {
        setLoading(true);
        if (!config.fileId) {
          setError('No file linked');
          setLoading(false);
          return;
        }

        const blob = await fileStorage.getFile(config.fileId);
        if (!active) return;

        if (blob) {
          url = URL.createObjectURL(blob);
          setBlobUrl(url);
          setError(null);
        } else {
          setError('File not found locally');
        }
      } catch (err) {
        if (active) setError('Failed to load file');
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadFile();

    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [config.fileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 p-4 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-2" />
        <p className="text-slate-600 font-medium">{error}</p>
        <p className="text-slate-400 text-xs mt-1">
          Files are only stored on this device.
        </p>
      </div>
    );
  }

  const isImage = config.fileType.startsWith('image/');
  const isPDF = config.fileType === 'application/pdf';

  if (isImage && blobUrl) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-black overflow-hidden relative group">
        <img
          src={blobUrl}
          alt={config.fileName}
          className="max-w-full max-h-full object-contain"
        />
        {/* Hover overlay with download option */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <a
            href={blobUrl}
            download={config.fileName}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-full text-slate-900 font-medium hover:bg-slate-100 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      </div>
    );
  }

  if (isPDF && blobUrl) {
    return (
      <iframe
        src={blobUrl}
        className="w-full h-full border-0"
        title={config.fileName}
      />
    );
  }

  // Fallback for other file types
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center">
        <FileText className="w-8 h-8 text-slate-500" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 break-all line-clamp-2">
          {config.fileName}
        </h3>
        <p className="text-slate-500 text-sm mt-1">{config.fileType}</p>
      </div>
      {blobUrl && (
        <a
          href={blobUrl}
          download={config.fileName}
          className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download File
        </a>
      )}
    </div>
  );
};
