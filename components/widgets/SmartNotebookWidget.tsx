import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '@/context/useDashboard';
import { WidgetData, SmartNotebookConfig, NotebookItem } from '@/types';
import {
  Upload,
  Book,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '@/context/useAuth';
import { useStorage } from '@/hooks/useStorage';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { parseNotebookFile } from '@/utils/notebookParser';

export const SmartNotebookWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addToast } = useDashboard();
  const { user } = useAuth();
  const { uploadFile, deleteFile } = useStorage();
  const config = widget.config as SmartNotebookConfig;
  const { activeNotebookId } = config;

  const [notebooks, setNotebooks] = useState<NotebookItem[]>([]);
  const [activeNotebook, setActiveNotebook] = useState<NotebookItem | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch notebooks
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'notebooks'),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: (data.title as string) ?? 'Untitled',
          pageUrls: (data.pageUrls as string[]) ?? [],
          pagePaths: (data.pagePaths as string[]) ?? [],
          createdAt: (data.createdAt as number) ?? 0,
        } as NotebookItem;
      });
      setNotebooks(items);
    });
    return () => unsubscribe();
  }, [user]);

  // Sync active notebook state
  useEffect(() => {
    if (activeNotebookId) {
      const found = notebooks.find((n) => n.id === activeNotebookId);
      if (found) {
        setActiveNotebook(found);
      } else if (notebooks.length > 0) {
        // If notebooks are loaded but the active one is missing, clear config
        // Check if we actually have notebooks loaded (length > 0) to avoid clearing during initial load
        setActiveNotebook(null);
        // Defer the update to avoid conflicts during render
        setTimeout(() => {
          updateWidget(widget.id, {
            config: { ...config, activeNotebookId: null },
          });
        }, 0);
      }
    } else {
      setActiveNotebook(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNotebookId, notebooks]);

  // Clamp current page index when notebook changes
  useEffect(() => {
    if (activeNotebook && currentPage >= activeNotebook.pageUrls.length) {
      setCurrentPage(Math.max(0, activeNotebook.pageUrls.length - 1));
    }
  }, [activeNotebook, currentPage]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (limit to 50MB)
    if (file.size > 50 * 1024 * 1024) {
      addToast('File is too large (max 50MB)', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const { title, pages } = await parseNotebookFile(file);
      const notebookId = crypto.randomUUID();

      // Upload pages sequentially to avoid overwhelming network/Firebase
      const uploadedUrls: string[] = [];
      const uploadedPaths: string[] = [];
      for (let index = 0; index < pages.length; index += 1) {
        const { blob, extension } = pages[index];
        const pageFile = new File([blob], `page${index}.${extension}`, {
          type: blob.type,
        });
        const path = `users/${user.uid}/notebooks/${notebookId}/page${index}.${extension}`;
        const url = await uploadFile(path, pageFile);
        uploadedUrls.push(url);
        uploadedPaths.push(path);
      }

      const notebook: NotebookItem = {
        id: notebookId,
        title,
        pageUrls: uploadedUrls,
        pagePaths: uploadedPaths,
        createdAt: Date.now(),
      };

      await setDoc(
        doc(db, 'users', user.uid, 'notebooks', notebookId),
        notebook
      );
      addToast('Notebook imported successfully', 'success');

      // Auto-select
      updateWidget(widget.id, {
        config: { ...config, activeNotebookId: notebookId },
      });
    } catch (err) {
      console.error(err);
      addToast('Failed to import notebook', 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user) return;
    if (confirm('Delete this notebook?')) {
      try {
        const notebookToDelete = notebooks.find((n) => n.id === id);
        if (notebookToDelete?.pagePaths) {
          // Delete files using stored paths
          const deletePromises = notebookToDelete.pagePaths.map((path) =>
            deleteFile(path)
          );
          await Promise.all(deletePromises);
        } else if (notebookToDelete) {
          // Fallback for notebooks without pagePaths (legacy data)
          console.warn(
            'Notebook missing pagePaths, cannot delete storage files:',
            id
          );
        }

        await deleteDoc(doc(db, 'users', user.uid, 'notebooks', id));
        if (activeNotebookId === id) {
          updateWidget(widget.id, {
            config: { ...config, activeNotebookId: null },
          });
        }
        addToast('Notebook deleted', 'success');
      } catch (err) {
        console.error('Failed to delete notebook', err);
        addToast('Failed to delete notebook', 'error');
      }
    }
  };

  const handleSelect = (id: string) => {
    updateWidget(widget.id, { config: { ...config, activeNotebookId: id } });
    setCurrentPage(0);
  };

  const handleClose = () => {
    updateWidget(widget.id, { config: { ...config, activeNotebookId: null } });
  };

  // Viewer
  if (activeNotebook) {
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col relative rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-2 right-2 left-2 z-10 flex justify-between items-start pointer-events-none">
          <div className="bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow-sm pointer-events-auto border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
              {activeNotebook.title}
            </h3>
            <p className="text-[10px] text-slate-500">
              {currentPage + 1} / {activeNotebook.pageUrls.length}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="pointer-events-auto p-2 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg shadow-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Slide */}
        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src={activeNotebook.pageUrls[currentPage]}
            alt={`Page ${currentPage + 1}`}
            className="max-w-full max-h-full object-contain shadow-lg bg-white"
          />
        </div>

        {/* Navigation */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-slate-200">
          <button
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-mono w-12 text-center text-slate-600">
            {currentPage + 1} / {activeNotebook.pageUrls.length}
          </span>
          <button
            disabled={currentPage === activeNotebook.pageUrls.length - 1}
            onClick={() =>
              setCurrentPage((p) =>
                Math.min(activeNotebook.pageUrls.length - 1, p + 1)
              )
            }
            className="p-2 hover:bg-slate-100 rounded-full disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Library
  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
        <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Book className="w-4 h-4 text-indigo-500" /> Notebook Library
        </h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          {isImporting ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Upload className="w-3 h-3" />
          )}
          Import
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".notebook"
          className="hidden"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {notebooks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[200px]">
            <div className="p-4 bg-slate-50 rounded-full">
              <FileText className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm">No notebooks yet</p>
            <p className="text-xs max-w-[200px] text-center opacity-70">
              Import a .notebook file to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {notebooks.map((notebook) => (
              <div
                key={notebook.id}
                onClick={() => handleSelect(notebook.id)}
                className="group relative aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all border border-slate-200"
              >
                <img
                  src={notebook.pageUrls[0]}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  alt={notebook.title}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8">
                  <p className="text-white text-xs font-bold truncate">
                    {notebook.title}
                  </p>
                  <p className="text-white/70 text-[10px]">
                    {notebook.pageUrls.length} pages
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, notebook.id)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
