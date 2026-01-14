import React, { useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, ChecklistConfig, ChecklistItem } from '../../types';
import {
  CheckSquare,
  Square,
  ListPlus,
  Type,
  Users,
  RefreshCw,
  UserX,
} from 'lucide-react';

export const ChecklistWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addToast } = useDashboard();
  const config = widget.config as ChecklistConfig;
  const {
    items = [],
    mode = 'manual',
    firstNames = '',
    lastNames = '',
    completedNames = [],
    scaleMultiplier = 1,
    bucketNameTodo = 'Todo',
    bucketNameDone = 'Done',
  } = config;

  // --- Roster Logic ---
  const students = useMemo(() => {
    if (mode !== 'roster') return [];
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
  }, [firstNames, lastNames, mode]);

  const handleDragStart = (e: React.DragEvent, name: string) => {
    e.dataTransfer.setData('studentName', name);
  };

  const handleDrop = (e: React.DragEvent, targetBucket: 'todo' | 'done') => {
    e.preventDefault();
    const name = e.dataTransfer.getData('studentName');
    if (!name) return;

    if (targetBucket === 'done' && !completedNames.includes(name)) {
      updateWidget(widget.id, {
        config: { ...config, completedNames: [...completedNames, name] },
      });
    } else if (targetBucket === 'todo' && completedNames.includes(name)) {
      updateWidget(widget.id, {
        config: {
          ...config,
          completedNames: completedNames.filter((n) => n !== name),
        },
      });
    }
  };

  // --- Manual Logic ---
  const toggleManualItem = (itemId: string) => {
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateWidget(widget.id, {
      config: { ...config, items: newItems } as ChecklistConfig,
    });
  };

  // --- Shared Actions ---
  const resetProgress = () => {
    if (mode === 'manual') {
      const reset = items.map((i) => ({ ...i, completed: false }));
      updateWidget(widget.id, { config: { ...config, items: reset } });
    } else {
      // Move all back to Todo
      updateWidget(widget.id, { config: { ...config, completedNames: [] } });
    }
    addToast('Progress reset', 'info');
  };

  // --- Styling ---
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

  // --- RENDER: Roster Mode (Drag & Drop Buckets) ---
  if (mode === 'roster') {
    const todoList = students.filter((s) => !completedNames.includes(s));
    const doneList = students.filter((s) => completedNames.includes(s));

    return (
      <div className="h-full flex flex-col p-3 bg-white gap-3 select-none">
        {/* TODO Bucket */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'todo')}
          className="flex-1 bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-2 flex flex-col min-h-0 relative transition-colors hover:bg-indigo-100/50"
        >
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              {bucketNameTodo}
            </span>
            <span className="text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full shadow-sm">
              {todoList.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 content-start">
            {todoList.map((name) => (
              <div
                key={name}
                draggable
                onDragStart={(e) => handleDragStart(e, name)}
                className="px-3 py-1.5 bg-white border border-indigo-100 rounded-xl text-xs font-bold shadow-sm text-slate-700 cursor-grab active:cursor-grabbing hover:scale-105 hover:border-indigo-300 transition-all"
              >
                {name}
              </div>
            ))}
            {todoList.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-indigo-300/50 text-[10px] font-bold uppercase tracking-widest">
                Empty
              </div>
            )}
          </div>
        </div>

        {/* DONE Bucket */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, 'done')}
          className="flex-1 bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-2 flex flex-col min-h-0 relative transition-colors hover:bg-emerald-100/50"
        >
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
              {bucketNameDone}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-full shadow-sm">
              {doneList.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-wrap gap-2 content-start">
            {doneList.map((name) => (
              <div
                key={name}
                draggable
                onDragStart={(e) => handleDragStart(e, name)}
                className="px-3 py-1.5 bg-white border border-emerald-100 rounded-xl text-xs font-bold shadow-sm text-emerald-800 cursor-grab active:cursor-grabbing hover:scale-105 hover:border-emerald-300 transition-all"
              >
                {name}
              </div>
            ))}
            {doneList.length === 0 && (
              <div className="w-full h-full flex items-center justify-center text-emerald-300/50 text-[10px] font-bold uppercase tracking-widest">
                Drop Here
              </div>
            )}
          </div>
        </div>

        {/* Floating Reset for Roster */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 group/reset">
          <button
            onClick={resetProgress}
            className="p-2 bg-white rounded-full shadow-lg border border-slate-100 text-slate-400 hover:text-indigo-600 hover:scale-110 transition-all active:scale-90 active:rotate-180"
            title="Reset All to Todo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER: Manual Mode (Notebook List) ---
  return (
    <div className="h-full w-full bg-[#fdfdfd] relative overflow-hidden flex flex-col group">
      {/* Notebook Margin Line */}
      <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-red-100 pointer-events-none" />

      <div className="flex-1 overflow-y-auto py-4 pl-12 pr-4 custom-scrollbar">
        <ul
          style={{ gap: `${dynamicFontSize / 2}px` }}
          className="flex flex-col"
        >
          {items.map((item) => (
            <li
              key={item.id}
              onClick={() => toggleManualItem(item.id)}
              className="group/item flex items-start gap-3 cursor-pointer select-none"
            >
              <div
                className="shrink-0 transition-transform active:scale-90 flex items-center justify-center"
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
                    className="text-slate-300 group-hover/item:text-slate-400"
                    style={{
                      width: `${dynamicFontSize}px`,
                      height: `${dynamicFontSize}px`,
                    }}
                  />
                )}
              </div>
              <span
                className={`font-medium leading-tight transition-all ${item.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}
                style={{ fontSize: `${dynamicFontSize}px` }}
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Manual Reset Button */}
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={resetProgress}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 shadow-md rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-wider hover:bg-indigo-50 transition-all active:scale-95"
        >
          <RefreshCw className="w-3 h-3" /> Clear Checks
        </button>
      </div>
    </div>
  );
};

export const ChecklistSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as ChecklistConfig;
  const {
    items = [],
    mode = 'manual',
    firstNames = '',
    lastNames = '',
    scaleMultiplier = 1,
    bucketNameTodo = 'Todo',
    bucketNameDone = 'Done',
  } = config;

  const [localText, setLocalText] = React.useState(
    items.map((i) => i.text).join('\n')
  );

  const handleBulkChange = (text: string) => {
    setLocalText(text);
    const lines = text.split('\n');
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

    updateWidget(widget.id, { config: { ...config, items: newItems } });
  };

  const clearRoster = () => {
    if (confirm('Remove all students from this widget?')) {
      updateWidget(widget.id, {
        config: {
          ...config,
          firstNames: '',
          lastNames: '',
          completedNames: [],
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
          Operation Mode
        </label>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() =>
              updateWidget(widget.id, { config: { ...config, mode: 'manual' } })
            }
            className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'manual' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            <ListPlus className="w-3 h-3" /> CUSTOM
          </button>
          <button
            onClick={() =>
              updateWidget(widget.id, { config: { ...config, mode: 'roster' } })
            }
            className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'roster' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
          >
            <Users className="w-3 h-3" /> ROSTER
          </button>
        </div>
      </div>

      {mode === 'manual' ? (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <ListPlus className="w-3 h-3" /> Task List (One per line)
          </label>
          <textarea
            value={localText}
            onChange={(e) => handleBulkChange(e.target.value)}
            placeholder="Enter tasks here..."
            className="w-full h-40 p-3 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
          />
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                First Names
              </label>
              <textarea
                value={firstNames}
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: { ...config, firstNames: e.target.value },
                  })
                }
                className="w-full h-32 p-3 text-xs border border-slate-200 rounded-xl outline-none resize-none"
                placeholder="First names..."
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                Last Names
              </label>
              <textarea
                value={lastNames}
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: { ...config, lastNames: e.target.value },
                  })
                }
                className="w-full h-32 p-3 text-xs border border-slate-200 rounded-xl outline-none resize-none"
                placeholder="Last names..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 block">
                Left Bucket
              </label>
              <input
                type="text"
                value={bucketNameTodo}
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: { ...config, bucketNameTodo: e.target.value },
                  })
                }
                className="w-full px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-indigo-700"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 block">
                Right Bucket
              </label>
              <input
                type="text"
                value={bucketNameDone}
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: { ...config, bucketNameDone: e.target.value },
                  })
                }
                className="w-full px-2 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-emerald-700"
              />
            </div>
          </div>

          <button
            onClick={clearRoster}
            className="w-full py-2 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-[10px] font-black uppercase tracking-wider"
          >
            <UserX className="w-3 h-3" /> Clear All Students
          </button>
        </div>
      )}

      <div>
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Type className="w-3 h-3" /> Size Scale
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
          <span className="w-10 text-center font-mono font-bold text-slate-700 text-xs">
            {scaleMultiplier}x
          </span>
        </div>
      </div>
    </div>
  );
};
