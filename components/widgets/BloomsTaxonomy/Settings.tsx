import React from 'react';
import { WidgetData, BloomsTaxonomyConfig } from '@/types';
import { useDashboard } from '@/context/useDashboard';
import { useAuth } from '@/context/useAuth';
import {
  CONTENT_CATEGORIES,
  CATEGORY_LABELS,
  type ContentCategory,
} from './constants';
import type {
  BloomsTaxonomyGlobalConfig,
  BloomsTaxonomyBuildingConfig,
} from '@/types';

export const BloomsTaxonomySettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const { featurePermissions, selectedBuildings } = useAuth();
  const config = widget.config as BloomsTaxonomyConfig;
  const enabledCategories = config.enabledCategories ?? [...CONTENT_CATEGORIES];

  // Read admin building config for available categories
  const bloomsPerm = featurePermissions.find(
    (p) => p.widgetType === 'blooms-taxonomy'
  );
  const globalConfig = bloomsPerm?.config as
    | BloomsTaxonomyGlobalConfig
    | undefined;
  const buildingId = selectedBuildings[0] ?? '';
  const buildingConfig: BloomsTaxonomyBuildingConfig =
    globalConfig?.buildingDefaults?.[buildingId] ?? {};
  const { availableCategories } = buildingConfig;

  // Only show categories the admin has made available
  const displayCategories = (
    CONTENT_CATEGORIES as readonly ContentCategory[]
  ).filter(
    (cat) => !availableCategories || availableCategories.includes(cat as string)
  );

  const toggleCategory = (cat: string) => {
    const next = enabledCategories.includes(cat)
      ? enabledCategories.filter((c) => c !== cat)
      : [...enabledCategories, cat];
    updateWidget(widget.id, {
      config: { ...config, enabledCategories: next },
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="text-sm font-semibold text-white mb-2">
          Content Categories
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Choose which categories appear when you click a level.
        </p>
        <div className="space-y-2">
          {displayCategories.map((cat) => (
            <label
              key={cat}
              className="flex items-center gap-2 cursor-pointer text-sm text-white"
            >
              <input
                type="checkbox"
                checked={enabledCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="rounded border-slate-500 bg-slate-700 text-indigo-500 focus:ring-indigo-500"
              />
              {CATEGORY_LABELS[cat]}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
