import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, CalendarConfig } from '../../types';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { ScaledEmptyState } from '../common/ScaledEmptyState';

import { WidgetLayout } from './WidgetLayout';

export const CalendarWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const config = widget.config as CalendarConfig;
  const events = config.events ?? [];

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div className="h-full w-full flex flex-col p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
            {events.map((event, i: number) => (
              <div
                key={i}
                className="group relative flex gap-3 p-3 bg-white rounded-2xl border border-slate-200 transition-all hover:bg-slate-50 shadow-sm"
              >
                <div className="flex flex-col items-center justify-center min-w-[min(60px,25cqw)] py-1 border-r border-rose-200 pr-3 shrink-0">
                  <span
                    className="uppercase text-rose-400 font-black"
                    style={{ fontSize: 'min(3cqw, 2.5cqh)' }}
                  >
                    Day
                  </span>
                  <span
                    className="text-rose-600 font-black"
                    style={{ fontSize: 'min(5cqw, 4.5cqh)' }}
                  >
                    {event.date}
                  </span>
                </div>
                <div className="flex items-center min-w-0">
                  <span
                    className="text-slate-700 font-bold leading-tight truncate"
                    style={{ fontSize: 'min(4.5cqw, 4cqh)' }}
                  >
                    {event.title}
                  </span>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <ScaledEmptyState
                icon={CalendarIcon}
                title="No Events"
                subtitle="Flip to add calendar events."
                className="opacity-40"
              />
            )}
          </div>
        </div>
      }
    />
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
        config: {
          ...config,
          events: [...events, { title, date }],
        } as CalendarConfig,
      });
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={addEvent}
        className="w-full py-3 bg-rose-600 text-white rounded-xl  text-xxs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
      >
        <Plus className="w-4 h-4" /> Add Event
      </button>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {events.map((event, i: number) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xxs"
          >
            <span className="">
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
