import React, { useState, useMemo } from 'react';
import { WidgetData, DEFAULT_GLOBAL_STYLE } from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { useTimeTool } from './useTimeTool';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { STANDARD_COLORS } from '../../../config/colors';
import { WidgetLayout } from '../WidgetLayout';
import { ProgressRing } from './ProgressRing';
import { Keypad } from './Keypad';
export { TimeToolSettings } from './Settings';

// ─── Main Widget ────────────────────────────────────────────────────────────

export const TimeToolWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const {
    displayTime,
    isRunning,
    mode,
    config,
    handleStart,
    handleStop,
    handleReset,
    setTime,
  } = useTimeTool(widget);

  const [isEditing, setIsEditing] = useState(false);

  const isVisual = config.visualType === 'visual';

  const {
    themeColor = STANDARD_COLORS.slate,
    glow = false,
    fontFamily = 'global',
    clockStyle = 'modern',
  } = config;

  // ─── Parse time into parts ───────────────────────────────────────

  const timeParts = useMemo(() => {
    const mins = Math.floor(displayTime / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor(displayTime % 60)
      .toString()
      .padStart(2, '0');
    const tenths = Math.floor((displayTime % 1) * 10).toString();
    return { mins, secs, tenths };
  }, [displayTime]);

  // ─── Derived styles ──────────────────────────────────────────────

  const getTimeColor = () => {
    if (mode === 'timer') {
      if (displayTime <= 60) return STANDARD_COLORS.red;
      if (displayTime / config.duration <= 0.25) return STANDARD_COLORS.amber;
    }
    return themeColor;
  };

  const getRingColor = () => {
    if (mode === 'timer') {
      if (displayTime <= 60) return STANDARD_COLORS.red;
      if (config.duration > 0 && displayTime / config.duration <= 0.25) {
        return STANDARD_COLORS.amber;
      }
    }
    return themeColor;
  };

  const getStyleClasses = () => {
    switch (clockStyle) {
      case 'lcd':
        return 'tracking-widest opacity-90';
      case 'minimal':
        return 'tracking-tighter';
      default:
        return '';
    }
  };

  const getFontClass = () => {
    if (fontFamily === 'global') {
      return `font-${globalStyle.fontFamily}`;
    }
    return fontFamily;
  };

  const progress =
    mode === 'timer' && config.duration > 0 ? displayTime / config.duration : 1;

  const timeColor = getTimeColor();

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div
          className={`h-full w-full flex flex-col items-center justify-center transition-all duration-500 ${
            clockStyle === 'lcd' ? 'bg-black/5' : ''
          }`}
        >
          {isEditing ? (
            <Keypad
              initialSeconds={config.elapsedTime}
              onConfirm={(s) => {
                setTime(s);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              {/* Main centering container for the time */}
              <div className="flex-1 min-h-0 w-full flex items-center justify-center relative">
                {/* Visual Ring (Absolute to widget, behind everything) */}
                {isVisual && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      width: 'min(90%, 90cqmin)',
                      height: 'min(90%, 90cqmin)',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <ProgressRing
                      progress={progress}
                      ringColor={getRingColor()}
                    />
                  </div>
                )}

                {/* The core centering unit: Time + Absolute Controls */}
                <div className="relative flex flex-col items-center justify-center">
                  <button
                    onClick={() => {
                      if (!isRunning && mode === 'timer') setIsEditing(true);
                    }}
                    disabled={isRunning || mode !== 'timer'}
                    className={`relative z-10 flex items-baseline leading-none transition-all ${getFontClass()} ${getStyleClasses()} ${
                      !isRunning && mode === 'timer'
                        ? 'cursor-pointer hover:scale-105 active:scale-95'
                        : 'cursor-default'
                    }`}
                    style={{
                      fontSize: isVisual
                        ? 'min(22cqmin, 12rem)'
                        : mode === 'stopwatch'
                          ? 'min(55cqh, 18cqw)'
                          : 'min(55cqh, 25cqw)',
                      color: timeColor,
                      textShadow: glow
                        ? `0 0 0.1em ${timeColor}, 0 0 0.25em ${timeColor}66`
                        : 'none',
                    }}
                  >
                    {clockStyle === 'lcd' && !isVisual && (
                      <div
                        className="absolute opacity-5 pointer-events-none select-none flex"
                        aria-hidden="true"
                        role="presentation"
                      >
                        <span>88</span>
                        <span className="mx-[0.25em]">:</span>
                        <span>88</span>
                        {mode === 'stopwatch' && (
                          <>
                            <span className="opacity-30 mx-[0.05em]">.</span>
                            <span>8</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Minutes and colon (shared between timer/stopwatch) */}
                    <span>{timeParts.mins}</span>
                    <span
                      className={`${clockStyle === 'minimal' ? '' : 'animate-pulse'} mx-[0.1em] opacity-30`}
                    >
                      :
                    </span>
                    <span>{timeParts.secs}</span>
                    {/* Tenths digit (stopwatch only) */}
                    {mode === 'stopwatch' && (
                      <>
                        <span
                          className="opacity-30 mx-[0.05em]"
                          style={{ fontSize: '0.5em' }}
                        >
                          .
                        </span>
                        <span
                          className="opacity-60"
                          style={{ fontSize: '0.5em' }}
                        >
                          {timeParts.tenths}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Square Controls - Positioned below the centerline without pushing it */}
                  <div
                    className="absolute z-10 flex items-center justify-center"
                    style={{
                      top: isVisual ? '120%' : '110%',
                      gap: 'min(12px, 3cqmin)',
                    }}
                  >
                    <button
                      onClick={
                        isRunning
                          ? () => handleStop()
                          : () => void handleStart()
                      }
                      className={`aspect-square flex items-center justify-center rounded-2xl transition-all active:scale-95 shadow-lg ${
                        isRunning
                          ? 'bg-slate-200/60 text-slate-500'
                          : 'bg-brand-blue-primary text-white shadow-brand-blue-primary/20'
                      }`}
                      style={{
                        width: isVisual
                          ? 'min(15cqmin, 64px)'
                          : 'min(15cqh, 12cqw)',
                        height: isVisual
                          ? 'min(15cqmin, 64px)'
                          : 'min(15cqh, 12cqw)',
                      }}
                    >
                      {isRunning ? (
                        <Pause
                          style={{ width: '50%', height: '50%' }}
                          fill="currentColor"
                        />
                      ) : (
                        <Play
                          style={{
                            width: '50%',
                            height: '50%',
                            marginLeft: '10%',
                          }}
                          fill="currentColor"
                        />
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="aspect-square flex items-center justify-center rounded-2xl bg-slate-200/60 text-slate-400 hover:bg-slate-300/70 hover:text-brand-blue-primary transition-all active:scale-95 shadow-sm"
                      style={{
                        width: isVisual
                          ? 'min(15cqmin, 64px)'
                          : 'min(15cqh, 12cqw)',
                        height: isVisual
                          ? 'min(15cqmin, 64px)'
                          : 'min(15cqh, 12cqw)',
                      }}
                      aria-label="Reset"
                    >
                      <RotateCcw style={{ width: '50%', height: '50%' }} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
