import React from 'react';
import { Link, QrCode, X } from 'lucide-react';
import { GlassCard } from '@/components/common/GlassCard';
import { Modal } from '@/components/common/Modal';
import { GlobalStyle } from '@/types';

interface UrlPickerModalProps {
  url: string;
  onSelect: (type: 'url' | 'qr') => void;
  onClose: () => void;
  globalStyle?: GlobalStyle;
}

const PREVIEW_MAX_LENGTH = 120;

export const UrlPickerModal: React.FC<UrlPickerModalProps> = ({
  url,
  onSelect,
  onClose,
  globalStyle,
}) => {
  const preview =
    url.length > PREVIEW_MAX_LENGTH
      ? url.slice(0, PREVIEW_MAX_LENGTH).trimEnd() + '…'
      : url;

  return (
    <Modal isOpen={true} onClose={onClose} variant="bare" zIndex="z-critical">
      <GlassCard
        globalStyle={globalStyle}
        className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
              How should this link be displayed?
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-bold">
              Pick a widget type for this link
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text preview — React renders {preview} as a text node, so no XSS risk */}
        <div className="mx-6 mb-5 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-xs text-slate-500 font-black uppercase tracking-widest mb-1.5">
            Pasted link
          </p>
          <p className="text-sm text-slate-700 font-bold leading-relaxed whitespace-pre-wrap break-words">
            {preview}
          </p>
        </div>

        {/* Choice buttons */}
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => onSelect('url')}
            className="group flex flex-col items-center gap-3 p-5 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-400 rounded-2xl transition-all active:scale-95 text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center shadow-md shadow-blue-400/40 group-hover:scale-110 transition-transform">
              <Link className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-blue-800">
                Links Widget
              </p>
              <p className="text-xxs text-blue-600 font-bold mt-0.5 leading-tight">
                Clickable button on the board
              </p>
            </div>
          </button>

          <button
            onClick={() => onSelect('qr')}
            className="group flex flex-col items-center gap-3 p-5 bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-400 rounded-2xl transition-all active:scale-95 text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-500 flex items-center justify-center shadow-md shadow-purple-400/40 group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-purple-800">
                QR Code
              </p>
              <p className="text-xxs text-purple-600 font-bold mt-0.5 leading-tight">
                Scannable by student devices
              </p>
            </div>
          </button>
        </div>
      </GlassCard>
    </Modal>
  );
};
