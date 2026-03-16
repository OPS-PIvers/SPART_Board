import React from 'react';
import { useDashboard } from '@/context/useDashboard';
import { WidgetData, HotspotImageConfig } from '@/types';
import { WidgetLayout } from '@/components/widgets/WidgetLayout';
import { MapPin, Search, Info, HelpCircle, Star, X } from 'lucide-react';

const ICON_MAP = {
  search: Search,
  info: Info,
  question: HelpCircle,
  star: Star,
};

export const HotspotImageWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as HotspotImageConfig;
  const [activePinId, setActivePinId] = React.useState<string | null>(null);

  const handlePinClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePinId(id === activePinId ? null : id);

    // Mark as viewed
    const newHotspots = config.hotspots.map((h) =>
      h.id === id ? { ...h, isViewed: true } : h
    );
    updateWidget(widget.id, {
      config: { ...config, hotspots: newHotspots },
    });
  };

  const handleClosePopover = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePinId(null);
  };

  const emptyState = (
    <div className="flex flex-col items-center justify-center h-full w-full text-slate-400 p-4 text-center">
      <MapPin className="w-12 h-12 mb-3 text-slate-300" />
      <p className="font-medium text-slate-500 mb-1">No Image Uploaded</p>
      <p className="text-sm">Click Settings to upload a base image.</p>
    </div>
  );

  return (
    <WidgetLayout
      padding="p-0"
      contentClassName="w-full h-full relative"
      content={
        config.baseImageUrl ? (
          <div
            className="w-full h-full relative bg-slate-900 overflow-hidden flex items-center justify-center"
            onClick={() => setActivePinId(null)}
          >
            {/* The actual image constraint container so pins align properly */}
            <div
              className="relative max-w-full max-h-full flex items-center justify-center"
              style={{ aspectRatio: 'auto' }}
            >
              <img
                src={config.baseImageUrl}
                alt="Base Hotspot Image"
                className="max-w-full max-h-full object-contain pointer-events-none"
              />

              {config.hotspots?.map((spot) => {
                const IconComponent = ICON_MAP[spot.icon] || Info;
                const isActive = activePinId === spot.id;

                return (
                  <div
                    key={spot.id}
                    className="absolute z-10"
                    style={{
                      left: `${spot.xPct}%`,
                      top: `${spot.yPct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <button
                      onClick={(e) => handlePinClick(spot.id, e)}
                      className={`relative flex items-center justify-center rounded-full p-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400
                        ${
                          isActive
                            ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/50 z-20'
                            : spot.isViewed
                              ? 'bg-slate-700/80 text-slate-300 hover:bg-slate-600'
                              : 'bg-emerald-500 text-white hover:bg-emerald-400 animate-pulse hover:animate-none shadow-md shadow-emerald-500/50'
                        }
                      `}
                    >
                      <IconComponent className="w-5 h-5" />
                    </button>

                    {isActive && (
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 mt-3 p-4 rounded-xl shadow-xl w-64 text-left cursor-default
                          ${
                            config.popoverTheme === 'dark'
                              ? 'bg-slate-800 text-white border border-slate-700'
                              : config.popoverTheme === 'glass'
                                ? 'bg-white/80 backdrop-blur-md text-slate-900 border border-white/40'
                                : 'bg-white text-slate-900 border border-slate-200'
                          }
                        `}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg leading-tight pr-4">
                            {spot.title}
                          </h4>
                          <button
                            onClick={handleClosePopover}
                            className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-2 -mt-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm opacity-90 leading-relaxed whitespace-pre-wrap">
                          {spot.detailText}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          emptyState
        )
      }
    />
  );
};
