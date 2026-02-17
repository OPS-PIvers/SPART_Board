import React, { useState } from 'react';
import { Delete, Check } from 'lucide-react';

const PRESETS = [60, 180, 300] as const;

const presetLabel = (s: number) => (s >= 60 ? `${s / 60}m` : `${s}s`);

export const Keypad: React.FC<{
  onConfirm: (totalSeconds: number) => void;
  onCancel: () => void;
  initialSeconds: number;
}> = ({ onConfirm, onCancel, initialSeconds }) => {
  const [activeField, setActiveField] = useState<'min' | 'sec'>('min');
  const [editValues, setEditValues] = useState({
    min: Math.floor(initialSeconds / 60)
      .toString()
      .padStart(3, '0'),
    sec: Math.floor(initialSeconds % 60)
      .toString()
      .padStart(2, '0'),
  });

  const handleInput = (num: string) => {
    setEditValues((prev) => {
      const current = prev[activeField];
      const limit = activeField === 'min' ? 3 : 2;
      let next = (current + num).slice(-limit).padStart(limit, '0');
      if (activeField === 'sec' && parseInt(next) > 59) next = '59';
      return { ...prev, [activeField]: next };
    });
  };

  const handleBackspace = () => {
    setEditValues((prev) => {
      const limit = activeField === 'min' ? 3 : 2;
      return {
        ...prev,
        [activeField]: prev[activeField].slice(0, -1).padStart(limit, '0'),
      };
    });
  };

  const handlePreset = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    setEditValues({
      min: mins.toString().padStart(3, '0'),
      sec: secs.toString().padStart(2, '0'),
    });
  };

  const btnBase =
    'flex items-center justify-center font-black transition-all active:scale-95 w-full h-full';

  const btnColor =
    'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

  const presetBtnColor =
    'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600';

  return (
    <div className="flex flex-col items-center justify-center w-full h-full animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
      <div
        className="flex flex-col items-center w-full h-full"
        style={{
          gap: 'min(12px, 2.5cqmin)',

          maxWidth: 'min(400px, 90cqw, 75cqh)',

          padding: 'min(12px, 3cqmin)',
        }}
      >
        {/* Time display row - Unified styling */}

        <div
          className="flex items-center font-mono font-black tabular-nums shrink-0"
          style={{
            fontSize: 'min(16cqh, 12cqw)',

            gap: 'min(8px, 2cqmin)',
          }}
        >
          <button
            onClick={() => setActiveField('min')}
            className={`border-2 transition-all ${
              activeField === 'min'
                ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary scale-105 shadow-md'
                : 'border-transparent bg-slate-100 text-slate-400 opacity-60 hover:opacity-100'
            }`}
            style={{
              padding: 'min(4px, 1.5cqh) min(16px, 4cqw)',

              borderRadius: 'min(12px, 3cqmin)',
            }}
          >
            {editValues.min}
          </button>

          <span className="text-slate-300 opacity-30">:</span>

          <button
            onClick={() => setActiveField('sec')}
            className={`border-2 transition-all ${
              activeField === 'sec'
                ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary scale-105 shadow-md'
                : 'border-transparent bg-slate-100 text-slate-400 opacity-60 hover:opacity-100'
            }`}
            style={{
              padding: 'min(4px, 1.5cqh) min(16px, 4cqw)',

              borderRadius: 'min(12px, 3cqmin)',
            }}
          >
            {editValues.sec}
          </button>
        </div>

        {/* Preset buttons row */}

        <div
          className="grid grid-cols-3 w-full shrink-0"
          style={{
            gap: 'min(8px, 1.5cqmin)',

            fontSize: 'min(4cqh, 4cqmin)',
          }}
        >
          {PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => handlePreset(s)}
              className={`rounded-xl font-black transition-all active:scale-95 ${presetBtnColor}`}
              style={{ padding: 'min(8px, 2cqmin)' }}
            >
              {presetLabel(s)}
            </button>
          ))}
        </div>

        {/* Numpad grid - The flexible centerpiece */}

        <div
          className="grid grid-cols-3 w-full flex-1 min-h-0"
          style={{
            gap: 'min(8px, 1.5cqmin)',

            fontSize: 'min(6cqh, 6cqmin)',
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleInput(n.toString())}
              className={`${btnBase} ${btnColor}`}
              style={{ borderRadius: 'min(16px, 3cqmin)' }}
            >
              {n}
            </button>
          ))}

          <button
            onClick={handleBackspace}
            className={`${btnBase} ${btnColor}`}
            style={{ borderRadius: 'min(16px, 3cqmin)' }}
            aria-label="Backspace"
          >
            <Delete style={{ width: '1.2em', height: '1.2em' }} />
          </button>

          <button
            onClick={() => handleInput('0')}
            className={`${btnBase} ${btnColor}`}
            style={{ borderRadius: 'min(16px, 3cqmin)' }}
          >
            0
          </button>

          <button
            onClick={() =>
              onConfirm(
                parseInt(editValues.min) * 60 + parseInt(editValues.sec)
              )
            }
            className={`${btnBase} bg-brand-blue-primary text-white shadow-xl hover:bg-brand-blue-light`}
            style={{ borderRadius: 'min(16px, 3cqmin)' }}
            aria-label="Confirm time"
          >
            <Check
              style={{ width: '1.4em', height: '1.4em' }}
              strokeWidth={4}
            />
          </button>
        </div>

        <button
          onClick={onCancel}
          className="shrink-0 font-black uppercase tracking-widest text-slate-400 hover:text-brand-red-primary hover:bg-brand-red-lighter/20 transition-all"
          style={{
            fontSize: 'min(12px, 3.5cqmin)',

            padding: 'min(4px, 1cqh) min(16px, 4cqw)',

            borderRadius: '999px',
          }}
          aria-label="Close keypad"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
