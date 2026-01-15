import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, RandomConfig, WidgetConfig } from '../../types';
import { Button } from '../common/Button';
import { RosterModeControl } from '../common/RosterModeControl';
import {
  Users,
  UserPlus,
  Layers,
  RefreshCw,
  Trash2,
  Hash,
  Play,
  Target,
  List,
  Volume2,
  VolumeX,
} from 'lucide-react';

// Singleton-like Audio Manager to prevent performance issues
let audioCtx: AudioContext | null = null;

// Add type definition for webkitAudioContext
interface CustomWindow extends Window {
  webkitAudioContext: typeof AudioContext;
}

const WHEEL_COLORS = [
  '#f87171',
  '#fbbf24',
  '#34d399',
  '#60a5fa',
  '#818cf8',
  '#a78bfa',
  '#f472b6',
  '#2DD4BF',
];

const getAudioCtx = () => {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as CustomWindow).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
};

const playTick = (freq = 150, volume = 0.1) => {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') return; // Don't try to play if suspended

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (_e) {
    console.warn('Audio play failed');
  }
};

const playWinner = () => {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') return;
    const now = ctx.currentTime;

    // Subtle "Soft Chime" using two sine waves
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now); // G5 (Harmonic)

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now); // Remove high-frequency "sharpness"

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.02); // Soft attack
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6); // Gentle decay

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(now + 0.7);
    osc2.stop(now + 0.7);
  } catch (_e) {
    // Audio failed - silently ignore
  }
};

export const RandomWidget: React.FC<{ widget: WidgetData }> = ({ widget }) => {
  const { updateWidget, rosters, activeRosterId } = useDashboard();
  const config = widget.config as RandomConfig;
  const {
    firstNames = '',
    lastNames = '',
    mode = 'single',
    visualStyle = 'flash',
    groupSize = 3,
    soundEnabled = true,
    remainingStudents = [],
    rosterMode = 'class',
  } = config;

  const [isSpinning, setIsSpinning] = useState(false);
  const [displayResult, setDisplayResult] = useState<
    string | string[] | string[][]
  >(() => {
    const raw = config.lastResult;
    if (
      Array.isArray(raw) &&
      raw.length > 0 &&
      typeof raw[0] === 'object' &&
      raw[0] !== null &&
      'names' in raw[0]
    ) {
      return (raw as { names: string[] }[]).map((g) => g.names);
    }
    return (raw as string | string[] | string[][]) ?? '';
  });
  const [rotation, setRotation] = useState(0);

  // Track active roster to only clear when it actually changes
  const lastRosterRef = useRef<{ id: string | null; mode: string }>({
    id: activeRosterId,
    mode: rosterMode,
  });

  useEffect(() => {
    const rawResult = config.lastResult;
    if (
      Array.isArray(rawResult) &&
      rawResult.length > 0 &&
      typeof rawResult[0] === 'object' &&
      rawResult[0] !== null &&
      'names' in rawResult[0]
    ) {
      setDisplayResult(
        (rawResult as { names: string[] }[]).map((g) => g.names)
      );
    } else {
      setDisplayResult((rawResult as string | string[] | string[][]) ?? '');
    }
  }, [config.lastResult]);

  // Clear session data when active roster changes to avoid cross-contamination
  useEffect(() => {
    const changed =
      activeRosterId !== lastRosterRef.current.id ||
      rosterMode !== lastRosterRef.current.mode;

    if (changed) {
      lastRosterRef.current = { id: activeRosterId, mode: rosterMode };
      updateWidget(widget.id, {
        config: {
          ...config,
          lastResult: null,
          remainingStudents: [],
        },
      });
    }
  }, [activeRosterId, widget.id, updateWidget, config, rosterMode]);

  const activeRoster = useMemo(
    () => rosters.find((r) => r.id === activeRosterId),
    [rosters, activeRosterId]
  );

  const students = useMemo(() => {
    if (rosterMode === 'class' && activeRoster) {
      return activeRoster.students.map((s) =>
        `${s.firstName} ${s.lastName}`.trim()
      );
    }

    const firsts = firstNames
      .split('\n')
      .map((n: string) => n.trim())
      .filter((n: string) => n);

    const lasts = lastNames
      .split('\n')
      .map((n: string) => n.trim())
      .filter((n: string) => n);

    const count = Math.max(firsts.length, lasts.length);
    const combined = [];
    for (let i = 0; i < count; i++) {
      const f = firsts[i] || '';
      const l = lasts[i] || '';
      const name = `${f} ${l}`.trim();
      if (name) combined.push(name);
    }
    return combined;
  }, [firstNames, lastNames, activeRoster, rosterMode]);

  // Dynamic sizing calculations for all animations
  const layoutSizing = useMemo(() => {
    const availableH = widget.h - 100; // Subtract padding and button height
    const availableW = widget.w - 40;

    if (mode === 'single') {
      if (visualStyle === 'flash') {
        const fontSize = Math.min(availableW / 6, availableH / 2);
        return { fontSize };
      }
      if (visualStyle === 'slots') {
        const fontSize = Math.min(availableW / 6, availableH / 3);
        return { fontSize, slotHeight: availableH };
      }
      if (visualStyle === 'wheel') {
        const wheelSize = Math.min(availableW, availableH);
        return { wheelSize };
      }
    }

    if (
      mode === 'groups' &&
      Array.isArray(displayResult) &&
      (displayResult.length === 0 || Array.isArray(displayResult[0]))
    ) {
      const numGroups = displayResult.length;
      let cols = 1;
      if (widget.w > 600) cols = 3;
      else if (widget.w > 400) cols = 2;
      const rows = Math.ceil(numGroups / cols);
      const maxItemsInGroup = Math.max(
        ...(displayResult as string[][]).map((g: string[]) => g.length)
      );
      const linesPerRow = maxItemsInGroup + 1.5;
      const fontSizeH = availableH / rows / linesPerRow;
      const fontSizeW = availableW / cols / 12;
      const fontSize = Math.max(10, Math.min(24, fontSizeH, fontSizeW));
      return { gridCols: cols, fontSize, gap: fontSize / 2 };
    }

    return {};
  }, [mode, visualStyle, displayResult, widget.w, widget.h]);

  const shuffle = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const handlePick = async () => {
    if (students.length === 0) return;

    // CRITICAL: Resume AudioContext within the click handler to unlock sound
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.error('Audio resume failed', e);
      }
    }

    if (isSpinning) return;
    setIsSpinning(true);

    const performUpdate = (
      result: string | string[] | string[][],
      remaining?: string[]
    ) => {
      try {
        // Firestore doesn't support nested arrays (e.g., string[][]).
        // If we have groups, we transform them into an array of objects.
        let syncResult: string | string[] | { names: string[] }[] = result as
          | string
          | string[];

        if (
          mode === 'groups' &&
          Array.isArray(result) &&
          result.length > 0 &&
          Array.isArray(result[0])
        ) {
          syncResult = (result as string[][]).map((names) => ({ names }));
        }

        // Optimized update: only send what changed.
        // DashboardContext now handles deep merging of config.
        const updates: Partial<RandomConfig> = {
          lastResult: syncResult as string | string[] | { names: string[] }[],
        };
        if (remaining) {
          updates.remainingStudents = remaining;
        }

        updateWidget(widget.id, {
          config: updates as unknown as WidgetConfig,
        });
      } catch (err) {
        console.error('Randomizer Sync Error:', err);
      }
    };

    if (mode === 'single') {
      // Logic for "bag" selection:
      // 1. Get current pool from config or init with all students
      // 2. Filter pool to remove any students that were deleted from roster
      let pool =
        remainingStudents.length > 0 ? remainingStudents : [...students];
      pool = pool.filter((s) => students.includes(s));

      // 3. If pool is empty (everyone picked or all remaining deleted), reset
      if (pool.length === 0) {
        pool = [...students];
      }

      // 4. Pick winner
      const winnerIndexInPool = Math.floor(Math.random() * pool.length);
      const winnerName = pool[winnerIndexInPool];

      // 5. Calculate new remaining list
      const nextRemaining = pool.filter((_, i) => i !== winnerIndexInPool);

      if (visualStyle === 'flash') {
        let count = 0;
        const interval = setInterval(() => {
          const randomName =
            students[Math.floor(Math.random() * students.length)];
          setDisplayResult(randomName);
          if (soundEnabled) playTick(150 + Math.random() * 50);
          count++;
          if (count > 20) {
            clearInterval(interval);
            setDisplayResult(winnerName);
            if (soundEnabled) playWinner();
            setIsSpinning(false);
            performUpdate(winnerName, nextRemaining);
          }
        }, 80);
      } else if (visualStyle === 'wheel') {
        const extraSpins = 5;
        // Find index of winnerName in the full students list for wheel targeting
        let winnerIndex = students.indexOf(winnerName);
        if (winnerIndex === -1) winnerIndex = 0; // Fallback

        const segmentAngle = 360 / students.length;
        // Target the top center (90 degrees offset in SVG math).
        // We rotate the wheel so that the middle of the winning segment
        // (winnerIndex * segmentAngle + segmentAngle / 2) lands at the top.
        const targetRotation =
          rotation +
          360 * extraSpins +
          (360 - (winnerIndex * segmentAngle + segmentAngle / 2)) -
          (rotation % 360);

        setRotation(targetRotation);

        const duration = 4000;
        const startTime = Date.now();

        const tickSequence = (count: number) => {
          const elapsed = Date.now() - startTime;
          if (elapsed >= duration) {
            setDisplayResult(winnerName);
            if (soundEnabled) playWinner();
            setIsSpinning(false);
            performUpdate(winnerName, nextRemaining);
            return;
          }
          if (soundEnabled) playTick(150);
          const progress = elapsed / duration;
          const nextInterval = 50 + Math.pow(progress, 2) * 400;
          setTimeout(() => {
            tickSequence(count + 1);
          }, nextInterval);
        };
        tickSequence(0);
      } else if (visualStyle === 'slots') {
        let count = 0;
        const max = 25;
        const interval = setInterval(() => {
          const randomName =
            students[Math.floor(Math.random() * students.length)];
          setDisplayResult(randomName);
          if (soundEnabled) playTick(150, 0.05);
          count++;
          if (count > max) {
            clearInterval(interval);
            setDisplayResult(winnerName);
            if (soundEnabled) playWinner();
            setIsSpinning(false);
            performUpdate(winnerName, nextRemaining);
          }
        }, 100);
      }
    } else {
      setTimeout(() => {
        let result;
        if (mode === 'shuffle') {
          result = shuffle(students);
        } else {
          const shuffled = shuffle(students);
          result = [];
          for (let i = 0; i < shuffled.length; i += groupSize) {
            result.push(shuffled.slice(i, i + groupSize));
          }
        }
        setDisplayResult(result);
        if (soundEnabled) playWinner();
        setIsSpinning(false);
        performUpdate(result);
      }, 500);
    }
  };

  const renderSinglePick = () => {
    if (visualStyle === 'wheel' && students.length > 0) {
      const radius = 120;
      const centerX = 150;
      const centerY = 150;
      const totalNames = students.length;
      const sliceAngle = 360 / totalNames;

      return (
        <div className="relative w-full h-full flex items-center justify-center p-2 overflow-hidden">
          {/* Static Pointer Arrow (Top Center) */}
          <div className="absolute top-2 z-20 flex flex-col items-center">
            <div
              className="w-10 h-8 bg-red-600 shadow-lg"
              style={{ clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)' }}
            ></div>
          </div>

          <svg
            viewBox="0 0 300 300"
            className="w-full h-full drop-shadow-2xl transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1)"
            style={{
              transform: `rotate(${rotation}deg)`,
              maxWidth: layoutSizing.wheelSize,
              maxHeight: layoutSizing.wheelSize,
            }}
          >
            {students.map((name, i) => {
              const startAngle = i * sliceAngle;
              const endAngle = (i + 1) * sliceAngle;

              // Path calculation
              const x1 =
                centerX +
                radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
              const y1 =
                centerY +
                radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
              const x2 =
                centerX + radius * Math.cos((Math.PI * (endAngle - 90)) / 180);
              const y2 =
                centerY + radius * Math.sin((Math.PI * (endAngle - 90)) / 180);

              const largeArcFlag = sliceAngle > 180 ? 1 : 0;
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z',
              ].join(' ');

              // Radial Text Position: Mid-angle of the slice
              const midAngle = startAngle + sliceAngle / 2;

              // Dynamic Font Scaling
              const nameFactor = Math.max(1, name.length / 10);
              const classFactor = Math.max(1, totalNames / 15);
              const fontSize = Math.max(
                5,
                14 / (nameFactor * 0.4 + classFactor * 0.6)
              );

              return (
                <g key={i}>
                  <path
                    d={pathData}
                    fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
                    stroke="white"
                    strokeWidth="1"
                  />
                  {/* Radial Label Group */}
                  <g transform={`rotate(${midAngle}, ${centerX}, ${centerY})`}>
                    <text
                      x={centerX + radius * 0.85}
                      y={centerY}
                      fill="white"
                      fontSize={fontSize}
                      fontWeight="700"
                      textAnchor="end"
                      alignmentBaseline="middle"
                      className="select-none pointer-events-none drop-shadow-sm uppercase tracking-tighter"
                      transform={`rotate(90, ${centerX + radius * 0.85}, ${centerY})`}
                    >
                      {name}
                    </text>
                  </g>
                </g>
              );
            })}
            {/* Center Cap */}
            <circle
              cx={centerX}
              cy={centerY}
              r="8"
              fill="white"
              className="shadow-md"
            />
          </svg>

          {/* Winner Result Overlay (Only when not spinning) */}
          {!isSpinning && displayResult && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 z-30">
              <div
                className="bg-white/95 backdrop-blur px-8 py-4 rounded-[2rem] shadow-[0_25px_60px_rgba(0,0,0,0.3)] border-4 border-indigo-500 font-bold text-indigo-900 animate-bounce text-center max-w-full break-words"
                style={{
                  fontSize: `${layoutSizing.fontSize ?? 24}px`,
                  lineHeight: 1.1,
                }}
              >
                {displayResult}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (visualStyle === 'slots') {
      return (
        <div
          className="w-full overflow-hidden relative bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-800 shadow-[inset_0_4px_20px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center"
          style={{ height: layoutSizing.slotHeight }}
        >
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent z-10" />
          <div
            className="text-white font-bold text-center px-4 transition-all duration-75 uppercase tracking-tighter"
            style={{ fontSize: `${layoutSizing.fontSize}px`, lineHeight: 1 }}
          >
            {displayResult ?? 'Ready?'}
          </div>
          <div className="absolute left-0 right-0 h-1 bg-brand-blue-primary/20 top-1/2 -translate-y-1/2" />
        </div>
      );
    }

    return (
      <div
        className={`text-center font-bold px-4 transition-all duration-300 w-full flex items-center justify-center ${isSpinning ? 'scale-90 opacity-30 grayscale' : 'scale-100 text-brand-blue-primary drop-shadow-xl'}`}
        style={{ fontSize: `${layoutSizing.fontSize}px`, height: '100%' }}
      >
        <span className="max-w-full break-words leading-tight uppercase">
          {displayResult ?? 'Ready?'}
        </span>
      </div>
    );
  };

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center gap-3">
        <Users className="w-12 h-12 opacity-20" />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest mb-1">
            No Names Provided
          </p>
          <p className="text-xs">
            Flip this widget to enter your student roster.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 font-handwritten bg-transparent overflow-hidden relative">
      {activeRoster && rosterMode === 'class' && (
        <div className="absolute top-2 right-4 flex items-center gap-1.5 bg-brand-blue-lighter px-2 py-0.5 rounded-full border border-brand-blue-light animate-in fade-in slide-in-from-top-1">
          <Target className="w-2.5 h-2.5 text-brand-blue-primary" />
          <span className="text-[9px] font-black uppercase text-brand-blue-primary tracking-wider">
            {activeRoster.name}
          </span>
        </div>
      )}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
        {mode === 'single' ? (
          renderSinglePick()
        ) : (
          <div className="w-full h-full flex flex-col min-h-0">
            {mode === 'shuffle' ? (
              <div className="flex-1 overflow-y-auto w-full py-2 custom-scrollbar">
                {(Array.isArray(displayResult) &&
                (displayResult.length === 0 || !Array.isArray(displayResult[0]))
                  ? (displayResult as string[])
                  : []
                ).map((name: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-1.5 transition-all hover:bg-slate-100"
                  >
                    <span className="text-xs font-mono font-black text-slate-300">
                      {i + 1}
                    </span>
                    <span className="text-lg leading-none font-bold text-slate-700">
                      {name}
                    </span>
                  </div>
                ))}
                {(!displayResult ||
                  !Array.isArray(displayResult) ||
                  (displayResult.length > 0 &&
                    Array.isArray(displayResult[0]))) && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 italic py-10 gap-2">
                    <Layers className="w-8 h-8 opacity-20" />
                    <span>Click Randomize to Shuffle</span>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="flex-1 w-full grid"
                style={{
                  gridTemplateColumns: `repeat(${layoutSizing?.gridCols ?? 1}, minmax(0, 1fr))`,
                  gap: `${layoutSizing?.gap ?? 8}px`,
                }}
              >
                {(Array.isArray(displayResult) &&
                (displayResult.length === 0 || Array.isArray(displayResult[0]))
                  ? (displayResult as string[][])
                  : []
                ).map((group: string[], i: number) => {
                  if (!Array.isArray(group)) return null;
                  return (
                    <div
                      key={i}
                      className="bg-white/40 backdrop-blur-sm border border-white/20 rounded-2xl p-2.5 flex flex-col shadow-sm overflow-hidden"
                      style={{ fontSize: `${layoutSizing?.fontSize ?? 14}px` }}
                    >
                      <div
                        className="font-black uppercase text-blue-400 mb-1 tracking-widest opacity-80"
                        style={{ fontSize: '0.6em' }}
                      >
                        Group {i + 1}
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        {group.map((name, ni) => (
                          <div
                            key={ni}
                            className="font-bold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis"
                          >
                            {name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {(!displayResult ||
                  !Array.isArray(displayResult) ||
                  (displayResult.length > 0 &&
                    !Array.isArray(displayResult[0]))) && (
                  <div className="col-span-full flex flex-col items-center justify-center text-slate-300 italic h-full gap-2">
                    <Users className="w-8 h-8 opacity-20" />
                    <span>Click Randomize to Group</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Button
        variant="hero"
        size="lg"
        shape="pill"
        onClick={handlePick}
        disabled={isSpinning}
        className="mt-4 w-full shrink-0"
        icon={
          <RefreshCw
            className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`}
          />
        }
      >
        {isSpinning ? 'Picking...' : 'Randomize'}
      </Button>
    </div>
  );
};

export const RandomSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as RandomConfig;
  const {
    firstNames = '',
    lastNames = '',
    mode = 'single',
    visualStyle = 'flash',
    groupSize = 3,
    soundEnabled = true,
    rosterMode = 'class',
  } = config;

  const [localFirstNames, setLocalFirstNames] = useState(firstNames);
  const [localLastNames, setLocalLastNames] = useState(lastNames);
  const firstNamesTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastNamesTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Store latest values in refs to avoid unnecessary effect re-runs
  const configRef = useRef(config);
  const updateWidgetRef = useRef(updateWidget);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    updateWidgetRef.current = updateWidget;
  }, [updateWidget]);

  useEffect(() => {
    setLocalFirstNames(firstNames);
  }, [firstNames]);

  useEffect(() => {
    setLocalLastNames(lastNames);
  }, [lastNames]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localFirstNames !== firstNames) {
        updateWidgetRef.current(widget.id, {
          config: {
            ...configRef.current,
            firstNames: localFirstNames,
          },
        });
      }
    }, 1000);
    firstNamesTimerRef.current = timer;
    return () => clearTimeout(timer);
  }, [localFirstNames, firstNames, widget.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localLastNames !== lastNames) {
        updateWidgetRef.current(widget.id, {
          config: {
            ...configRef.current,
            lastNames: localLastNames,
          },
        });
      }
    }, 1000);
    lastNamesTimerRef.current = timer;
    return () => clearTimeout(timer);
  }, [localLastNames, lastNames, widget.id]);

  const modes = [
    { id: 'single', label: 'Pick One', icon: UserPlus },
    { id: 'shuffle', label: 'Shuffle', icon: Layers },
    { id: 'groups', label: 'Groups', icon: Users },
  ];

  const styles = [
    { id: 'flash', label: 'Standard', icon: Play },
    { id: 'wheel', label: 'Wheel', icon: Target },
    { id: 'slots', label: 'Slots', icon: List },
  ];

  return (
    <div className="space-y-6">
      <RosterModeControl
        rosterMode={rosterMode}
        onModeChange={(mode) =>
          updateWidget(widget.id, {
            config: { ...config, rosterMode: mode },
          })
        }
      />

      <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${soundEnabled ? 'bg-brand-blue-lighter text-brand-blue-primary' : 'bg-slate-100 text-slate-400'}`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-800">
              Sound Effects
            </div>
            <div className="text-[8px] text-slate-500 font-bold uppercase">
              Tick-tock while spinning
            </div>
          </div>
        </div>
        <button
          onClick={() =>
            updateWidget(widget.id, {
              config: { ...config, soundEnabled: !soundEnabled },
            })
          }
          className={`w-12 h-6 rounded-full relative transition-colors ${soundEnabled ? 'bg-brand-blue-primary' : 'bg-slate-300'}`}
        >
          <div
            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-0'}`}
          />
        </button>
      </div>

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Operation Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, mode: m.id, lastResult: null },
                })
              }
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                mode === m.id
                  ? 'border-brand-blue-primary bg-brand-blue-lighter text-brand-blue-primary'
                  : 'border-slate-100 text-slate-400 hover:border-slate-200'
              }`}
            >
              <m.icon className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {mode === 'single' && (
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
            Animation Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() =>
                  updateWidget(widget.id, {
                    config: { ...config, visualStyle: s.id },
                  })
                }
                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                  visualStyle === s.id
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <s.icon className="w-5 h-5" />
                <span className="text-[8px] font-black uppercase">
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'groups' && (
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <Hash className="w-3 h-3" /> Group Size
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="2"
              max="10"
              step="1"
              value={groupSize}
              onChange={(e) =>
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    groupSize: parseInt(e.target.value),
                  },
                })
              }
              className="flex-1 accent-brand-blue-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="w-10 text-center font-mono font-bold text-slate-700 text-sm">
              {groupSize}
            </span>
          </div>
        </div>
      )}

      {rosterMode === 'custom' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                First Names
              </label>
              <textarea
                value={localFirstNames}
                onChange={(e) => setLocalFirstNames(e.target.value)}
                onBlur={() => {
                  // Cancel debounce timer to prevent duplicate updates
                  if (firstNamesTimerRef.current) {
                    clearTimeout(firstNamesTimerRef.current);
                    firstNamesTimerRef.current = null;
                  }
                  if (localFirstNames !== firstNames) {
                    updateWidgetRef.current(widget.id, {
                      config: {
                        ...configRef.current,
                        firstNames: localFirstNames,
                      },
                    });
                  }
                }}
                placeholder="John&#10;Jane..."
                className="w-full h-32 p-3 text-xs bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-blue-primary outline-none resize-none font-sans"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Last Names
              </label>
              <textarea
                value={localLastNames}
                onChange={(e) => setLocalLastNames(e.target.value)}
                onBlur={() => {
                  // Cancel debounce timer to prevent duplicate updates
                  if (lastNamesTimerRef.current) {
                    clearTimeout(lastNamesTimerRef.current);
                    lastNamesTimerRef.current = null;
                  }
                  if (localLastNames !== lastNames) {
                    updateWidgetRef.current(widget.id, {
                      config: {
                        ...configRef.current,
                        lastNames: localLastNames,
                      },
                    });
                  }
                }}
                placeholder="Smith&#10;Doe..."
                className="w-full h-32 p-3 text-xs bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-blue-primary outline-none resize-none font-sans"
              />
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('Clear all custom student data?')) {
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    firstNames: '',
                    lastNames: '',
                    lastResult: null,
                    remainingStudents: [],
                  },
                });
              }
            }}
            className="w-full py-3 flex items-center justify-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 rounded-xl transition-colors border-2 border-dashed border-red-100"
          >
            <Trash2 className="w-4 h-4" /> Clear Custom Names
          </button>
        </>
      )}
    </div>
  );
};
