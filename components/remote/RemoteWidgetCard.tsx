/**
 * RemoteWidgetCard
 *
 * Renders a full-screen mobile card for a single widget on the remote view.
 * Shows widget-type-specific controls plus Spotlight and Maximize buttons
 * that project state changes to the desktop board in real-time.
 */

import React from 'react';
import { Maximize, Minimize2, Lightbulb, LightbulbOff } from 'lucide-react';
import { WidgetData, DashboardSettings } from '@/types';
import { RemoteTimerControl } from './controls/RemoteTimerControl';
import { RemoteScoreboardControl } from './controls/RemoteScoreboardControl';
import { RemoteDiceControl } from './controls/RemoteDiceControl';
import { RemoteRandomControl } from './controls/RemoteRandomControl';
import { RemoteTrafficLightControl } from './controls/RemoteTrafficLightControl';

interface RemoteWidgetCardProps {
  widget: WidgetData;
  dashboardSettings?: DashboardSettings;
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
  updateDashboardSettings: (settings: Partial<DashboardSettings>) => void;
}

const WIDGET_LABELS: Partial<Record<string, string>> = {
  'time-tool': 'Timer / Stopwatch',
  scoreboard: 'Scoreboard',
  dice: 'Dice',
  random: 'Random Picker',
  traffic: 'Traffic Light',
};

const renderControls = (
  widget: WidgetData,
  updateWidget: (id: string, updates: Partial<WidgetData>) => void
): React.ReactNode => {
  switch (widget.type) {
    case 'time-tool':
      return <RemoteTimerControl widget={widget} updateWidget={updateWidget} />;
    case 'scoreboard':
      return (
        <RemoteScoreboardControl widget={widget} updateWidget={updateWidget} />
      );
    case 'dice':
      return <RemoteDiceControl widget={widget} updateWidget={updateWidget} />;
    case 'random':
      return (
        <RemoteRandomControl widget={widget} updateWidget={updateWidget} />
      );
    case 'traffic':
      return (
        <RemoteTrafficLightControl
          widget={widget}
          updateWidget={updateWidget}
        />
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40 p-8 text-center">
          <span className="text-4xl">🎛️</span>
          <p className="font-semibold text-sm">
            {widget.customTitle ?? WIDGET_LABELS[widget.type] ?? widget.type}
          </p>
          <p className="text-xs leading-relaxed">
            Use the Spotlight or Full Screen buttons above to display this
            widget on the classroom board.
          </p>
        </div>
      );
  }
};

export const RemoteWidgetCard: React.FC<RemoteWidgetCardProps> = ({
  widget,
  dashboardSettings,
  updateWidget,
  updateDashboardSettings,
}) => {
  const isMaximized = dashboardSettings?.maximizedWidgetId === widget.id;
  const isSpotlighted = dashboardSettings?.spotlightWidgetId === widget.id;

  const handleMaximize = () => {
    updateDashboardSettings({
      maximizedWidgetId: isMaximized ? null : widget.id,
      spotlightWidgetId: null,
    });
  };

  const handleSpotlight = () => {
    updateDashboardSettings({
      spotlightWidgetId: isSpotlighted ? null : widget.id,
      maximizedWidgetId: null,
    });
  };

  const label =
    widget.customTitle ??
    WIDGET_LABELS[widget.type] ??
    widget.type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="w-screen flex-shrink-0 flex flex-col h-full snap-start">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <span className="text-white font-black text-base uppercase tracking-wide truncate max-w-[60%]">
          {label}
        </span>

        <div className="flex items-center gap-2">
          {/* Spotlight toggle */}
          <button
            onClick={handleSpotlight}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
              isSpotlighted
                ? 'bg-yellow-400/20 border-yellow-400/60 text-yellow-300'
                : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20'
            }`}
            aria-label={isSpotlighted ? 'Remove spotlight' : 'Spotlight widget'}
            aria-pressed={isSpotlighted}
          >
            {isSpotlighted ? (
              <LightbulbOff className="w-4 h-4" />
            ) : (
              <Lightbulb className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isSpotlighted ? 'Off' : 'Spotlight'}
            </span>
          </button>

          {/* Full Screen toggle */}
          <button
            onClick={handleMaximize}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
              isMaximized
                ? 'bg-blue-500/20 border-blue-400/60 text-blue-300'
                : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20'
            }`}
            aria-label={
              isMaximized ? 'Exit full screen' : 'Full screen on board'
            }
            aria-pressed={isMaximized}
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isMaximized ? 'Exit' : 'Full Screen'}
            </span>
          </button>
        </div>
      </div>

      {/* Widget Controls */}
      <div className="flex-1 overflow-auto">
        {renderControls(widget, updateWidget)}
      </div>
    </div>
  );
};
