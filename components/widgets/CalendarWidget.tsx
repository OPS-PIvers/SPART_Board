import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, CalendarConfig } from '../../types';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';

export const CalendarWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const config = widget.config as CalendarConfig;
  const events = config.events ?? [];

  return (
    <div className="h-full flex flex-col p-4 bg-white rounded-lg">
      <div className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-4 flex items-center gap-2">
        <CalendarIcon className="w-3 h-3" /> Important Dates
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
        {events.map((event, i: number) => (
          <div
            key={i}
            className="group relative flex gap-3 p-3 bg-rose-50 rounded-2xl border border-rose-100 transition-all hover:bg-rose-100"
          >
            <div className="flex flex-col items-center justify-center min-w-[50px] py-1 border-r border-rose-200">
              <span className="text-[8px] font-black uppercase text-rose-400">
                Day
              </span>
              <span className="text-sm font-black text-rose-600">
                {event.date}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-xs font-bold text-slate-700 leading-tight">
                {event.title}
              </span>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 opacity-20">
            <CalendarIcon className="w-8 h-8 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest">
              No Events
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export const CalendarSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as CalendarConfig;
  const events = config.events ?? [];

  const addEvent = () => {
    const title = prompt('Event title (e.g., Art, PE, Field Trip):');
    const date = prompt('Day/Date (e.g., Monday, 10/12):');
    if (title && date) {
      updateWidget(widget.id, {
        config: { ...widget.config, events: [...events, { title, date }] },
      });
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={addEvent}
        className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
      >
        <Plus className="w-4 h-4" /> Add Event
      </button>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {events.map((event, i: number) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-[10px]"
          >
            <span className="font-bold">
              {event.date}: {event.title}
            </span>
            <button
              onClick={() =>
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    events: events.filter((_, idx: number) => idx !== i),
                  } as CalendarConfig,
                })
              }
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
