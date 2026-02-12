import React from 'react';
import {
  MaterialsConfig,
  DEFAULT_GLOBAL_STYLE,
  WidgetComponentProps,
} from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { Package } from 'lucide-react';
import { MATERIAL_ITEMS } from './constants';
import { MaterialsSettings } from './Settings';
import { ScaledEmptyState } from '../../common/ScaledEmptyState';

export { MaterialsSettings };

import { WidgetLayout } from '../WidgetLayout';

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

  if (displayItems.length === 0) {
    return (
      <WidgetLayout
        padding="p-0"
        content={
          <ScaledEmptyState
            icon={Package}
            title="No materials selected"
            subtitle="Open settings to choose class materials"
            className="opacity-40"
          />
        }
      />
    );
  }

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div
          className={`h-full w-full overflow-y-auto custom-scrollbar select-none font-${globalStyle.fontFamily}`}
          style={{ padding: 'min(16px, 3.5cqmin)' }}
        >
          <div
            className="flex flex-wrap h-full content-start justify-center"
            style={{ gap: 'min(12px, 2.5cqmin)' }}
          >
            {displayItems.map((item) => {
              const isActive = activeItems.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleActive(item.id)}
                  style={{
                    flexBasis: itemWidth,
                    maxWidth: itemWidth,
                    gap: 'min(6px, 1.5cqmin)',
                    padding: 'min(12px, 2.5cqmin)',
                  }}
                  className={`aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                    isActive
                      ? `${item.color} ${
                          item.textColor ?? 'text-white'
                        } border-transparent shadow-lg scale-[1.02] z-10`
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <item.icon
                    className={`w-1/2 h-1/2 transition-transform duration-300 ${
                      isActive ? 'scale-110' : 'scale-100'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className="uppercase tracking-wide text-center font-black leading-tight truncate w-full"
                    style={{ fontSize: 'min(16px, 4cqmin, 80cqw)' }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      }
    />
  );
};
