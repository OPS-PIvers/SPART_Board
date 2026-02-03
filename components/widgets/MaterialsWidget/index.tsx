import React from 'react';
import {
  MaterialsConfig,
  DEFAULT_GLOBAL_STYLE,
  WidgetComponentProps,
} from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { useScaledFont } from '../../../hooks/useScaledFont';
import { MATERIAL_ITEMS } from './constants';
import { MaterialsSettings } from './Settings';

export { MaterialsSettings };

export const MaterialsWidget: React.FC<WidgetComponentProps> = ({
  widget,
  scale,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as MaterialsConfig;
  const selectedItems = React.useMemo(
    () => new Set(config.selectedItems ?? []),
    [config.selectedItems]
  );
  const activeItems = React.useMemo(
    () => new Set(config.activeItems ?? []),
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

  const numItems = displayItems.length;
  // Calculate columns based on physical width (internalW * scale)
  // Threshold of 140px per card ensures 2 columns at 340px width and 1 column at ~200px
  const physicalWidth = widget.w * (scale ?? 1);
  const cols = Math.max(1, Math.min(6, Math.floor(physicalWidth / 140)));
  const actualCols = Math.min(cols, numItems ?? 1);

  // Item width calculation with gap adjustment (gap-2 = 0.5rem)
  const gapSize = 0.5;
  const gapFactor = (actualCols - 1) / actualCols;
  const itemWidth = `calc(${(100 / actualCols).toFixed(2)}% - ${(
    gapFactor * gapSize
  ).toFixed(2)}rem)`;

  // Adjust label size calculation to be slightly more responsive
  const labelSize = useScaledFont(widget.w, widget.h, 0.2, 8, 16);

  if (displayItems.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center text-slate-400 select-none">
        <p className="text-sm mb-1">No materials selected</p>
        <p className="text-xs opacity-70">
          Open settings to choose class materials
        </p>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-full p-1 overflow-y-auto custom-scrollbar select-none font-${globalStyle.fontFamily}`}
    >
      <div className="flex flex-wrap gap-2 h-full content-start justify-center">
        {displayItems.map((item) => {
          const isActive = activeItems.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleActive(item.id)}
              style={{ flexBasis: itemWidth, maxWidth: itemWidth }}
              className={`aspect-square flex flex-col items-center justify-center gap-1 p-2 rounded-2xl border-2 transition-all duration-300 ${
                isActive
                  ? `${item.color} ${
                      item.textColor ?? 'text-white'
                    } border-transparent shadow-lg scale-[1.02] z-10`
                  : 'bg-white/50 border-white/20 text-slate-600 hover:bg-white/70 hover:border-white/30'
              }`}
            >
              <item.icon
                className={`w-1/2 h-1/2 transition-transform duration-300 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className="uppercase tracking-wide text-center font-bold leading-tight truncate w-full"
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
