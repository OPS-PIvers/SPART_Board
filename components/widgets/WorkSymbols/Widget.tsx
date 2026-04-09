import React, { useCallback, useMemo } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { useDashboard } from '@/context/useDashboard';
import { useAuth } from '@/context/useAuth';
import { useWidgetBuildingId } from '@/hooks/useWidgetBuildingId';
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
  const { updateWidget, activeDashboard, selectedWidgetId } = useDashboard();
  const { featurePermissions } = useAuth();
  const buildingId = useWidgetBuildingId(widget);
  const config = widget.config as WorkSymbolsConfig;
  const { selectedSymbolId = null } = config;
  const isFocused = selectedWidgetId === widget.id;

  // Resolve global config
  const globalConfig = useMemo(() => {
    const perm = featurePermissions.find(
      (p) => p.widgetType === 'work-symbols'
    );
    return perm?.config as WorkSymbolsGlobalConfig | undefined;
  }, [featurePermissions]);

  // Filter symbols for current building
  const symbols = useMemo(() => {
    const all = globalConfig?.symbols ?? [];
    if (!buildingId) return all;
    return all.filter(
      (s) => s.buildings.length === 0 || s.buildings.includes(buildingId)
    );
  }, [globalConfig, buildingId]);

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

  // --- Empty state: not focused and nothing selected ---
  if (!isFocused && !selectedSymbol) {
    return (
      <WidgetLayout
        padding="p-0"
        content={
          <ScaledEmptyState
            icon={ImageIcon}
            title="Work Symbol"
            subtitle="Focus widget to choose"
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
          className="h-full w-full bg-transparent overflow-hidden select-none flex flex-col"
          style={{ padding: 'min(8px, 2cqmin)' }}
        >
          {/* Main display: selected symbol fills area */}
          <div className="flex-1 min-h-0 relative flex items-center justify-center">
            {selectedSymbol ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={selectedSymbol.imageUrl}
                  alt={selectedSymbol.title}
                  className="max-w-full max-h-full object-contain"
                  draggable={false}
                />
                {/* Title overlay */}
                <div
                  className={`absolute inset-x-0 ${titlePosition === 'top' ? 'top-0' : 'bottom-0'} pointer-events-none`}
                  style={{ padding: 'min(8px, 2cqmin)' }}
                >
                  <p
                    className={`font-bold text-center truncate ${fontClass}`}
                    style={{
                      fontSize: `min(${18 * sizeMultiplier}px, ${6 * sizeMultiplier}cqmin)`,
                      color: config.fontColor ?? '#1e293b',
                    }}
                  >
                    {selectedSymbol.title}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ImageIcon
                  style={{
                    width: 'min(48px, 12cqmin)',
                    height: 'min(48px, 12cqmin)',
                  }}
                  className="mb-2 opacity-20"
                />
                <span style={{ fontSize: 'min(14px, 4cqmin)' }}>
                  Select a symbol below
                </span>
              </div>
            )}
          </div>

          {/* Selection bar (only when focused) */}
          {isFocused && symbols.length > 0 && (
            <div
              className="w-full flex-shrink-0 bg-slate-100/80 rounded-2xl p-1.5 flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar"
              style={{
                minHeight: 'max(56px, min(72px, 18cqmin))',
                marginTop: 'min(6px, 1.5cqmin)',
              }}
            >
              {symbols.map((symbol) => {
                const isSelected = selectedSymbolId === symbol.id;
                return (
                  <button
                    key={symbol.id}
                    onClick={() =>
                      updateConfig({
                        selectedSymbolId: isSelected ? null : symbol.id,
                      })
                    }
                    className={`flex-shrink-0 rounded-xl border-2 overflow-hidden transition-all relative ${
                      isSelected
                        ? 'border-brand-blue-primary shadow-sm'
                        : 'border-transparent bg-white/40 hover:border-slate-300'
                    }`}
                    style={{
                      width: 'max(48px, min(64px, 16cqmin))',
                      height: 'max(48px, min(64px, 16cqmin))',
                    }}
                  >
                    <img
                      src={symbol.imageUrl}
                      alt={symbol.title}
                      className="w-full h-full object-contain p-1"
                      loading="lazy"
                      draggable={false}
                    />
                    {isSelected && (
                      <div className="absolute top-0.5 right-0.5 w-2 h-2 bg-brand-blue-primary rounded-full border border-white shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      }
    />
  );
};
