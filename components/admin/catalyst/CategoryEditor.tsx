import React, { useState, useEffect, useRef } from 'react';
import { CatalystCategory } from '../../../types';
import { COLORS } from '../../../config/catalystColors';
import { Modal } from '../../common/Modal';
import { IconPicker } from './IconPicker';
import { Upload, X, Loader2 } from 'lucide-react';

interface CategoryEditorProps {
  category: CatalystCategory | null;
  categories: CatalystCategory[];
  onSave: (category: CatalystCategory) => void;
  onCancel: () => void;
  onShowMessage: (type: 'success' | 'error', text: string) => void;
  onUploadImage: (file: File) => Promise<string>;
}

export const CategoryEditor: React.FC<CategoryEditorProps> = ({
  category,
  categories,
  onSave,
  onCancel,
  onShowMessage,
  onUploadImage,
}) => {
  const [editingCat, setEditingCat] = useState<CatalystCategory | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditingCat(category);
  }, [category]);

  if (!editingCat) return null;

  const isNew = !categories.find((c) => c.id === editingCat.id);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      onShowMessage('error', 'Image must be under 5 MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingImage(true);
    try {
      const url = await onUploadImage(file);
      setEditingCat((prev) => (prev ? { ...prev, imageUrl: url } : prev));
    } catch (error) {
      console.error('Image upload failed:', error);
      onShowMessage('error', 'Image upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={isNew ? 'New Category' : 'Edit Category'}
      zIndex="z-modal-deep"
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-2 justify-end w-full">
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
      }
    >
      <div className="space-y-4">
        {/* Label */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
            Label
          </label>
          <input
            type="text"
            value={editingCat.label}
            onChange={(e) =>
              setEditingCat({ ...editingCat, label: e.target.value })
            }
            className="w-full border border-slate-300 rounded px-3 py-2"
          />
        </div>

        {/* Card Background Image */}
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
            Card Background Image
          </label>
          {editingCat.imageUrl ? (
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <img
                src={editingCat.imageUrl}
                alt="Card background preview"
                className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700">Image set</p>
                <p className="text-xs text-slate-400">
                  Overrides icon &amp; color on the category card
                </p>
              </div>
              <button
                onClick={() =>
                  setEditingCat({ ...editingCat, imageUrl: undefined })
                }
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              {uploadingImage ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload image — fills the entire card
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Icon + Color — hidden when a background image is set */}
        {!editingCat.imageUrl && (
          <>
            <IconPicker
              value={editingCat.icon}
              onChange={(val) => setEditingCat({ ...editingCat, icon: val })}
            />

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
                    title={color}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
