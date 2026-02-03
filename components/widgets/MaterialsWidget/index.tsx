import React from 'react';
import {
  WidgetData,
  MaterialsConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { useScaledFont } from '../../../hooks/useScaledFont';
import { MATERIAL_ITEMS } from './constants';
import { MaterialsSettings } from './Settings';

export { MaterialsSettings };

export const MaterialsWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as MaterialsConfig;
  const selectedItems = React.useMemo(
    () => new Set(config.selectedItems || []),
    [config.selectedItems]
  );
  const activeItems = React.useMemo(
    () => new Set(config.activeItems || []),
    [config.activeItems]
  );

  const toggleActive = (id: string) => {
    const newActive = new Set(activeItems);
    if (newActive.has(id)) {
      newActive.delete(id);
    } else {
      newActive.add(id);
    }
    updateWidget(widget.id, {
      config: {
        ...config,
        activeItems: Array.from(newActive),
      },
    });
  };

  // Filter available items to only those selected in settings
  const displayItems = React.useMemo(
    () => MATERIAL_ITEMS.filter((item) => selectedItems.has(item.id)),
    [selectedItems]
  );

  const labelSize = useScaledFont(widget.w, widget.h, 0.25, 9, 24);
  const iconSize = useScaledFont(widget.w, widget.h, 1.0, 24, 80);

  if (displayItems.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-0.5 text-center text-slate-400 select-none">
        <p className="text-sm  mb-1">No materials selected</p>
        <p className="text-xs opacity-70">
          Open settings to choose class materials
        </p>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-full p-0.5 overflow-y-auto custom-scrollbar select-none font-${globalStyle.fontFamily}`}
    >
      <div className="flex flex-wrap gap-1.5 h-full items-center justify-center content-center">
        {displayItems.map((item) => {
          const isActive = activeItems.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleActive(item.id)}
              className={`flex-grow min-w-[60px] aspect-square flex flex-col items-center justify-center gap-2 p-1.5 rounded-2xl border-2 transition-all duration-300 ${
                isActive
                  ? `${item.color} ${
                      item.textColor ?? 'text-white'
                    } border-transparent shadow-lg scale-105 z-10`
                  : 'bg-white/50 border-white/20 text-slate-600 hover:bg-white/70 hover:border-white/30'
              }`}
            >
              <item.icon
                style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
                className={`transition-transform duration-300 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className=" uppercase tracking-wide text-center leading-tight"
                style={{ fontSize: `${labelSize}px` }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
