import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  zIndex?: string; // e.g. "z-modal", "z-modal-deep"
  maxWidth?: string; // e.g. "max-w-md", "max-w-2xl"
  className?: string; // For additional styling on the content container
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  zIndex = 'z-modal',
  maxWidth = 'max-w-md',
  className = '',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Ensure we are in a browser environment
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} flex flex-col max-h-[90vh] ${className} animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0 mb-4 shrink-0">
          {title && (
            <h3 className="font-black text-lg text-slate-800">{title}</h3>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors ml-auto"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="p-6 pt-4 mt-auto shrink-0 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
