import React from 'react';
import { WidgetData, MaterialsConfig } from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { MATERIAL_ITEMS } from './constants';
import { MaterialsSettings } from './Settings';

export { MaterialsSettings };

export const MaterialsWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
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

  if (displayItems.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center text-slate-400 select-none">
        <p className="text-sm font-medium mb-1">No materials selected</p>
        <p className="text-xs opacity-70">
          Open settings to choose class materials
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-transparent p-3 overflow-y-auto custom-scrollbar select-none">
      <div className="flex flex-wrap gap-2 h-full content-start justify-center">
        {displayItems.map((item) => {
          const isActive = activeItems.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleActive(item.id)}
              className={`flex-grow min-w-[90px] min-h-[100px] flex flex-col items-center justify-center gap-2 p-2 rounded-2xl border-2 transition-all duration-300 ${
                isActive
                  ? `${item.color} ${
                      item.textColor ?? 'text-white'
                    } border-transparent shadow-lg scale-105 z-10`
                  : 'bg-white/50 border-white/20 text-slate-600 hover:bg-white/70 hover:border-white/30'
              }`}
            >
              <item.icon
                className={`w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wide text-center leading-tight">
                {item.label}
              </span>
            </button>
          );
        })}
        {/* Spacer elements to keep flex items aligned left/center correctly if last row is not full?
            Justify-center centers them. The prompt says "grid", but flexbox grid.
            If we want them to look like a grid but center aligned, this is fine.
        */}
      </div>
    </div>
  );
};
