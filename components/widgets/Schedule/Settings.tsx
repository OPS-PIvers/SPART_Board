import React, { useMemo } from 'react';
import { useDashboard } from '../../../context/useDashboard';
import {
  WidgetData,
  ScheduleConfig,
  ScheduleItem,
  WidgetType,
} from '../../../types';
import {
  Type,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { Toggle } from '../../common/Toggle';

const AVAILABLE_TOOLS: { type: WidgetType; label: string }[] = [
  { type: 'clock', label: 'Clock' },
  { type: 'time-tool', label: 'Timer/Stopwatch' },
  { type: 'traffic', label: 'Traffic Light' },
  { type: 'workSymbols', label: 'Work Symbols' },
  { type: 'text', label: 'Text/Sticky Note' },
  { type: 'embed', label: 'Embed Website' },
  { type: 'sound', label: 'Sound Level' },
  { type: 'dice', label: 'Dice' },
  { type: 'random', label: 'Random Picker' },
  { type: 'poll', label: 'Poll' },
  { type: 'checklist', label: 'Checklist' },
  { type: 'drawing', label: 'Drawing' },
  { type: 'qr', label: 'QR Code' },
  { type: 'weather', label: 'Weather' },
  { type: 'calendar', label: 'Calendar' },
  { type: 'lunchCount', label: 'Lunch Count' },
  { type: 'classes', label: 'Classes/Roster' },
  { type: 'instructionalRoutines', label: 'Routines' },
  { type: 'materials', label: 'Materials' },
  { type: 'webcam', label: 'Webcam' },
  { type: 'scoreboard', label: 'Scoreboard' },
  { type: 'miniApp', label: 'Mini App' },
  { type: 'stickers', label: 'Stickers' },
  { type: 'seating-chart', label: 'Seating Chart' },
  { type: 'smartNotebook', label: 'Smart Notebook' },
  { type: 'recessGear', label: 'Recess Gear' },
];

export const ScheduleSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const config = widget.config as ScheduleConfig;
  const items = config.items ?? [];

  const hasClock = useMemo(
    () => activeDashboard?.widgets?.some((w) => w.type === 'clock') ?? false,
    [activeDashboard?.widgets]
  );

  const updateItems = (newItems: ScheduleItem[]) => {
    updateWidget(widget.id, {
      config: { ...config, items: newItems } as ScheduleConfig,
    });
  };

  const addItem = () => {
    const lastItem = items[items.length - 1];
    let nextTime = '08:00';
    if (lastItem) {
      const [h, m] = lastItem.time.split(':').map(Number);
      const total = h * 60 + m + 30;
      // Cap at 23:59 to avoid wrapping into next day
      const cappedTotal = Math.min(total, 23 * 60 + 59);
      const hours = Math.floor(cappedTotal / 60);
      const minutes = cappedTotal % 60;
      nextTime = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}`;
    }
    updateItems([
      ...items,
      {
        id: crypto.randomUUID(),
        time: nextTime,
        task: 'New Event',
        type: 'clock',
      },
    ]);
  };

  const removeItem = (idx: number) => {
    updateItems(items.filter((_, i) => i !== idx));
  };

  const moveItem = (idx: number, dir: 'up' | 'down') => {
    const next = [...items];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    updateItems(next);
  };

  const editItem = (idx: number, updates: Partial<ScheduleItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...updates };
    updateItems(next);
  };

  const fonts = [
    { id: 'global', label: 'Inherit', icon: 'G' },
    { id: 'font-mono', label: 'Digital', icon: '01' },
    { id: 'font-sans', label: 'Modern', icon: 'Aa' },
    { id: 'font-handwritten', label: 'School', icon: '✏️' },
  ];

  return (
    <div className="space-y-6">
      {/* Event Editor */}
      <div>
        <label className="text-xxs text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Clock className="w-3 h-3" /> Schedule Events
        </label>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-3"
            >
              <div className="flex gap-2">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveItem(i, 'up')}
                    disabled={i === 0}
                    className="text-slate-300 hover:text-indigo-500 disabled:opacity-30"
                    aria-label="Move event up"
                    title="Move event up"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => moveItem(i, 'down')}
                    disabled={i === items.length - 1}
                    className="text-slate-300 hover:text-indigo-500 disabled:opacity-30"
                    aria-label="Move event down"
                    title="Move event down"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={item.time}
                      onChange={(e) => editItem(i, { time: e.target.value })}
                      className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-1 w-24"
                    />
                    <span className="text-slate-300 flex items-center">to</span>
                    <input
                      type="time"
                      value={item.endTime ?? ''}
                      onChange={(e) =>
                        editItem(i, { endTime: e.target.value || undefined })
                      }
                      placeholder="End Time"
                      className="text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-1 w-24"
                    />
                    <div className="flex-1" />
                    <button
                      onClick={() => removeItem(i)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                      aria-label="Remove event"
                      title="Remove event"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={item.task}
                    onChange={(e) => editItem(i, { task: e.target.value })}
                    placeholder="Event Name"
                    className="w-full text-sm font-bold bg-transparent border-b border-slate-100 focus:border-indigo-500 outline-none pb-1"
                  />

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">
                        Type
                      </label>
                      <select
                        value={item.type ?? 'clock'}
                        onChange={(e) =>
                          editItem(i, {
                            type: e.target.value as 'clock' | 'timer',
                          })
                        }
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5"
                      >
                        <option value="clock">Clock-based</option>
                        <option value="timer">Timer-based</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold">
                        Auto-Launch
                      </label>
                      <select
                        value={item.autoLaunchWidget ?? ''}
                        onChange={(e) => {
                          const val = e.target.value || undefined;
                          editItem(i, {
                            autoLaunchWidget: val as WidgetType,
                            autoCloseWidget: val
                              ? item.autoCloseWidget
                              : undefined,
                          });
                        }}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5"
                      >
                        <option value="">None</option>
                        {AVAILABLE_TOOLS.map((t) => (
                          <option key={t.type} value={t.type}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {item.autoLaunchWidget && (
                    <div className="flex items-center justify-between bg-slate-50/50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Auto-close at end time
                      </span>
                      <Toggle
                        checked={item.autoCloseWidget ?? false}
                        onChange={(checked) =>
                          editItem(i, { autoCloseWidget: checked })
                        }
                        size="xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={addItem}
            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase"
          >
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      {/* Typography */}
      <div>
        <label className="text-xxs text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Type className="w-3 h-3" /> Typography
        </label>
        <div className="grid grid-cols-4 gap-2">
          {fonts.map((f) => (
            <button
              key={f.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: { ...config, fontFamily: f.id } as ScheduleConfig,
                })
              }
              className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                config.fontFamily === f.id ||
                (!config.fontFamily && f.id === 'global')
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <span className={`text-sm ${f.id} text-slate-900`}>{f.icon}</span>
              <span className="text-xxxs uppercase text-slate-600">
                {f.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Automation */}
      <div>
        <label className="text-xxs text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Clock className="w-3 h-3" /> Automation
        </label>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Auto-Progress
            </span>
            <Toggle
              checked={config.autoProgress ?? false}
              onChange={(checked) =>
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    autoProgress: checked,
                  } as ScheduleConfig,
                })
              }
            />
          </div>

          <p className="text-xs text-slate-500">
            Automatically check off items as time passes.
          </p>

          <div
            className={`flex items-start gap-2 p-2 rounded-lg text-xs transition-colors ${hasClock ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}
          >
            {hasClock ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>
              {hasClock
                ? 'Clock widget detected. Auto-progress active.'
                : 'Requires an active Clock widget to function.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
