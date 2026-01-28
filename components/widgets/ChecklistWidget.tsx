import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useDashboard } from '../../context/useDashboard';
import {
  ChecklistConfig,
  ChecklistItem,
  WidgetData,
  DEFAULT_GLOBAL_STYLE,
  InstructionalRoutinesConfig,
} from '../../types';
import { RosterModeControl } from '../common/RosterModeControl';
import {
  CheckSquare,
  Square,
  ListPlus,
  Type,
  Users,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

interface ChecklistRowProps {
  id: string;
  label: string;
  isCompleted: boolean;
  dynamicFontSize: number;
  onToggle: (id: string) => void;
}

const ChecklistRow = React.memo<ChecklistRowProps>(
  ({ id, label, isCompleted, dynamicFontSize, onToggle }) => {
    return (
      <li
        onClick={() => onToggle(id)}
        className="group/item flex items-start gap-3 cursor-pointer select-none"
      >
        <div
          className="shrink-0 transition-transform active:scale-90 flex items-center justify-center"
          style={{ height: `${dynamicFontSize * 1.2}px` }}
        >
          {isCompleted ? (
            <CheckSquare
              className="text-green-500 fill-green-50"
              style={{
                width: `${dynamicFontSize}px`,
                height: `${dynamicFontSize}px`,
              }}
            />
          ) : (
            <Square
              className="text-slate-300"
              style={{
                width: `${dynamicFontSize}px`,
                height: `${dynamicFontSize}px`,
              }}
            />
          )}
        </div>
        <span
          className={`font-medium leading-tight transition-all ${isCompleted ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}
          style={{ fontSize: `${dynamicFontSize}px` }}
        >
          {label}
        </span>
      </li>
    );
  }
);
ChecklistRow.displayName = 'ChecklistRow';

export const ChecklistWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, rosters, activeRosterId, activeDashboard } =
    useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as ChecklistConfig;
  const {
    items = [],
    mode = 'manual',
    rosterMode = 'class',
    firstNames = '',
    lastNames = '',
    completedNames = [],
    scaleMultiplier = 1,
  } = config;

  const activeRoster = useMemo(
    () => rosters.find((r) => r.id === activeRosterId),
    [rosters, activeRosterId]
  );

  // Process Roster Names
  const students = useMemo(() => {
    if (mode !== 'roster') return [];

    if (rosterMode === 'class' && activeRoster) {
      return activeRoster.students.map((s) =>
        `${s.firstName} ${s.lastName}`.trim()
      );
    }

    const firsts = firstNames
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n);
    const lasts = lastNames
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n);
    const count = Math.max(firsts.length, lasts.length);
    const combined = [];
    for (let i = 0; i < count; i++) {
      const name = `${firsts[i] || ''} ${lasts[i] || ''}`.trim();
      if (name) combined.push(name);
    }
    return combined;
  }, [firstNames, lastNames, mode, rosterMode, activeRoster]);

  // Use refs to keep callback stable so we don't break memoization of children
  // This allows toggleItem to be stable across renders even when state changes
  const latestState = useRef({
    items,
    completedNames,
    config,
    widgetId: widget.id,
    mode,
  });

  useEffect(() => {
    latestState.current = {
      items,
      completedNames,
      config,
      widgetId: widget.id,
      mode,
    };
  }, [items, completedNames, config, widget.id, mode]);

  const toggleItem = useCallback(
    (idOrName: string) => {
      const { items, completedNames, config, widgetId, mode } =
        latestState.current;
      if (mode === 'manual') {
        const newItems = items.map((item) =>
          item.id === idOrName ? { ...item, completed: !item.completed } : item
        );
        updateWidget(widgetId, {
          config: { ...config, items: newItems } as ChecklistConfig,
        });
      } else {
        const isCompleted = completedNames.includes(idOrName);
        const nextCompleted = isCompleted
          ? completedNames.filter((n) => n !== idOrName)
          : [...completedNames, idOrName];
        updateWidget(widgetId, {
          config: {
            ...config,
            completedNames: nextCompleted,
          } as ChecklistConfig,
        });
      }
    },
    [updateWidget]
  );

  const resetToday = () => {
    if (mode === 'manual') {
      const reset = items.map((i) => ({ ...i, completed: false }));
      updateWidget(widget.id, { config: { ...config, items: reset } });
    } else {
      updateWidget(widget.id, { config: { ...config, completedNames: [] } });
    }
  };

  const dynamicFontSize = useMemo(() => {
    const baseSize = Math.min(widget.w / 18, widget.h / 12);
    return Math.max(12, baseSize * scaleMultiplier);
  }, [widget.w, widget.h, scaleMultiplier]);

  const hasContent = mode === 'manual' ? items.length > 0 : students.length > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center gap-3 bg-white">
        {mode === 'manual' ? (
          <ListPlus className="w-12 h-12 opacity-20" />
        ) : (
          <Users className="w-12 h-12 opacity-20" />
        )}
        <div>
          <p className="text-sm font-bold uppercase tracking-widest mb-1">
            {mode === 'manual' ? 'No Tasks' : 'Roster Empty'}
          </p>
          <p className="text-xs">
            {mode === 'manual'
              ? 'Flip to add your class tasks.'
              : 'Flip to enter your student names.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-full bg-[#fdfdfd] relative overflow-hidden flex flex-col group font-${globalStyle.fontFamily}`}
    >
      {/* Notebook Margin Line */}
      <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-red-100" />

      <div className="flex-1 overflow-y-auto py-4 pl-12 pr-4 custom-scrollbar">
        <ul
          style={{ gap: `${dynamicFontSize / 2}px` }}
          className="flex flex-col"
        >
          {(mode === 'manual' ? items : students).map((item) => {
            const isManual = typeof item !== 'string';
            const label = isManual ? item.text : item;
            const isCompleted = isManual
              ? item.completed
              : completedNames.includes(item);
            const id = isManual ? item.id : item;

            return (
              <ChecklistRow
                key={id}
                id={id}
                label={label}
                isCompleted={isCompleted}
                dynamicFontSize={dynamicFontSize}
                onToggle={toggleItem}
              />
            );
          })}
        </ul>
      </div>

      {/* Prominent Reset Button - Visible on Hover or Mobile */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={resetToday}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 shadow-md rounded-full text-xxs font-black text-indigo-600 uppercase tracking-wider hover:bg-indigo-50 transition-all active:scale-95"
        >
          <RefreshCw className="w-3 h-3" /> Reset Checks
        </button>
      </div>
    </div>
  );
};

export const ChecklistSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard, addToast } = useDashboard();
  const config = widget.config as ChecklistConfig;
  const {
    items = [],
    mode = 'manual',
    rosterMode = 'class',
    firstNames = '',
    lastNames = '',
    scaleMultiplier = 1,
  } = config;

  const [localText, setLocalText] = React.useState(
    items.map((i) => i.text).join('\n')
  );

  const debouncedText = useDebounce(localText, 500);

  useEffect(() => {
    const lines = debouncedText.split('\n');
    const newItems: ChecklistItem[] = lines
      .filter((line) => line.trim() !== '')
      .map((line, idx) => {
        const trimmedLine = line.trim();
        const existing = items.find((i) => i.text === trimmedLine);
        return {
          id: existing?.id ?? `item-${idx}-${Date.now()}`,
          text: trimmedLine,
          completed: existing?.completed ?? false,
        };
      });

    // Only update if there's a difference to prevent unnecessary renders/loops
    // This is a naive check but works for the text-based nature of this editor
    if (JSON.stringify(newItems) !== JSON.stringify(items)) {
      updateWidget(widget.id, { config: { ...config, items: newItems } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText, widget.id, updateWidget]);

  // Keep localText in sync if items are updated externally (outside this editor).
  // This avoids the textarea showing stale data while preventing update loops:
  // - If items changed externally, localText is updated here.
  // - The debounced effect below will see items already match and skip updateWidget.
  useEffect(() => {
    const itemsText = items.map((item) => item.text).join('\n');
    if (itemsText !== localText) {
      setLocalText(itemsText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleBulkChange = (text: string) => {
    setLocalText(text);
  };

  // Nexus Connection: Import from Instructional Routines
  const importFromRoutine = () => {
    const routineWidget = activeDashboard?.widgets.find(
      (w) => w.type === 'instructionalRoutines'
    );

    if (!routineWidget) {
      addToast('No Instructional Routines widget found!', 'error');
      return;
    }

    const routineConfig = routineWidget.config as InstructionalRoutinesConfig;
    const steps = routineConfig.customSteps;

    if (!steps || steps.length === 0) {
      addToast('Active routine has no steps to import.', 'info');
      return;
    }

    const newItems: ChecklistItem[] = steps.map((step) => ({
      id: crypto.randomUUID(),
      text: step.text,
      completed: false,
    }));

    updateWidget(widget.id, {
      config: {
        ...config,
        mode: 'manual',
        items: newItems,
      },
    });
    setLocalText(newItems.map((i) => i.text).join('\n'));
    addToast('Imported steps from Routine!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Nexus Connection: Routine Import */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-900">
          <BookOpen className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">
            Import Routine
          </span>
        </div>
        <button
          onClick={importFromRoutine}
          className="bg-white text-indigo-600 px-3 py-1.5 rounded-lg text-xxs font-bold uppercase shadow-sm border border-indigo-100 hover:bg-indigo-50 transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Sync
        </button>
      </div>

      {/* Mode Toggle */}
      <div>
        <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-3 block">
          List Source
        </label>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() =>
              updateWidget(widget.id, { config: { ...config, mode: 'manual' } })
            }
            className={`flex-1 py-2 text-xxs  rounded-lg transition-all ${mode === 'manual' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            CUSTOM TASKS
          </button>
          <button
            onClick={() =>
              updateWidget(widget.id, { config: { ...config, mode: 'roster' } })
            }
            className={`flex-1 py-2 text-xxs  rounded-lg transition-all ${mode === 'roster' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            CLASS ROSTER
          </button>
        </div>
      </div>

      {mode === 'manual' && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <ListPlus className="w-3 h-3" /> Task List (One per line)
          </label>
          <textarea
            value={localText}
            onChange={(e) => handleBulkChange(e.target.value)}
            placeholder="Enter tasks here..."
            className="w-full h-40 p-3 text-xs  bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
          />
        </div>
      )}

      {mode === 'roster' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <RosterModeControl
            rosterMode={rosterMode}
            onModeChange={(newMode: 'class' | 'custom') =>
              updateWidget(widget.id, {
                config: { ...config, rosterMode: newMode },
              })
            }
          />

          {rosterMode === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-2 block">
                  First Names
                </label>
                <textarea
                  value={firstNames}
                  onChange={(e) =>
                    updateWidget(widget.id, {
                      config: { ...config, firstNames: e.target.value },
                    })
                  }
                  className="w-full h-40 p-3 text-xs border border-slate-200 rounded-xl outline-none"
                  placeholder="First names..."
                />
              </div>
              <div>
                <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-2 block">
                  Last Names
                </label>
                <textarea
                  value={lastNames}
                  onChange={(e) =>
                    updateWidget(widget.id, {
                      config: { ...config, lastNames: e.target.value },
                    })
                  }
                  className="w-full h-40 p-3 text-xs border border-slate-200 rounded-xl outline-none"
                  placeholder="Last names..."
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Type className="w-3 h-3" /> Text Scale
        </label>
        <div className="flex items-center gap-4 px-2">
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={scaleMultiplier}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  scaleMultiplier: parseFloat(e.target.value),
                },
              })
            }
            className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="w-10 text-center font-mono  text-slate-700 text-xs">
            {scaleMultiplier}x
          </span>
        </div>
      </div>
    </div>
  );
};
