import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { GlassCard } from '../../common/GlassCard';

interface RenameFolderModalProps {
  name: string;
  title?: string;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export const RenameFolderModal: React.FC<RenameFolderModalProps> = ({
  name,
  title = 'Rename Folder',
  onClose,
  onSave,
}) => {
  const [val, setVal] = useState(name);
  return createPortal(
    <div className="fixed inset-0 z-critical flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-4">
          {title}
        </h3>
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
          placeholder="Folder name..."
          className="w-full px-4 py-3 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-brand-blue-primary text-sm font-bold mb-6"
          onKeyDown={(e) => e.key === 'Enter' && onSave(val)}
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(val)}
            className="flex-1 py-3 text-xs font-black uppercase tracking-widest text-white bg-brand-blue-primary rounded-xl hover:bg-brand-blue-dark shadow-lg shadow-brand-blue-primary/20 transition-all"
          >
            Save
          </button>
        </div>
      </GlassCard>
    </div>,
    document.body
  );
};
