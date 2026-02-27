import React, { useState, useEffect, useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, CalendarConfig, CalendarGlobalConfig } from '../../types';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  Settings2,
  Ban,
} from 'lucide-react';
import { ScaledEmptyState } from '../common/ScaledEmptyState';
import { WidgetLayout } from './WidgetLayout';
import { useFeaturePermissions } from '@/hooks/useFeaturePermissions';
import { useAuth } from '@/context/useAuth';
import { Toggle } from '../common/Toggle';

export const CalendarWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const { selectedBuildings } = useAuth();
  const { subscribeToPermission } = useFeaturePermissions();
  const config = widget.config as CalendarConfig;
  const events = useMemo(() => config.events ?? [], [config.events]);
  const isBuildingSyncEnabled = config.isBuildingSyncEnabled ?? true;

  const [globalConfig, setGlobalConfig] = useState<CalendarGlobalConfig | null>(
    null
  );

  useEffect(() => {
    return subscribeToPermission('calendar', (perm) => {
      if (perm?.config) {
        const gConfig = perm.config as unknown as CalendarGlobalConfig;
        setGlobalConfig(gConfig);

        // Auto-populate logic:
        // 1. Must have sync enabled
        // 2. Local events must be empty
        // 3. User must have a building selected
        // 4. We haven't synced this building yet
        if (
          isBuildingSyncEnabled &&
          events.length === 0 &&
          selectedBuildings?.[0] &&
          config.lastSyncedBuildingId !== selectedBuildings[0]
        ) {
          const buildingId = selectedBuildings[0];
          const defaults = gConfig.buildingDefaults?.[buildingId];
          if (defaults && defaults.events?.length > 0) {
            updateWidget(widget.id, {
              config: {
                ...config,
                events: defaults.events,
                lastSyncedBuildingId: buildingId,
              } as CalendarConfig,
            });
          }
        }
      }
    });
  }, [
    subscribeToPermission,
    isBuildingSyncEnabled,
    events.length,
    selectedBuildings,
    config,
    widget.id,
    updateWidget,
  ]);

  // Blocked Date logic
  const isBlocked = useMemo(() => {
    if (!isBuildingSyncEnabled) return false;
    const today = new Date().toISOString().split('T')[0];
    return globalConfig?.blockedDates?.includes(today);
  }, [isBuildingSyncEnabled, globalConfig]);

  if (isBlocked) {
    return (
      <WidgetLayout
        padding="p-0"
        content={
          <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-rose-50/30">
            <Ban className="w-12 h-12 text-rose-400 mb-2 animate-pulse" />
            <p className="text-xs font-black uppercase text-rose-500 tracking-widest">
              Calendar Blocked
            </p>
            <p className="text-xxs text-slate-500 mt-1 font-medium leading-tight">
              A district-wide event is taking precedence today.
            </p>
          </div>
        }
      />
    );
  }

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div
          className="h-full w-full flex flex-col overflow-hidden"
          style={{ padding: 'min(16px, 3.5cqmin)' }}
        >
          <div
            className="flex-1 overflow-y-auto pr-1 custom-scrollbar flex flex-col"
            style={{ gap: 'min(12px, 2.5cqmin)' }}
          >
            {events.map((event, i: number) => (
              <div
                key={i}
                className="group relative flex bg-white rounded-2xl border border-slate-200 transition-all hover:bg-slate-50 shadow-sm"
                style={{
                  gap: 'min(16px, 3.5cqmin)',
                  padding: 'min(16px, 3.5cqmin)',
                }}
              >
                <div
                  className="flex flex-col items-center justify-center border-r border-rose-200 shrink-0"
                  style={{
                    minWidth: 'min(80px, 18cqmin)',
                    paddingRight: 'min(16px, 3.5cqmin)',
                    paddingTop: 'min(4px, 1cqmin)',
                    paddingBottom: 'min(4px, 1cqmin)',
                  }}
                >
                  <span
                    className="uppercase text-rose-400 font-black"
                    style={{ fontSize: 'min(14px, 5.5cqmin)' }}
                  >
                    {event.date.includes('-') ? 'Day' : 'Date'}
                  </span>
                  <span
                    className="text-rose-600 font-black"
                    style={{ fontSize: 'min(48px, 25cqmin)' }}
                  >
                    {event.date.includes('-')
                      ? new Date(event.date + 'T00:00:00').getDate()
                      : event.date}
                  </span>
                </div>
                <div className="flex items-center min-w-0">
                  <span
                    className="text-slate-700 font-black leading-tight truncate"
                    style={{ fontSize: 'min(24px, 8cqmin)' }}
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
    <div className="space-y-6">
      <div>
        <label className="text-xxs text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Plus className="w-3 h-3" /> Quick Add
        </label>
        <button
          onClick={addEvent}
          className="w-full py-3 bg-rose-600 text-white rounded-xl  text-xxs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-rose-700 transition-colors"
        >
          <CalendarIcon className="w-4 h-4" /> Add Local Event
        </button>
      </div>

      <hr className="border-slate-100" />

      {/* Building Sync */}
      <div>
        <label className="text-xxs text-slate-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
          <Settings2 className="w-3 h-3" /> Building Integration
        </label>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Sync Building Schedule
            </span>
            <Toggle
              checked={config.isBuildingSyncEnabled ?? true}
              onChange={(checked) =>
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    isBuildingSyncEnabled: checked,
                  } as CalendarConfig,
                })
              }
            />
          </div>
          <p className="text-xs text-slate-500">
            Automatically show A/B schedule and district events for your
            building.
          </p>
        </div>
      </div>

      <hr className="border-slate-100" />

      <div>
        <label className="text-xxs text-slate-400 uppercase tracking-widest mb-3 block">
          Current Events
        </label>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {events.map((event, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm group"
            >
              <div className="min-w-0">
                <div className="text-xxs font-black text-rose-500 uppercase tracking-wider">
                  {event.date}
                </div>
                <div className="text-sm font-bold text-slate-700 truncate">
                  {event.title}
                </div>
              </div>
              <button
                onClick={() =>
                  updateWidget(widget.id, {
                    config: {
                      ...config,
                      events: events.filter((_, idx: number) => idx !== i),
                    } as CalendarConfig,
                  })
                }
                className="p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-2xl bg-slate-50/50">
              <p className="text-xxs italic">No local events added.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
