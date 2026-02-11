import React from 'react';
import { Button } from '../../common/Button';
import { Dice5 } from 'lucide-react';

interface Props {
  mode: 'setup' | 'assign' | 'interact';
  onModeChange: (mode: 'setup' | 'assign' | 'interact') => void;
  onPickRandom: () => void;
  isAnimating: boolean;
}

export const Toolbar: React.FC<Props> = ({
  mode,
  onModeChange,
  onPickRandom,
  isAnimating,
}) => {
  return (
    <div className="h-12 bg-slate-50 border-b border-slate-200 flex items-center px-2 justify-between shrink-0">
      <div className="flex bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => onModeChange('interact')}
          className={`px-3 py-1 text-xs font-black uppercase rounded-md transition-all ${mode === 'interact' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          Interact
        </button>
        <button
          onClick={() => onModeChange('assign')}
          className={`px-3 py-1 text-xs font-black uppercase rounded-md transition-all ${mode === 'assign' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          Assign
        </button>
        <button
          onClick={() => onModeChange('setup')}
          className={`px-3 py-1 text-xs font-black uppercase rounded-md transition-all ${mode === 'setup' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          Setup
        </button>
      </div>

      {mode === 'interact' && (
        <Button
          onClick={onPickRandom}
          variant="primary"
          size="sm"
          icon={<Dice5 className="w-4 h-4" />}
          className="ml-auto"
          disabled={isAnimating}
        >
          Pick Random
        </Button>
      )}
    </div>
  );
};
