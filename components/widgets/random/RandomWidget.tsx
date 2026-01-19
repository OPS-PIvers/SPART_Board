import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { WidgetData, RandomConfig, WidgetConfig } from '../../../types';
import { Button } from '../../common/Button';
import { Users, RefreshCw, Layers, Target } from 'lucide-react';
import { getAudioCtx, playTick, playWinner } from './audioUtils';
import { RandomWheel } from './RandomWheel';
import { RandomSlots } from './RandomSlots';
import { RandomFlash } from './RandomFlash';

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

      // Find max name length to scale font
      const allNames = (displayResult as string[][]).flat();
      const maxNameLength =
        allNames.reduce((max, name) => Math.max(max, name.length), 0) || 10;

      const maxItemsInGroup = Math.max(
        ...(displayResult as string[][]).map((g: string[]) => g.length)
      );
      const linesPerRow = maxItemsInGroup + 1.5;
      const fontSizeH = availableH / rows / linesPerRow;
      // Base width calculation on character count
      const fontSizeW = availableW / cols / (maxNameLength * 0.7);
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
    if (ctx && ctx.state === 'suspended') {
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
      return (
        <RandomWheel
          students={students}
          rotation={rotation}
          wheelSize={layoutSizing.wheelSize}
          displayResult={displayResult}
          isSpinning={isSpinning}
          fontSize={layoutSizing.fontSize}
        />
      );
    }

    if (visualStyle === 'slots') {
      return (
        <RandomSlots
          displayResult={displayResult}
          fontSize={layoutSizing.fontSize}
          slotHeight={layoutSizing.slotHeight}
        />
      );
    }

    return (
      <RandomFlash
        displayResult={displayResult}
        isSpinning={isSpinning}
        fontSize={layoutSizing.fontSize}
      />
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
    <div className="h-full flex flex-col p-4 font-sans bg-white rounded-lg shadow-inner border border-slate-100 overflow-hidden relative">
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
                    draggable
                    data-no-drag="true"
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
                      className="bg-blue-50/50 border border-blue-100 rounded-2xl p-2.5 flex flex-col shadow-sm overflow-hidden"
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
                            data-no-drag="true"
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
