import React, { useMemo, useCallback } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, ChecklistConfig, ChecklistItem } from '../../types';
import { RosterModeControl } from '../common/RosterModeControl';
import {
  CheckSquare,
  Square,
  Trash2,
  ListPlus,
  Type,
  Users,
} from 'lucide-react';

export const ChecklistWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, rosters, activeRosterId } = useDashboard();
  const config = widget.config as ChecklistConfig;
  const { items = [], scaleMultiplier = 1, rosterMode = 'class' } = config;

  const activeRoster = useMemo(
    () => rosters.find((r) => r.id === activeRosterId),
    [rosters, activeRosterId]
  );

  const displayItems = useMemo(() => {
    if (rosterMode === 'class' && activeRoster) {
      return activeRoster.students.map((s) => {
        const name = `${s.firstName} ${s.lastName}`.trim();
        const existing = items.find((i) => i.text === name);
        return {
          id: existing?.id ?? `student-${s.id}`,
          text: name,
          completed: existing?.completed ?? false,
        };
      });
    }
    return items;
  }, [rosterMode, activeRoster, items]);

  const toggleItem = useCallback(
    (text: string) => {
      const existing = items.find((i) => i.text === text);
      let newItems: ChecklistItem[];

      if (existing) {
        newItems = items.map((item) =>
          item.text === text ? { ...item, completed: !item.completed } : item
        );
      } else {
        newItems = [
          ...items,
          { id: `item-${Date.now()}`, text, completed: true },
        ];
      }

      updateWidget(widget.id, {
        config: { ...config, items: newItems } as ChecklistConfig,
      });
    },
    [items, updateWidget, widget.id, config]
  );

  // Dynamically calculate font size based on widget dimensions
  const dynamicFontSize = useMemo(() => {
    const baseSize = Math.min(widget.w / 18, widget.h / 12);
    return Math.max(12, baseSize * scaleMultiplier);
  }, [widget.w, widget.h, scaleMultiplier]);

  if (displayItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center gap-3">
        <CheckSquare className="w-12 h-12 opacity-20" />
        <div>
          <p className="text-sm font-bold uppercase tracking-widest mb-1">
            No Tasks
          </p>
          <p className="text-xs">
            Flip this widget to add your class tasks or a student list.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#fdfdfd] relative overflow-hidden flex flex-col">
      {/* Notebook Margin Line */}
      <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-red-100" />

      {activeRoster && rosterMode === 'class' && (
        <div className="absolute top-2 right-4 flex items-center gap-1.5 bg-brand-blue-lighter px-2 py-0.5 rounded-full border border-brand-blue-light z-10">
          <Users className="w-2.5 h-2.5 text-brand-blue-primary" />
          <span className="text-[9px] font-black uppercase text-brand-blue-primary tracking-wider">
            {activeRoster.name}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-4 pl-12 pr-4 custom-scrollbar">
        <ul
          style={{ gap: `${dynamicFontSize / 2}px` }}
          className="flex flex-col"
        >
          {displayItems.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                toggleItem(item.text);
              }}
              className="group flex items-start gap-3 cursor-pointer select-none"
            >
              <div
                className="shrink-0 transition-transform group-active:scale-90 flex items-center justify-center"
                style={{ height: `${dynamicFontSize * 1.2}px` }}
              >
                {item.completed ? (
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
                className={`font-medium leading-tight transition-all ${
                  item.completed
                    ? 'text-slate-400 line-through decoration-slate-300'
                    : 'text-slate-700'
                }`}
                style={{ fontSize: `${dynamicFontSize}px` }}
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const ChecklistSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as ChecklistConfig;
  const items = config.items ?? [];
  const scaleMultiplier = config.scaleMultiplier ?? 1;
  const rosterMode = config.rosterMode ?? 'class';

  // Use local state for the text to prevent the "space-eating" bug during typing
  const [localText, setLocalText] = React.useState(
    items.map((i) => i.text).join('\n')
  );

  const handleBulkChange = (text: string) => {
    setLocalText(text);
    const lines = text.split('\n');

    // Process the lines into items, only trimming for the final storage
    // but not during the split to allow users to finish typing words
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

    updateWidget(widget.id, {
      config: { ...config, items: newItems } as ChecklistConfig,
    });
  };

  const clearAll = () => {
    if (confirm('Clear all tasks?')) {
      setLocalText('');
      updateWidget(widget.id, {
        config: { ...config, items: [] } as ChecklistConfig,
      });
    }
  };

  const resetProgress = () => {
    const reset = items.map((i) => ({ ...i, completed: false }));
    updateWidget(widget.id, {
      config: { ...config, items: reset } as ChecklistConfig,
    });
  };

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

      {rosterMode === 'custom' && (
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <ListPlus className="w-3 h-3" /> Task List (One per line)
          </label>
          <textarea
            value={localText}
            onChange={(e) => {
              handleBulkChange(e.target.value);
            }}
            placeholder="Enter tasks here...&#10;Math Homework&#10;Science Lab&#10;Reading Time"
            className="w-full h-40 p-3 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-primary outline-none transition-all resize-none text-slate-900 leading-relaxed"
          />
        </div>
      )}

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Type className="w-3 h-3" /> Text Scale
        </label>
        <div className="flex items-center gap-4">
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
                } as ChecklistConfig,
              })
            }
            className="flex-1 accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="w-10 text-center font-mono font-bold text-slate-700 text-xs">
            {scaleMultiplier}x
          </span>
        </div>
        <p className="mt-2 text-[8px] text-slate-400 uppercase font-bold tracking-wider">
          Text also scales automatically as you resize the window.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={resetProgress}
          disabled={items.length === 0}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          Reset Progress
        </button>
        <button
          onClick={clearAll}
          disabled={items.length === 0}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" /> Clear List
        </button>
      </div>
    </div>
  );
};
