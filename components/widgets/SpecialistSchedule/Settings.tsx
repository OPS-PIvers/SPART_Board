import React, { useState, useMemo } from 'react';
import { useDashboard } from '@/context/useDashboard';
import {
  WidgetData,
  SpecialistScheduleConfig,
  SpecialistScheduleItem,
} from '@/types';
import {
  Settings2,
  Clock,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Type,
  Palette,
  Save,
} from 'lucide-react';
import { Button } from '@/components/common/Button';

const FONTS = [
  { id: 'global', label: 'Inherit', icon: 'G' },
  { id: 'font-mono', label: 'Digital', icon: '01' },
  { id: 'font-sans', label: 'Modern', icon: 'Aa' },
  { id: 'font-handwritten', label: 'School', icon: '✏️' },
];

export const SpecialistScheduleSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as SpecialistScheduleConfig;
  const {
    cycleLength = 6,
    schoolDays = [],
    cycleDays = [],
    dayLabel = 'Day',
    fontFamily = 'global',
    cardColor = '#ffffff',
    cardOpacity = 1,
  } = config;

  const [activeTab, setActiveTab] = useState<
    'general' | 'calendar' | 'schedules'
  >('general');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCycleDay, setSelectedCycleDay] = useState(1);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [tempItem, setTempItem] = useState<SpecialistScheduleItem | null>(null);

  // Calendar Helpers
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  const toggleSchoolDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const newSchoolDays = schoolDays.includes(dateStr)
      ? schoolDays.filter((d) => d !== dateStr)
      : [...schoolDays, dateStr];

    updateWidget(widget.id, {
      config: {
        ...config,
        schoolDays: newSchoolDays,
      } as SpecialistScheduleConfig,
    });
  };

  const handleCycleLengthChange = (length: 6 | 10) => {
    const newCycleDays = Array.from({ length }, (_, i) => {
      const existing = cycleDays.find((d) => d.dayNumber === i + 1);
      return existing ?? { dayNumber: i + 1, items: [] };
    });

    updateWidget(widget.id, {
      config: {
        ...config,
        cycleLength: length,
        cycleDays: newCycleDays,
      } as SpecialistScheduleConfig,
    });
    if (selectedCycleDay > length) setSelectedCycleDay(1);
  };

  // Schedule Item Helpers
  const currentDayConfig = cycleDays.find(
    (d) => d.dayNumber === selectedCycleDay
  ) ?? { dayNumber: selectedCycleDay, items: [] };
  const items = currentDayConfig.items;

  const startEditItem = (index: number) => {
    setEditingItemIndex(index);
    setTempItem({ ...items[index] });
  };

  const startAddItem = () => {
    setEditingItemIndex(-1);
    setTempItem({
      id: crypto.randomUUID(),
      startTime: '',
      endTime: '',
      task: '',
    });
  };

  const saveItem = () => {
    if (!tempItem) return;

    const newItems =
      editingItemIndex === -1
        ? [...items, tempItem]
        : items.map((it, i) => (i === editingItemIndex ? tempItem : it));

    // Sort items by time
    newItems.sort((a, b) => a.startTime.localeCompare(b.startTime));

    const newCycleDays = cycleDays.map((d) =>
      d.dayNumber === selectedCycleDay ? { ...d, items: newItems } : d
    );

    updateWidget(widget.id, {
      config: {
        ...config,
        cycleDays: newCycleDays,
      } as SpecialistScheduleConfig,
    });
    setEditingItemIndex(null);
    setTempItem(null);
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    const newCycleDays = cycleDays.map((d) =>
      d.dayNumber === selectedCycleDay ? { ...d, items: newItems } : d
    );
    updateWidget(widget.id, {
      config: {
        ...config,
        cycleDays: newCycleDays,
      } as SpecialistScheduleConfig,
    });
  };

  const selectAllWeekdays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const newDates = [];
    for (let i = 1; i <= lastDay; i++) {
      const d = new Date(year, month, i);
      const dayOfWeek = d.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        newDates.push(d.toISOString().split('T')[0]);
      }
    }

    // Merge with existing schoolDays, deduplicate
    const merged = Array.from(new Set([...schoolDays, ...newDates]));
    updateWidget(widget.id, {
      config: { ...config, schoolDays: merged } as SpecialistScheduleConfig,
    });
  };

  const clearMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthPrefix = `${year}-${(month + 1).toString().padStart(2, '0')}-`;

    const filtered = schoolDays.filter((d) => !d.startsWith(monthPrefix));
    updateWidget(widget.id, {
      config: { ...config, schoolDays: filtered } as SpecialistScheduleConfig,
    });
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'general' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'calendar' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Calendar
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'schedules' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Schedules
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <section className="space-y-3">
            <label className="text-xxs text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> Basic Config
            </label>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Rotation Cycle
                </span>
                <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                  <button
                    onClick={() => handleCycleLengthChange(6)}
                    className={`px-3 py-1 text-xs font-bold rounded ${cycleLength === 6 ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    6-Day
                  </button>
                  <button
                    onClick={() => handleCycleLengthChange(10)}
                    className={`px-3 py-1 text-xs font-bold rounded ${cycleLength === 10 ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    10-Block
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Label Style
                </span>
                <input
                  type="text"
                  value={dayLabel}
                  onChange={(e) =>
                    updateWidget(widget.id, {
                      config: {
                        ...config,
                        dayLabel: e.target.value,
                      } as SpecialistScheduleConfig,
                    })
                  }
                  className="w-24 px-2 py-1 text-sm border border-slate-200 rounded-lg text-right"
                  placeholder="e.g. Day"
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <label className="text-xxs text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Type className="w-3 h-3" /> Typography
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  onClick={() =>
                    updateWidget(widget.id, {
                      config: {
                        ...config,
                        fontFamily: f.id,
                      } as SpecialistScheduleConfig,
                    })
                  }
                  className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                    fontFamily === f.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className={`text-sm ${f.id} text-slate-900`}>
                    {f.icon}
                  </span>
                  <span className="text-xxxs uppercase text-slate-600">
                    {f.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <label className="text-xxs text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Palette className="w-3 h-3" /> Card Style
            </label>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Card Color
                </span>
                <input
                  type="color"
                  value={cardColor}
                  onChange={(e) =>
                    updateWidget(widget.id, {
                      config: {
                        ...config,
                        cardColor: e.target.value,
                      } as SpecialistScheduleConfig,
                    })
                  }
                  className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Opacity
                  </span>
                  <span className="text-xs text-slate-500">
                    {Math.round(cardOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={cardOpacity}
                  onChange={(e) =>
                    updateWidget(widget.id, {
                      config: {
                        ...config,
                        cardOpacity: parseFloat(e.target.value),
                      } as SpecialistScheduleConfig,
                    })
                  }
                  className="w-full accent-teal-600"
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'calendar' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="bg-slate-50 p-3 flex items-center justify-between border-b border-slate-200">
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1,
                      1
                    )
                  )
                }
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h4 className="font-bold text-slate-700">
                {currentMonth.toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </h4>
              <button
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1,
                      1
                    )
                  )
                }
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-2">
              <div className="grid grid-cols-7 mb-1">
                {['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[10px] font-black text-slate-400 uppercase"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map((date, i) => {
                  if (!date) return <div key={`pad-${i}`} />;
                  const dateStr = date.toISOString().split('T')[0];
                  const isSelected = schoolDays.includes(dateStr);
                  const isToday =
                    dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <button
                      key={dateStr}
                      onClick={() => toggleSchoolDay(date)}
                      className={`
                        aspect-square flex items-center justify-center text-xs rounded-lg font-bold transition-all
                        ${isSelected ? 'bg-teal-600 text-white shadow-sm' : 'hover:bg-slate-100 text-slate-600'}
                        ${isToday ? 'ring-2 ring-teal-200' : ''}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1 text-[10px]"
              onClick={selectAllWeekdays}
            >
              Select M-F
            </Button>
            <Button
              variant="secondary"
              className="flex-1 text-[10px]"
              onClick={clearMonth}
            >
              Clear Month
            </Button>
          </div>

          <p className="text-[11px] text-slate-500 italic text-center px-4">
            Tap dates to toggle school days. The rotation skips non-school days.
          </p>

          <div className="bg-teal-50 p-3 rounded-xl border border-teal-100 flex items-center justify-between">
            <span className="text-xs font-bold text-teal-800">
              Total School Days
            </span>
            <span className="bg-teal-600 text-white px-2 py-0.5 rounded-full text-xs font-black">
              {schoolDays.length}
            </span>
          </div>
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {editingItemIndex === null ? (
            <>
              {/* Day Selector */}
              <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                {Array.from({ length: cycleLength }, (_, i) => i + 1).map(
                  (num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedCycleDay(num)}
                      className={`
                      shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all border-2
                      ${selectedCycleDay === num ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}
                    `}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tighter">
                        {dayLabel}
                      </span>
                      <span className="text-lg font-black leading-none">
                        {num}
                      </span>
                    </button>
                  )
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xxs text-slate-400 uppercase tracking-widest block flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {dayLabel} {selectedCycleDay}{' '}
                    Schedule
                  </label>
                  <button
                    onClick={startAddItem}
                    className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {items.map((item, i) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between group shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-teal-600 tabular-nums">
                            {item.startTime}
                            {item.endTime ? ` - ${item.endTime}` : ''}
                          </span>
                        </div>
                        <div className="font-bold text-slate-700 truncate">
                          {item.task}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditItem(i)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteItem(i)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="py-8 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-xs italic">No items for this day.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 animate-in slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-black text-slate-800 uppercase tracking-wider text-sm">
                  {editingItemIndex === -1 ? 'Add New Item' : 'Edit Item'}
                </h4>
                <button
                  onClick={() => setEditingItemIndex(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    value={tempItem?.task}
                    onChange={(e) =>
                      setTempItem((prev) =>
                        prev ? { ...prev, task: e.target.value } : null
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="e.g. Art, PE, Music"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={tempItem?.startTime}
                      onChange={(e) =>
                        setTempItem((prev) =>
                          prev ? { ...prev, startTime: e.target.value } : null
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={tempItem?.endTime}
                      onChange={(e) =>
                        setTempItem((prev) =>
                          prev ? { ...prev, endTime: e.target.value } : null
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setEditingItemIndex(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 border-none"
                  onClick={saveItem}
                  disabled={!tempItem?.task || !tempItem?.startTime}
                >
                  <Save className="w-4 h-4 mr-2" /> Save
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
