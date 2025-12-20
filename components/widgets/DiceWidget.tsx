import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetData } from '../../types';
import { Dices, Hash, RefreshCw } from 'lucide-react';

// Singleton-like Audio Manager for Dice
let diceAudioCtx: AudioContext | null = null;
const getDiceAudioCtx = () => {
  if (!diceAudioCtx) {
    diceAudioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
  }
  return diceAudioCtx;
};

const playRollSound = () => {
  try {
    const ctx = getDiceAudioCtx();
    if (ctx.state === 'suspended') void ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 + Math.random() * 50, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (_e) {
    // Audio failed - silently ignore
  }
};

const DiceFace: React.FC<{ value: number; isRolling: boolean }> = ({
  value,
  isRolling,
}) => {
  const dotPositions: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  return (
    <div
      className={`
      relative w-24 h-24 bg-white rounded-2xl shadow-lg border-2 border-slate-200 
      flex items-center justify-center p-4 transition-all duration-150
      ${isRolling ? 'animate-bounce scale-95 rotate-12' : 'scale-100 rotate-0'}
    `}
    >
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-1">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dotPositions[value]?.includes(i) && (
              <div className="w-3 h-3 bg-slate-800 rounded-full shadow-sm" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const DiceWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget: _updateWidget } = useDashboard();
  const diceCount = widget.config.count || 1;
  const [values, setValues] = useState<number[]>(new Array(diceCount).fill(1));
  const [isRolling, setIsRolling] = useState(false);

  const roll = async () => {
    if (isRolling) return;

    const ctx = getDiceAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();

    setIsRolling(true);
    let rolls = 0;
    const maxRolls = 10;

    const interval = setInterval(() => {
      setValues((prev) => prev.map(() => Math.floor(Math.random() * 6) + 1));
      playRollSound();
      rolls++;

      if (rolls >= maxRolls) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 100);
  };

  useEffect(() => {
    // Reset values if count changes in settings
    if (values.length !== diceCount) {
      setValues(new Array(diceCount).fill(1));
    }
  }, [diceCount]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 gap-6">
      <div className="flex flex-wrap justify-center gap-4">
        {values.map((v, i) => (
          <DiceFace key={i} value={v} isRolling={isRolling} />
        ))}
      </div>

      <button
        onClick={roll}
        disabled={isRolling}
        className={`
          flex items-center gap-2 px-8 py-3 rounded-full font-black uppercase tracking-widest transition-all
          ${
            isRolling
              ? 'bg-slate-100 text-slate-400'
              : 'bg-purple-600 text-white shadow-xl hover:bg-purple-700 active:scale-95 hover:-translate-y-1'
          }
        `}
      >
        <RefreshCw className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
        {isRolling ? 'Rolling...' : 'Roll Dice'}
      </button>
    </div>
  );
};

export const DiceSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const count = widget.config.count || 1;

  return (
    <div className="space-y-6">
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
          <Hash className="w-3 h-3" /> Number of Dice
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...widget.config, count: n },
                })
              }
              className={`
                flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all
                ${
                  count === n
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }
              `}
            >
              <span className="text-xl font-black">{n}</span>
              <span className="text-[8px] font-black uppercase">
                {n === 1 ? 'Dice' : 'Dice'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
        <div className="flex items-center gap-3 text-purple-700 mb-2">
          <Dices className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Instructions
          </span>
        </div>
        <p className="text-[10px] text-purple-600 leading-relaxed font-medium">
          Select between 1 and 3 dice for your classroom activities. The dice
          will scale to fit the window as you add more.
        </p>
      </div>
    </div>
  );
};
