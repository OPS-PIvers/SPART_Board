import React, { useState, useEffect } from 'react';
import { CatalystCategory } from '../../../types';
import * as Icons from 'lucide-react';
import { COLORS } from '../../../config/catalystColors';

interface CategoryEditorProps {
  category: CatalystCategory | null;
  categories: CatalystCategory[];
  onSave: (category: CatalystCategory) => void;
  onCancel: () => void;
}

const COMMON_ICONS = [
  'LayoutGrid',
  'Brain',
  'Settings2',
  'HelpCircle',
  'Zap',
  'BookOpen',
  'Hand',
  'Megaphone',
  'Users',
  'ListTodo',
  'Smile',
  'Star',
  'Heart',
  'Music',
  'Video',
  'Image',
  'FileText',
  'Calendar',
  'Clock',
  'Bell',
  'CheckCircle',
  'AlertCircle',
  'Info',
];

export const CategoryEditor: React.FC<CategoryEditorProps> = ({
  category,
  categories,
  onSave,
  onCancel,
}) => {
  // Local state for editing
  const [editingCat, setEditingCat] = useState<CatalystCategory | null>(null);

  useEffect(() => {
    setEditingCat(category);
  }, [category]);

  if (!editingCat) return null;

  const isNew = !categories.find((c) => c.id === editingCat.id);

  const renderIconPicker = (value: string, onChange: (val: string) => void) => {
    return (
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase text-slate-500">
          Icon (Lucide Name or URL)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm"
            placeholder="e.g. Zap or https://..."
          />
        </div>
        <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded border border-slate-200 max-h-32 overflow-y-auto">
          {COMMON_ICONS.map((name) => {
            const Icon = (
              Icons as unknown as Record<string, React.ElementType>
            )[name];
            if (!Icon) return null;
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                className={`p-1 rounded hover:bg-slate-200 ${
                  value === name ? 'bg-indigo-100 text-indigo-600' : ''
                }`}
                title={name}
                aria-label={`Select ${name} icon`}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-black text-lg text-slate-800 mb-4">
          {isNew ? 'New Category' : 'Edit Category'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Label
            </label>
            <input
              type="text"
              value={editingCat.label}
              onChange={(e) =>
                setEditingCat({
                  ...editingCat,
                  label: e.target.value,
                })
              }
              className="w-full border border-slate-300 rounded px-3 py-2"
            />
          </div>
          {renderIconPicker(editingCat.icon, (val) =>
            setEditingCat({ ...editingCat, icon: val })
          )}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEditingCat({ ...editingCat, color })}
                  className={`w-8 h-8 rounded-full ${color} ${
                    editingCat.color === color
                      ? 'ring-2 ring-offset-2 ring-slate-800'
                      : ''
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editingCat)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
