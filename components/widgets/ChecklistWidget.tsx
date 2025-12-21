import React, { useMemo } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { WidgetData } from '../../types';
import { CheckSquare, Square, Trash2, ListPlus, Type } from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export const ChecklistWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const items: ChecklistItem[] =
    (widget.config.items as ChecklistItem[] | undefined) ?? [];
  const scaleMultiplier =
    (widget.config.scaleMultiplier as number | undefined) ?? 1;

  const toggleItem = (itemId: string) => {
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateWidget(widget.id, { config: { ...widget.config, items: newItems } });
  };

  // Dynamically calculate font size based on widget dimensions
  const dynamicFontSize = useMemo(() => {
    const baseSize = Math.min(widget.w / 18, widget.h / 12);

    const scale: number = scaleMultiplier;
    return Math.max(12, baseSize * scale);
  }, [widget.w, widget.h, scaleMultiplier]);

  if (items.length === 0) {
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

      <div className="flex-1 overflow-y-auto py-4 pl-12 pr-4 custom-scrollbar">
        <ul
          style={{ gap: `${dynamicFontSize / 2}px` }}
          className="flex flex-col"
        >
          {items.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                toggleItem(item.id);
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

  const items: ChecklistItem[] =
    (widget.config.items as ChecklistItem[] | undefined) ?? [];

  const scaleMultiplier =
    (widget.config.scaleMultiplier as number | undefined) ?? 1;

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

    updateWidget(widget.id, { config: { ...widget.config, items: newItems } });
  };

  const clearAll = () => {
    if (confirm('Clear all tasks?')) {
      setLocalText('');
      updateWidget(widget.id, { config: { ...widget.config, items: [] } });
    }
  };

  const resetProgress = () => {
    const reset = items.map((i) => ({ ...i, completed: false }));
    updateWidget(widget.id, { config: { ...widget.config, items: reset } });
  };

  return (
    <div className="space-y-6">
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
          className="w-full h-40 p-3 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-slate-900 leading-relaxed"
        />
      </div>

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
                  ...widget.config,
                  scaleMultiplier: parseFloat(e.target.value),
                },
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
