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
import { getButtonAccessibilityProps } from '@/utils/accessibility';
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

import { WidgetLayout } from './WidgetLayout';

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
  const [showAssets, setShowAssets] = useState(false);
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
          assetUrls: (data.assetUrls as string[]) ?? [],
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
  }, [activeNotebookId, notebooks, widget.id, updateWidget, config]);

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
      const { title, pages, assets } = await parseNotebookFile(file);
      const notebookId = crypto.randomUUID();

      // Helper to upload a set of blobs to a specific path structure
      const uploadBatch = async (
        items: { blob: Blob; extension: string }[],
        basePath: string,
        namePrefix: string
      ) => {
        return Promise.all(
          items.map(async (item, index) => {
            const fileName = `${namePrefix}${index}.${item.extension}`;
            const fileObj = new File([item.blob], fileName, {
              type: item.blob.type,
            });
            const path = `${basePath}/${fileName}`;
            const url = await uploadFile(path, fileObj);
            return { url, path };
          })
        );
      };

      // Upload pages and assets in parallel batches
      const notebookPath = `users/${user.uid}/notebooks/${notebookId}`;
      const [uploadedPages, uploadedAssets] = await Promise.all([
        uploadBatch(pages, notebookPath, 'page'),
        assets ? uploadBatch(assets, `${notebookPath}/assets`, 'asset') : [],
      ]);

      const uploadedUrls = uploadedPages.map((p) => p.url);
      const uploadedPaths = uploadedPages.map((p) => p.path);
      const uploadedAssetUrls = uploadedAssets.map((a) => a.url);

      const notebook: NotebookItem = {
        id: notebookId,
        title,
        pageUrls: uploadedUrls,
        pagePaths: uploadedPaths,
        assetUrls: uploadedAssetUrls,
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
        if (notebookToDelete) {
          // Cleanup storage
          // Use direct URLs/Paths for deletion as they are most robust
          const deletePromises = (
            notebookToDelete.pagePaths || notebookToDelete.pageUrls
          ).map((pathOrUrl) =>
            deleteFile(pathOrUrl).catch(() => {
              /* ignore */
            })
          );
          await Promise.all(deletePromises);

          if (notebookToDelete.assetUrls) {
            const assetDeletePromises = notebookToDelete.assetUrls.map((url) =>
              deleteFile(url).catch(() => {
                /* ignore */
              })
            );
            await Promise.all(assetDeletePromises);
          }
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

  const handleDragStart = (e: React.DragEvent, url: string) => {
    const img = e.currentTarget.querySelector('img');
    const ratio = img ? img.naturalWidth / img.naturalHeight : 1;
    e.dataTransfer.setData(
      'application/sticker',
      JSON.stringify({ url, ratio })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Viewer
  if (activeNotebook) {
    const hasAssets =
      activeNotebook.assetUrls && activeNotebook.assetUrls.length > 0;

    return (
      <WidgetLayout
        padding="p-0"
        header={
          <div className="p-4 border-b border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest truncate max-w-[200px]">
                {activeNotebook.title}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                Page {currentPage + 1} of {activeNotebook.pageUrls.length}
              </p>
            </div>

            <div className="flex gap-2">
              {hasAssets && (
                <button
                  onClick={() => setShowAssets(!showAssets)}
                  className={`p-2 rounded-xl transition-all shadow-sm border ${
                    showAssets
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Toggle Assets"
                >
                  <FileText className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition-all border border-slate-700 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        }
        content={
          <div className="flex-1 w-full h-full flex overflow-hidden bg-slate-100">
            {/* Slide */}
            <div className="flex-1 flex items-center justify-center p-4">
              <img
                src={activeNotebook.pageUrls[currentPage]}
                alt={`Page ${currentPage + 1}`}
                className="max-w-full max-h-full object-contain shadow-2xl bg-white rounded-sm"
              />
            </div>

            {/* Assets Panel */}
            {showAssets && hasAssets && (
              <div className="w-1/3 max-w-[240px] min-w-[160px] bg-white border-l border-slate-200 shadow-xl overflow-y-auto p-3 custom-scrollbar z-20 flex flex-col gap-3">
                <div className="text-center">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Assets
                  </h4>
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter animate-pulse">
                    Drag to board
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {activeNotebook.assetUrls?.map((url, index) => (
                    <div
                      key={url}
                      draggable
                      onDragStart={(e) => handleDragStart(e, url)}
                      className="aspect-square bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:bg-indigo-50/50 transition-all shadow-sm group"
                    >
                      <img
                        src={url}
                        alt={`Asset ${index}`}
                        className="max-w-full max-h-full p-2 object-contain pointer-events-none group-hover:scale-110 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        }
        footer={
          <div className="p-4 border-t border-slate-200 bg-white/80 backdrop-blur-sm flex items-center justify-center gap-6 shrink-0">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl disabled:opacity-30 disabled:grayscale transition-all shadow-sm active:scale-90"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center min-w-[80px]">
              <span className="text-xs font-black text-slate-700 tracking-widest uppercase">
                {currentPage + 1} / {activeNotebook.pageUrls.length}
              </span>
              <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{
                    width: `${((currentPage + 1) / activeNotebook.pageUrls.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            <button
              disabled={currentPage === activeNotebook.pageUrls.length - 1}
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(activeNotebook.pageUrls.length - 1, p + 1)
                )
              }
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl disabled:opacity-30 disabled:grayscale transition-all shadow-sm active:scale-90"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        }
      />
    );
  }

  // Library
  return (
    <WidgetLayout
      padding="p-0"
      header={
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-sm shrink-0">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <Book className="w-5 h-5 text-indigo-500" /> Notebooks
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 active:scale-95"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
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
      }
      content={
        <div className="flex-1 w-full h-full overflow-y-auto p-5 custom-scrollbar bg-slate-50/30">
          {notebooks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 py-12">
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <FileText className="w-10 h-10 opacity-30" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black uppercase tracking-widest mb-1">
                  Library is empty
                </p>
                <p className="text-xs font-bold uppercase tracking-tighter opacity-60">
                  Import a .notebook file to begin.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {notebooks.map((notebook) => {
                const firstPageUrl = notebook.pageUrls?.[0];

                return (
                  <div
                    key={notebook.id}
                    {...getButtonAccessibilityProps(() =>
                      handleSelect(notebook.id)
                    )}
                    className="group relative aspect-[4/3] bg-white rounded-2xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all border border-slate-200 shadow-sm"
                  >
                    {firstPageUrl ? (
                      <img
                        src={firstPageUrl}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        alt={notebook.title}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300 text-xs font-black uppercase tracking-widest">
                        No Preview
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4 pt-10">
                      <p className="text-white text-xs font-black uppercase tracking-tight truncate">
                        {notebook.title}
                      </p>
                      <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                        {notebook.pageUrls.length} pages
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, notebook.id)}
                      className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-xl scale-75 group-hover:scale-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      }
    />
  );
};
