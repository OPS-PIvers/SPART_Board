import React, { useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDashboard } from '../../context/useDashboard';
import { Sidebar } from './Sidebar';
import { Dock } from './Dock';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { fileStorage } from '../../utils/fileStorage';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useDashboard();
  return (
    <div className="fixed top-6 right-6 z-[10000] space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border pointer-events-auto cursor-pointer animate-in slide-in-from-right duration-300 ${
            toast.type === 'success'
              ? 'bg-green-50/90 border-green-200 text-green-800'
              : toast.type === 'error'
                ? 'bg-red-50/90 border-red-200 text-red-800'
                : 'bg-white/90 border-slate-200 text-slate-800'
          }`}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-red-600" />
          )}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export const DashboardView: React.FC = () => {
  const { activeDashboard, addWidget, addToast } = useDashboard();

  const handleFile = useCallback(
    async (file: File) => {
      try {
        // Validation
        const MAX_SIZE = 50 * 1024 * 1024; // 50MB
        if (file.size > MAX_SIZE) {
          addToast(`File too large (max 50MB): ${file.name}`, 'error');
          return;
        }

        const ALLOWED_TYPES = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
          'text/plain',
          'text/csv',
        ];

        if (!ALLOWED_TYPES.includes(file.type)) {
          addToast(`Unsupported file type: ${file.name}`, 'error');
          return;
        }

        const id = uuidv4();
        await fileStorage.saveFile(id, file);

        // Add file widget
        addWidget('file', {
          config: {
            fileId: id,
            fileName: file.name,
            fileType: file.type,
          },
        });

        addToast(`Imported ${file.name}`, 'success');
      } catch (err) {
        console.error('Failed to import file', err);
        let reason = 'An unexpected error occurred.';
        if (err instanceof Error) {
          if (err.name === 'QuotaExceededError') {
            reason = 'Storage quota exceeded. Please delete some files.';
          } else {
            reason = err.message;
          }
        }
        addToast(`Failed to import ${file.name}: ${reason}`, 'error');
      }
    },
    [addWidget, addToast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Check if the drop event contains files
      if (!e.dataTransfer.types.includes('Files')) {
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        files.forEach((file) => {
          if (file instanceof File) {
            void handleFile(file);
          }
        });
      }
    },
    [handleFile]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      items.forEach((item) => {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) void handleFile(file);
        }
      });
    },
    [handleFile]
  );

  React.useEffect(() => {
    const pasteListener = (e: ClipboardEvent) => handlePaste(e);
    window.addEventListener('paste', pasteListener);
    return () => window.removeEventListener('paste', pasteListener);
  }, [handlePaste]);

  const backgroundStyles = useMemo(() => {
    if (!activeDashboard) return {};
    const bg = activeDashboard.background;

    // Check if it's a URL or Base64 image
    if (bg.startsWith('http') || bg.startsWith('data:')) {
      return {
        backgroundImage: `url("${bg}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      };
    }
    return {};
  }, [activeDashboard]);

  const backgroundClasses = useMemo(() => {
    if (!activeDashboard) return '';
    const bg = activeDashboard.background;
    // If it's a URL, don't apply the class
    if (bg.startsWith('http') || bg.startsWith('data:')) return '';
    return bg;
  }, [activeDashboard]);

  if (!activeDashboard) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-black uppercase tracking-[0.3em] text-xs">
            Waking up Classroom...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="dashboard-root"
      className={`relative h-screen w-screen overflow-hidden transition-all duration-1000 ${backgroundClasses}`}
      style={backgroundStyles}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onDrop={handleDrop}
    >
      {/* Background Overlay for Depth (especially for images) */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Dynamic Widget Surface */}
      <div className="relative w-full h-full">
        {activeDashboard.widgets.map((widget) => (
          <WidgetRenderer key={widget.id} widget={widget} />
        ))}
      </div>

      <Sidebar />
      <Dock />
      <ToastContainer />
    </div>
  );
};
