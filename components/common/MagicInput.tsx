import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, Wand2 } from 'lucide-react';
import { generateList } from '../../utils/ai';
import { Button } from './Button';

interface MagicInputProps {
  onGenerate: (items: string[]) => void;
  placeholder?: string;
  context?: string;
  buttonLabel?: string;
}

export const MagicInput: React.FC<MagicInputProps> = ({
  onGenerate,
  placeholder = "e.g. 'Solar System Planets'",
  context,
  buttonLabel = 'Magic List',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const items = await generateList(prompt, context);
      if (items.length > 0) {
        onGenerate(items);
        setIsOpen(false);
        setPrompt('');
      } else {
        setError('No items generated. Try a different prompt.');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to generate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleGenerate();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="hero"
        size="sm"
        onClick={() => setIsOpen(true)}
        icon={<Sparkles className="w-3.5 h-3.5" />}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 border-none text-white w-full"
      >
        {buttonLabel}
      </Button>
    );
  }

  return (
    <div className="bg-violet-50 border border-violet-100 p-3 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between text-violet-800">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Magic Generator
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-violet-200 rounded-full transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="relative">
        <input
          autoFocus
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-3 pr-10 py-2.5 text-sm bg-white border border-violet-200 rounded-lg outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-violet-300"
          disabled={isLoading}
        />
        <div className="absolute right-1.5 top-1.5 bottom-1.5">
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            aria-label="Generate List"
            className="h-full aspect-square flex items-center justify-center bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[10px] text-red-500 font-medium">{error}</div>
      )}

      <div className="text-[10px] text-violet-400 font-medium flex items-center gap-1">
        <Wand2 className="w-3 h-3" />
        Powered by Gemini AI
      </div>
    </div>
  );
};
