import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, MiniAppConfig, MiniAppItem } from '../../types';
import {
  Plus,
  Play,
  Pencil,
  Trash2,
  Save,
  X,
  GripVertical,
  LayoutGrid,
  Download,
  Upload,
  Box,
  Code2,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- STORAGE HELPERS ---
const STORAGE_KEY = 'spartboard_miniapps_library';

const getLocalLibrary = (): MiniAppItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as MiniAppItem[]) : [];
  } catch (e) {
    console.error('Failed to load mini-apps', e);
    return [];
  }
};

const saveLocalLibrary = (
  apps: MiniAppItem[],
  onError?: (msg: string) => void
) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save mini-apps', e);
    if (onError)
      onError('Storage full! Please delete some apps or export your library.');
  }
};

// --- SORTABLE ITEM COMPONENT ---
interface SortableItemProps {
  app: MiniAppItem;
  onRun: (app: MiniAppItem) => void;
  onEdit: (app: MiniAppItem) => void;
  onDelete: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  app,
  onRun,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex items-center gap-3"
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="text-slate-300 cursor-grab hover:text-slate-500 touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Icon & Title */}
      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0 font-black text-xs border border-indigo-100">
        HTML
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-slate-700 text-sm truncate">
          {app.title}
        </h4>
        <div className="text-[10px] text-slate-400 font-mono">
          {(app.html.length / 1024).toFixed(1)} KB
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onRun(app)}
          className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
          title="Run App"
        >
          <Play className="w-4 h-4 fill-current" />
        </button>
        <div className="w-px h-6 bg-slate-100 mx-1"></div>
        <button
          onClick={() => onEdit(app)}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
          title="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(app.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// --- MAIN WIDGET COMPONENT ---
export const MiniAppWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, addToast } = useDashboard();
  const config = widget.config as MiniAppConfig;
  const activeApp = config.activeApp;

  // Local state for the library view
  const [library, setLibrary] = useState<MiniAppItem[]>([]);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dnd Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load library on mount
  useEffect(() => {
    setLibrary(getLocalLibrary());
  }, []);

  // --- HANDLERS ---

  const handleRun = (app: MiniAppItem) => {
    updateWidget(widget.id, {
      config: { ...config, activeApp: app },
    });
  };

  const handleCloseActive = () => {
    updateWidget(widget.id, {
      config: { ...config, activeApp: null },
    });
  };

  const handleCreate = () => {
    setEditingId(null);
    setEditTitle('');
    setEditCode(
      '<!DOCTYPE html>\n<html>\n<style>body { font-family: sans-serif; padding: 20px; text-align: center; }</style>\n<body>\n  <h1>Hello Class!</h1>\n  <p>Start creating...</p>\n</body>\n</html>'
    );
    setView('editor');
  };

  const handleEdit = (app: MiniAppItem) => {
    setEditingId(app.id);
    setEditTitle(app.title);
    setEditCode(app.html);
    setView('editor');
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this app from your local library?')) {
      const updated = library.filter((a) => a.id !== id);
      setLibrary(updated);
      saveLocalLibrary(updated, (msg) => addToast(msg, 'error'));
    }
  };

  const handleSave = () => {
    if (!editTitle.trim()) {
      addToast('Please enter a title', 'error');
      return;
    }

    let updatedLibrary;
    if (editingId) {
      updatedLibrary = library.map((app) =>
        app.id === editingId
          ? { ...app, title: editTitle, html: editCode }
          : app
      );
    } else {
      const newApp: MiniAppItem = {
        id: uuidv4(),
        title: editTitle,
        html: editCode,
        createdAt: Date.now(),
      };
      updatedLibrary = [newApp, ...library];
    }

    setLibrary(updatedLibrary);
    saveLocalLibrary(updatedLibrary);
    setView('list');
    addToast('App saved to library', 'success');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = library.findIndex((a) => a.id === active.id);
      const newIndex = library.findIndex((a) => a.id === over.id);
      const reordered = arrayMove(library, oldIndex, newIndex);
      setLibrary(reordered);
      saveLocalLibrary(reordered);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(library, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spartboard-apps-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Library exported successfully', 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as unknown;
        if (!Array.isArray(imported)) throw new Error('Invalid format');

        // Merge strategy: Add imported items to the top, preserve existing
        // Generate new IDs to avoid conflicts
        const newItems = imported
          .map((item: unknown) => {
            if (typeof item !== 'object' || item === null) return null;
            const i = item as Record<string, unknown>;
            return {
              id: `imported-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 11)}`,
              title:
                typeof i.title === 'string' && i.title
                  ? i.title
                  : 'Untitled App',
              html: typeof i.html === 'string' && i.html ? i.html : '',
              createdAt: Date.now(),
            };
          })
          .filter((item): item is MiniAppItem => item !== null);

        const merged = [...newItems, ...library];
        setLibrary(merged);
        saveLocalLibrary(merged, (msg) => addToast(msg, 'error'));
        addToast(`Imported ${newItems.length} apps`, 'success');
      } catch (err) {
        console.error(err);
        addToast('Failed to import: Invalid JSON file', 'error');
      }
    };
    reader.onerror = () => {
      addToast('Failed to read file', 'error');
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- RENDER: RUNNING MODE ---
  if (activeApp) {
    return (
      <div className="w-full h-full bg-white flex flex-col relative">
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={handleCloseActive}
            className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white backdrop-blur rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all border border-white/20"
          >
            <LayoutGrid className="w-3 h-3" /> Library
          </button>
        </div>
        <iframe
          srcDoc={activeApp.html}
          className="flex-1 w-full border-none"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          title={activeApp.title}
        />
      </div>
    );
  }

  // --- RENDER: EDITOR MODE ---
  if (view === 'editor') {
    return (
      <div className="w-full h-full bg-white flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-black text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-500" />
            {editingId ? 'Edit App' : 'New Mini-App'}
          </h3>
          <button
            onClick={() => setView('list')}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
              App Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. Lunch Randomizer"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-1 flex flex-col min-h-[300px]">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
              HTML Code
            </label>
            <textarea
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              className="flex-1 w-full p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed custom-scrollbar"
              spellCheck={false}
              placeholder="Paste your HTML, CSS, and JS here..."
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex gap-2">
          <button
            onClick={() => setView('list')}
            className="px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save App
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: LIST MODE ---
  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div>
          <h2 className="font-black text-lg text-slate-800 tracking-tight">
            App Library
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={handleExport}
              className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <Download className="w-3 h-3" /> Export
            </button>
            <span className="text-slate-300 text-[10px]">•</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <Upload className="w-3 h-3" /> Import
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-colors shadow-sm"
          title="Create New App"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 custom-scrollbar">
        {library.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[200px]">
            <div className="p-4 bg-slate-100 rounded-full">
              <Box className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm font-bold">No apps saved yet</p>
            <p className="text-xs max-w-[200px] text-center opacity-70">
              Import a file or create your first mini-app to get started.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={library.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {library.map((app) => (
                <SortableItem
                  key={app.id}
                  app={app}
                  onRun={handleRun}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest shrink-0">
        Drag to reorder • Runs Locally
      </div>
    </div>
  );
};
