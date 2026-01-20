import React from 'react';
import { GripVertical, Star, Pencil, Copy, Share2, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Dashboard } from '../../types';
import { Z_INDEX } from '../../config/zIndex';

interface SortableDashboardItemProps {
  db: Dashboard;
  isActive: boolean;
  onLoad: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onDuplicate: (id: string) => void;
  onShare: (db: Dashboard) => void;
}

export const SortableDashboardItem: React.FC<SortableDashboardItemProps> = ({
  db,
  isActive,
  onLoad,
  onRename,
  onDelete,
  onSetDefault,
  onDuplicate,
  onShare,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: db.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? Z_INDEX.widgetDrag : Z_INDEX.base + 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex flex-col p-0 rounded-2xl cursor-pointer transition-all border overflow-hidden ${
        isActive
          ? 'bg-white border-brand-blue-primary shadow-md ring-1 ring-brand-blue-lighter'
          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
      } ${isDragging ? 'opacity-50 shadow-2xl scale-105' : ''}`}
      onClick={() => onLoad(db.id)}
    >
      {/* Board Thumbnail Placeholder or Image */}
      <div className="aspect-video w-full bg-slate-100 relative group-hover:bg-slate-50 transition-colors">
        {db.background?.startsWith('bg-') ? (
          <div className={`w-full h-full ${db.background}`} />
        ) : (
          <img
            src={db.background}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

        {/* Drag handle overlay */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 bg-white/90 backdrop-blur rounded-lg text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Default star overlay */}
        {db.isDefault && (
          <div className="absolute top-2 right-2 p-1 bg-amber-500 text-white rounded-full shadow-sm">
            <Star className="w-3 h-3 fill-current" />
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="min-w-0 flex-1">
            <div
              className={`font-bold text-sm truncate ${
                isActive ? 'text-brand-blue-dark' : 'text-slate-700'
              }`}
            >
              {db.name}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {new Date(db.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 border-t border-slate-50 pt-2">
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(db.id);
              }}
              className={`p-1.5 rounded-lg transition-all ${
                db.isDefault
                  ? 'text-amber-500 bg-amber-50'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
              }`}
              title={db.isDefault ? 'Default Board' : 'Set as Default'}
            >
              <Star
                className={`w-3.5 h-3.5 ${db.isDefault ? 'fill-current' : ''}`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename(db.id, db.name);
              }}
              className="p-1.5 text-slate-400 hover:text-brand-blue-primary hover:bg-brand-blue-lighter rounded-lg transition-all"
              title="Rename"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(db.id);
              }}
              className="p-1.5 text-slate-400 hover:text-brand-blue-primary hover:bg-brand-blue-lighter rounded-lg transition-all"
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(db);
              }}
              className="p-1.5 text-slate-400 hover:text-brand-blue-primary hover:bg-brand-blue-lighter rounded-lg transition-all"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <input
              type="checkbox"
              id={`delete-dashboard-${db.id}`}
              className="peer hidden"
              onClick={(e) => e.stopPropagation()}
            />
            <label
              htmlFor={`delete-dashboard-${db.id}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-slate-400 hover:text-brand-red-primary hover:bg-brand-red-lighter rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </label>
            <div className="peer-checked:flex hidden fixed inset-0 z-popover items-center justify-center bg-slate-900/40 backdrop-blur-sm">
              <div
                className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 className="text-base font-semibold text-slate-900 mb-2">
                  Delete board
                </h4>
                <p className="text-sm text-slate-600 mb-4">
                  Are you sure you want to delete “{db.name}”? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                  <label
                    htmlFor={`delete-dashboard-${db.id}`}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </label>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-red-primary hover:bg-brand-red-dark rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(db.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
