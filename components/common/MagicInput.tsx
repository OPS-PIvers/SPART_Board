import React, { useState } from 'react';
import { Wand2, Loader2, Sparkles } from 'lucide-react';
import { generateContent } from '../../utils/ai';

interface MagicInputProps<T> {
  onGenerate: (data: T) => void;
  schema: Record<string, unknown>;
  placeholder?: string;
  buttonLabel?: string;
  className?: string;
}

export function MagicInput<T>({
  onGenerate,
  schema,
  placeholder = 'Describe what you want to generate...',
  buttonLabel = 'Magic Generate',
  className = '',
}: MagicInputProps<T>) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await generateContent<T>(prompt, schema);

      if (result.success && result.data) {
        onGenerate(result.data);
        setPrompt(''); // Clear prompt on success
      } else {
        setError(result.error ?? 'Failed to generate content');
      }
    } catch (_err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[80px] p-3 pr-10 text-sm border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y bg-indigo-50/30 placeholder:text-indigo-300 text-slate-700"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              void handleGenerate();
            }
          }}
        />
        <div className="absolute top-3 right-3 text-indigo-400">
          <Sparkles className="w-4 h-4 opacity-50" />
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-500 font-medium px-1">{error}</div>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-3 h-3" />
            {buttonLabel}
          </>
        )}
      </button>
    </div>
  );
}
