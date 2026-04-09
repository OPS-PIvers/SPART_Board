import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useDashboard } from '@/context/useDashboard';
import { useAuth } from '@/context/useAuth';
import { useWidgetBuildingId } from '@/hooks/useWidgetBuildingId';
import { useClickOutside } from '@/hooks/useClickOutside';
import {
  WidgetData,
  WorkSymbolsConfig,
  WorkSymbolsGlobalConfig,
  DEFAULT_GLOBAL_STYLE,
} from '@/types';
import { WidgetLayout } from '@/components/widgets/WidgetLayout';
import { ScaledEmptyState } from '@/components/common/ScaledEmptyState';
import { getFontClass } from '@/utils/styles';
import { resolveTextPresetMultiplier } from '@/config/widgetAppearance';

export const WorkSymbolsWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const { featurePermissions } = useAuth();
  const buildingId = useWidgetBuildingId(widget);
  const config = widget.config as WorkSymbolsConfig;
  const { selectedSymbolId = null } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  // Resolve global config + building symbols
  const globalConfig = useMemo(() => {
    const perm = featurePermissions.find(
      (p) => p.widgetType === 'work-symbols'
    );
    return perm?.config as WorkSymbolsGlobalConfig | undefined;
  }, [featurePermissions]);

  const symbols = useMemo(
    () =>
      buildingId ? (globalConfig?.buildings?.[buildingId]?.symbols ?? []) : [],
    [globalConfig, buildingId]
  );

  const selectedSymbol = useMemo(
    () => symbols.find((s) => s.id === selectedSymbolId) ?? null,
    [symbols, selectedSymbolId]
  );

  // Font resolution
  const globalFont =
    activeDashboard?.globalStyle?.fontFamily ?? DEFAULT_GLOBAL_STYLE.fontFamily;
  const fontClass = getFontClass(config.fontFamily ?? 'global', globalFont);
  const sizeMultiplier = resolveTextPresetMultiplier(config.textSizePreset);
  const titlePosition = config.titlePosition ?? 'bottom';

  const updateConfig = useCallback(
    (updates: Partial<WorkSymbolsConfig>) => {
      updateWidget(widget.id, { config: { ...config, ...updates } });
    },
    [updateWidget, widget.id, config]
  );

  const handleClickOutside = useCallback(() => setIsActive(false), []);
  useClickOutside(containerRef, handleClickOutside);

  // --- Inactive + no selection ---
  if (!isActive && !selectedSymbol) {
    return (
      <div
        ref={containerRef}
        className="h-full w-full cursor-pointer"
        onClick={() => setIsActive(true)}
      >
        <ScaledEmptyState
          icon={ImageIcon}
          title="Work Symbol"
          subtitle="Click to choose"
        />
      </div>
    );
  }

  // --- Inactive + selected ---
  if (!isActive && selectedSymbol) {
    return (
      <div
        ref={containerRef}
        className="h-full w-full cursor-pointer"
        onClick={() => setIsActive(true)}
      >
        <WidgetLayout
          padding="p-0"
          content={
            <div className="relative w-full h-full bg-transparent overflow-hidden">
              <img
                src={selectedSymbol.imageUrl}
                alt={selectedSymbol.title}
                className="w-full h-full object-contain"
                draggable={false}
              />
              {/* Floating title overlay */}
              <div
                className={`absolute inset-x-0 ${titlePosition === 'top' ? 'top-0' : 'bottom-0'} pointer-events-none`}
                style={{
                  background:
                    titlePosition === 'top'
                      ? 'linear-gradient(rgba(0,0,0,0.55), transparent)'
                      : 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                  padding: 'min(16px, 4cqmin)',
                }}
              >
                <p
                  className={`font-bold text-center truncate ${fontClass}`}
                  style={{
                    fontSize: `min(${18 * sizeMultiplier}px, ${6 * sizeMultiplier}cqmin)`,
                    color: config.fontColor ?? '#ffffff',
                  }}
                >
                  {selectedSymbol.title}
                </p>
              </div>
            </div>
          }
        />
      </div>
    );
  }

  // --- Active: symbol selection grid ---
  return (
    <div ref={containerRef} className="h-full w-full">
      <WidgetLayout
        padding="p-0"
        content={
          <div
            className="h-full w-full bg-transparent overflow-y-auto custom-scrollbar"
            style={{ padding: 'min(8px, 2cqmin)' }}
          >
            {symbols.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p
                  className="text-center text-slate-400"
                  style={{ fontSize: 'min(14px, 5cqmin)' }}
                >
                  No symbols configured.
                  <br />
                  Ask an admin to add them.
                </p>
              </div>
            ) : (
              <div
                className="grid"
                style={{
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(min(80px, 25cqmin), 1fr))',
                  gap: 'min(8px, 2cqmin)',
                }}
              >
                {symbols.map((symbol) => {
                  const isSelected = selectedSymbolId === symbol.id;
                  return (
                    <button
                      key={symbol.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateConfig({
                          selectedSymbolId: isSelected ? null : symbol.id,
                        });
                      }}
                      className={`aspect-square rounded-xl overflow-hidden transition-all ${
                        isSelected
                          ? 'ring-3 ring-brand-blue-primary shadow-md border-2 border-brand-blue-primary'
                          : 'border-2 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={symbol.imageUrl}
                        alt={symbol.title}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        draggable={false}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        }
      />
    </div>
  );
};
