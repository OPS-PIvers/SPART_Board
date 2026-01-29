import React, { useState } from 'react';
import { Sparkles, Wand2, X, RefreshCw, Layers, Plus } from 'lucide-react';
import { useDashboard } from '../../context/useDashboard';
import { generateDashboardLayout, GeneratedLayout } from '../../utils/ai';
import { WidgetType } from '../../types';
import { Button } from '../common/Button';

interface MagicLayoutModalProps {
  onClose: () => void;
}

export const MagicLayoutModal: React.FC<MagicLayoutModalProps> = ({
  onClose,
}) => {
  const { addWidget, clearAllWidgets, addToast } = useDashboard();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedLayout | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const layout = await generateDashboardLayout(prompt);
      setResult(layout);
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : 'Generation failed',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const applyLayout = (replace: boolean) => {
    if (!result) return;

    if (replace) {
      if (
        !window.confirm(
          'This will clear your current board. Are you sure you want to replace it?'
        )
      ) {
        return;
      }
      clearAllWidgets();
    }

    // We use a small timeout to let the clear state settle if replacing,
    // although React batching often handles this, explicit delay ensures order in visual refresh.
    setTimeout(
      () => {
        result.widgets.forEach((w) => {
          addWidget(w.type as WidgetType, {
            x: w.x,
            y: w.y,
            w: w.w,
            h: w.h,
            config: w.config,
          });
        });
        addToast(
          replace ? 'Magic Layout Applied!' : 'Widgets Added!',
          'success'
        );
        onClose();
      },
      replace ? 100 : 0
    );
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wide">
                Magic Designer
              </h2>
              <p className="text-xs text-indigo-100 font-medium">
                Describe your lesson, and AI will build your board.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
          {!result ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  What are you teaching?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A 15-minute math rotation with 3 groups, a timer, and a noise meter."
                  className="w-full h-32 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      void handleGenerate();
                    }
                  }}
                />
                <div className="flex justify-between mt-2">
                  <p className="text-[10px] text-slate-400">
                    Tip: Be specific about times, groups, and tools.
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Cmd+Enter to generate
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || loading}
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 border-none"
                  icon={
                    loading ? (
                      <RefreshCw className="animate-spin w-5 h-5" />
                    ) : (
                      <Wand2 className="w-5 h-5" />
                    )
                  }
                >
                  {loading ? 'Designing...' : 'Generate Layout'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Proposed Layout
                </h3>
                <div className="space-y-2">
                  {result.widgets.map((w, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-white p-2 rounded-lg border border-indigo-100 shadow-sm"
                    >
                      <span className="text-xs font-mono text-indigo-400 font-bold w-6">
                        {i + 1}.
                      </span>
                      <span className="text-sm font-bold text-slate-700 capitalize">
                        {w.type}
                      </span>
                      <span className="text-xs text-slate-400 ml-auto font-mono">
                        {w.w}x{w.h}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => applyLayout(true)}
                  className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition-all group"
                >
                  <RefreshCw className="w-6 h-6 mb-2 text-slate-400 group-hover:text-red-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Replace Board
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Clears current widgets
                  </span>
                </button>

                <button
                  onClick={() => applyLayout(false)}
                  className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all group"
                >
                  <Plus className="w-6 h-6 mb-2 text-slate-400 group-hover:text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Add to Board
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    Keeps existing widgets
                  </span>
                </button>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setResult(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
