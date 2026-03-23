import React, { useState } from 'react';
import { BUILDINGS } from '@/config/buildings';
import {
  SmartNotebookGlobalConfig,
  SmartNotebookBuildingDefaults,
} from '@/types';

interface SmartNotebookConfigurationPanelProps {
  config: SmartNotebookGlobalConfig;
  onChange: (newConfig: SmartNotebookGlobalConfig) => void;
}

export const SmartNotebookConfigurationPanel: React.FC<
  SmartNotebookConfigurationPanelProps
> = ({ config, onChange }) => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    BUILDINGS[0].id
  );

  const buildingDefaults = config.buildingDefaults ?? {};
  const currentBuildingConfig: SmartNotebookBuildingDefaults =
    buildingDefaults[selectedBuildingId] ?? {};

  const handleUpdateBuilding = (
    updates: Partial<SmartNotebookBuildingDefaults>
  ) => {
    onChange({
      ...config,
      buildingDefaults: {
        ...buildingDefaults,
        [selectedBuildingId]: {
          ...currentBuildingConfig,
          ...updates,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Building Selector */}
      <div>
        <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
          Configure Building Notebook Defaults
        </label>
        <div
          className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar"
          role="tablist"
        >
          {BUILDINGS.map((building) => (
            <button
              key={building.id}
              role="tab"
              aria-selected={selectedBuildingId === building.id}
              tabIndex={selectedBuildingId === building.id ? 0 : -1}
              onClick={() => setSelectedBuildingId(building.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border whitespace-nowrap transition-colors ${
                selectedBuildingId === building.id
                  ? 'bg-brand-blue-primary text-white border-brand-blue-primary shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {building.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-4">
        <p className="text-xxs text-slate-500 leading-tight">
          These defaults will apply to the Smart Notebook widget when a teacher
          in <b>{BUILDINGS.find((b) => b.id === selectedBuildingId)?.name}</b>{' '}
          adds it to their dashboard.
        </p>

        {/* Max File Size */}
        <div>
          <label className="text-xxs font-bold text-slate-500 uppercase mb-1 block">
            Max Import File Size (MB)
          </label>
          <input
            type="number"
            min={1}
            max={500}
            value={currentBuildingConfig.maxFileSizeMB ?? 50}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                handleUpdateBuilding({ maxFileSizeMB: val });
              }
            }}
            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-blue-primary"
            placeholder="50"
          />
          <p className="text-xxs text-slate-400 mt-1">
            Maximum file size allowed for notebook imports. Defaults to 50MB.
          </p>
        </div>
      </div>
    </div>
  );
};
