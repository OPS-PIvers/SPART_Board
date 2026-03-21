import React from 'react';
import { useAuth } from '@/context/useAuth';
import {
  NumberLineGlobalConfig,
  BuildingNumberLineDefaults,
  NumberLineMode,
} from '@/types';
import { Info } from 'lucide-react';
import { Toggle } from '@/components/common/Toggle';

interface NumberLineConfigurationPanelProps {
  config?: NumberLineGlobalConfig;
  onChange: (config: NumberLineGlobalConfig) => void;
}

export const NumberLineConfigurationPanel: React.FC<
  NumberLineConfigurationPanelProps
> = ({ config, onChange }) => {
  const { selectedBuildings } = useAuth();
  const buildingId = selectedBuildings[0] ?? 'global';

  // Ensure config structure exists
  const safeConfig: NumberLineGlobalConfig = config ?? {
    buildingDefaults: {},
  };

  // Extract defaults for the active building
  const buildingDefaults: BuildingNumberLineDefaults = safeConfig
    .buildingDefaults?.[buildingId] ?? {
    min: 0,
    max: 10,
    step: 1,
    displayMode: 'integers',
    showArrows: true,
  };

  const handleUpdate = (updates: Partial<BuildingNumberLineDefaults>) => {
    const updatedDefaults = {
      ...buildingDefaults,
      ...updates,
    };

    onChange({
      ...safeConfig,
      buildingDefaults: {
        ...(safeConfig.buildingDefaults ?? {}),
        [buildingId]: updatedDefaults,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-sm">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>
          Configure the default settings applied when a user creates a new
          Number Line widget in this building. Users can still adjust these
          settings for their individual widgets.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default Minimum Value
            </label>
            <input
              type="number"
              value={buildingDefaults.min}
              onChange={(e) => handleUpdate({ min: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default Maximum Value
            </label>
            <input
              type="number"
              value={buildingDefaults.max}
              onChange={(e) => handleUpdate({ max: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Default Step Interval
          </label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={buildingDefaults.step}
            onChange={(e) => handleUpdate({ step: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Default Display Mode
          </label>
          <select
            value={buildingDefaults.displayMode}
            onChange={(e) =>
              handleUpdate({ displayMode: e.target.value as NumberLineMode })
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="integers">Integers</option>
            <option value="decimals">Decimals</option>
            <option value="fractions">Fractions</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="block text-sm font-medium text-slate-700">
              Show Arrows on Ends
            </span>
            <span className="text-xs text-slate-500">
              Indicates the line continues in both directions
            </span>
          </div>
          <Toggle
            checked={buildingDefaults.showArrows}
            onChange={(checked) => handleUpdate({ showArrows: checked })}
          />
        </div>
      </div>
    </div>
  );
};
