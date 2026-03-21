import React, { useState } from 'react';
import { BUILDINGS } from '@/config/buildings';
import {
  ConceptWebGlobalConfig,
  BuildingConceptWebDefaults,
  GlobalFontFamily,
} from '@/types';

interface ConceptWebConfigurationPanelProps {
  config: ConceptWebGlobalConfig;
  onChange: (newConfig: ConceptWebGlobalConfig) => void;
}

export const ConceptWebConfigurationPanel: React.FC<
  ConceptWebConfigurationPanelProps
> = ({ config, onChange }) => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    BUILDINGS[0].id
  );

  const buildingDefaults = config.buildingDefaults ?? {};
  const currentBuildingConfig: BuildingConceptWebDefaults = buildingDefaults[
    selectedBuildingId
  ] ?? {
    buildingId: selectedBuildingId,
  };

  const handleUpdateBuilding = (
    updates: Partial<BuildingConceptWebDefaults>
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
          Configure Building Defaults
        </label>
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {BUILDINGS.map((building) => (
            <button
              key={building.id}
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
          These defaults will pre-populate the Concept Web widget when a teacher
          in <b>{BUILDINGS.find((b) => b.id === selectedBuildingId)?.name}</b>{' '}
          adds it to their dashboard.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
              Default Node Dimensions
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Width (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={currentBuildingConfig.defaultNodeWidth ?? 15}
                  onChange={(e) =>
                    handleUpdateBuilding({
                      defaultNodeWidth: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Height (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={currentBuildingConfig.defaultNodeHeight ?? 15}
                  onChange={(e) =>
                    handleUpdateBuilding({
                      defaultNodeHeight: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
              Default Font Family
            </label>
            <select
              value={currentBuildingConfig.fontFamily ?? 'global'}
              onChange={(e) => {
                const selected = e.target.value;
                handleUpdateBuilding({
                  fontFamily:
                    selected === 'global'
                      ? undefined
                      : (selected as GlobalFontFamily),
                });
              }}
              className="w-full rounded border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="global">Global (Dashboard default)</option>
              <option value="sans">Sans Serif</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
              <option value="comic">Comic</option>
              <option value="handwritten">Handwritten</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
