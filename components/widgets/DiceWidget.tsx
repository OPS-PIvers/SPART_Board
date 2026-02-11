import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, DiceConfig, DEFAULT_GLOBAL_STYLE } from '../../types';
import { Dices, Hash, RefreshCw } from 'lucide-react';
import { SettingsLabel } from '../common/SettingsLabel';

// Singleton-like Audio Manager for Dice
let diceAudioCtx: AudioContext | null = null;

// Add type definition for webkitAudioContext
interface CustomWindow extends Window {
  webkitAudioContext: typeof AudioContext;
}

const getDiceAudioCtx = () => {
  if (!diceAudioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as CustomWindow).webkitAudioContext;
    diceAudioCtx = new AudioContextClass();
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

const DiceFace: React.FC<{
  value: number;
  isRolling: boolean;
  size?: string;
}> = ({ value, isRolling, size = '35cqmin' }) => {
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
                  relative bg-white rounded-[20%] shadow-lg border-2 border-slate-200
                  flex items-center justify-center
                  transition-all duration-300
                  ${
                    isRolling
                      ? 'scale-110 rotate-12 shadow-indigo-500/20 shadow-2xl'
                      : 'scale-100 rotate-0'
                  }
                `}
      style={{ width: size, height: size }}
    >
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full gap-1 p-[15%]">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="flex items-center justify-center">
            {dotPositions[value]?.includes(i) && (
              <div className="bg-slate-800 rounded-full shadow-sm w-[70%] h-[70%]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

import { WidgetLayout } from './WidgetLayout';

export const DiceWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as DiceConfig;
  const diceCount = config.count ?? 1;

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
      setValues(
        new Array(diceCount)
          .fill(1)
          .map(() => Math.floor(Math.random() * 6) + 1)
      );
    }
  }, [diceCount, values.length]);

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div
          className="flex flex-wrap justify-center items-center w-full h-full overflow-hidden"
          style={{ gap: '4cqmin' }}
        >
          {values.map((v, i) => (
            <DiceFace
              key={i}
              value={v}
              isRolling={isRolling}
              size={
                diceCount === 1
                  ? '60cqmin'
                  : diceCount === 2
                    ? '40cqmin'
                    : '28cqmin'
              }
            />
          ))}
        </div>
      }
      footer={
        <div className="px-2 pb-2">
          <button
            onClick={roll}
            disabled={isRolling}
            className={`
            w-full py-3 px-6 flex items-center justify-center gap-3 rounded-xl uppercase tracking-widest transition-all font-bold font-${
              globalStyle.fontFamily
            }
            ${
              isRolling
                ? 'bg-slate-100 text-slate-400'
                : 'bg-purple-600 text-white shadow-lg hover:bg-purple-700 active:scale-95'
            }
          `}
            style={{ fontSize: 'min(16px, 4cqmin)' }}
          >
            <RefreshCw
              size="1.2em"
              className={isRolling ? 'animate-spin' : ''}
            />
            {isRolling ? 'Rolling...' : 'Roll Dice'}
          </button>
        </div>
      }
    />
  );
};

export const DiceSettings: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const config = widget.config as DiceConfig;
  const { updateWidget } = useDashboard();
  const count = config.count ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <SettingsLabel icon={Hash}>Number of Dice</SettingsLabel>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, count: n } as DiceConfig,
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
              <span className="text-xl ">{n}</span>
              <span className="text-xxxs  uppercase">
                {n === 1 ? 'Dice' : 'Dice'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
        <div className="flex items-center gap-3 text-purple-700 mb-2">
          <Dices className="w-5 h-5" />
          <span className="text-xs  uppercase tracking-wider">
            Instructions
          </span>
        </div>
        <p className="text-xxs text-purple-600 leading-relaxed ">
          Select between 1 and 3 dice for your classroom activities. The dice
          will scale to fit the window as you add more.
        </p>
      </div>
    </div>
  );
};
