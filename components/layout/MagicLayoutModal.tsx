import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Wand2, X, Loader2, Info } from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { useDashboard } from '../../context/useDashboard';
import { generateDashboardLayout } from '../../utils/ai';
import { WidgetType, WidgetConfig } from '../../types';

interface MagicLayoutModalProps {
  onClose: () => void;
}

export const MagicLayoutModal: React.FC<MagicLayoutModalProps> = ({
  onClose,
}) => {
  const { addWidgets, clearAllWidgets, addToast } = useDashboard();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shouldClear, setShouldClear] = useState(true);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      const layout = await generateDashboardLayout(prompt);

      if (shouldClear) {
        clearAllWidgets();
      }

      // Need to cast the type from string to WidgetType
      // In a real app we should validate this against TOOLS
      const widgetsToAdd = layout.widgets.map((w) => ({
        type: w.type as WidgetType,
        config: w.config as Partial<WidgetConfig>,
      }));

      addWidgets(widgetsToAdd);
      addToast('Magic Layout applied!', 'success');
      onClose();
    } catch (error) {
      console.error(error);
      addToast(
        error instanceof Error ? error.message : 'Failed to generate layout',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-lg p-0 overflow-hidden shadow-2xl ring-1 ring-white/20">
        <div className="p-4 border-b border-white/20 flex justify-between items-center bg-white/40">
          <div className="flex items-center gap-2 text-indigo-900">
            <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="font-black text-lg tracking-tight">Magic Layout</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Describe your lesson
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 20 minute math rotation with 4 groups, a timer, and noise meter."
              className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400"
              autoFocus
            />
          </div>

          <label className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 cursor-pointer hover:bg-indigo-50 transition-colors">
            <input
              type="checkbox"
              checked={shouldClear}
              onChange={(e) => setShouldClear(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <span className="text-sm font-bold text-indigo-900">
              Clear existing widgets first
            </span>
          </label>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <Info className="w-3 h-3" />
            <span>AI will select and configure the best tools for you.</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Designing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Layout
              </>
            )}
          </button>
        </div>
      </GlassCard>
    </div>,
    document.body
  );
};
