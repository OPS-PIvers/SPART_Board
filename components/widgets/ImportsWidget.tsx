import React, { useState, useEffect } from 'react';
import { fileStorage, FileMetadata } from '../../utils/fileStorage';
import { useDashboard } from '../../context/useDashboard';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { FileText, Trash2, Image as ImageIcon, HardDrive } from 'lucide-react';

export const ImportsWidget: React.FC = () => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { addWidget } = useDashboard();

  const loadFiles = async () => {
    try {
      setLoading(true);
      const list = await fileStorage.getAllFiles();
      setFiles(list);
    } catch (err) {
      console.error('Failed to load files', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();

    // Poll for changes only when visible (simple way to keep in sync if files are dropped elsewhere)
    if (typeof document === 'undefined') return;

    let intervalId: number | undefined;

    const startPolling = () => {
      intervalId ??= window.setInterval(() => {
        void loadFiles();
      }, 5000);
    };

    const stopPolling = () => {
      if (intervalId != null) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadFiles(); // Immediate reload on visible
        startPolling();
      } else {
        stopPolling();
      }
    };

    if (document.visibilityState === 'visible') {
      startPolling();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopPolling();
    };
  }, []);

  const handleOpen = (file: FileMetadata) => {
    addWidget('file', {
      config: {
        fileId: file.id,
        fileName: file.name,
        fileType: file.type,
      },
    });
  };

  const initiateDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    await fileStorage.deleteFile(id);
    void loadFiles();
  };

  const cancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getIcon = (type: string) => {
    if (type.startsWith('image/'))
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    return <FileText className="w-5 h-5 text-slate-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-500"></div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-slate-400 p-6 text-center">
        <HardDrive className="w-12 h-12 mb-3 opacity-20" />
        <p className="font-medium">No imported files</p>
        <p className="text-xs mt-1">
          Drag and drop files onto the dashboard to import.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="h-full w-full flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => handleOpen(file)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer group border border-transparent hover:border-slate-100 transition-colors relative"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                {getIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-700 truncate text-sm">
                  {file.name}
                </h4>
                <p className="text-xs text-slate-400">
                  {formatSize(file.size)} •{' '}
                  {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button
                  onClick={(e) => initiateDelete(e, file.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 border-t bg-slate-50 text-xs text-center text-slate-400">
          Files stored locally on this device
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmDeleteId !== null}
        title="Delete File"
        message="Are you sure you want to delete this file? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmLabel="Delete"
        isDestructive={true}
      />
    </>
  );
};
