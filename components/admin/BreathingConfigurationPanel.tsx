import React, { useState, useCallback, useMemo } from 'react';
import { BUILDINGS } from '@/config/buildings';
import { BreathingGlobalConfig, BuildingBreathingDefaults } from '@/types';
import { WIDGET_PALETTE } from '@/config/colors';
import { Settings2 } from 'lucide-react';

interface BreathingConfigurationPanelProps {
  config: BreathingGlobalConfig;
  onChange: (newConfig: BreathingGlobalConfig) => void;
}

export const BreathingConfigurationPanel: React.FC<
  BreathingConfigurationPanelProps
> = ({ config, onChange }) => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    BUILDINGS[0].id
  );

  const handleUpdateBuilding = useCallback(
    (updates: Partial<BuildingBreathingDefaults>) => {
      const currentDefaults = config?.buildingDefaults ?? {};
      const currentConfig = currentDefaults[selectedBuildingId] ?? {
        buildingId: selectedBuildingId,
      };

      onChange({
        ...config,
        buildingDefaults: {
          ...currentDefaults,
          [selectedBuildingId]: {
            ...currentConfig,
            ...updates,
          },
        },
      });
    },
    [config, selectedBuildingId, onChange]
  );

  const buildingDefaults = useMemo(
    () => config?.buildingDefaults ?? {},
    [config?.buildingDefaults]
  );
  const currentBuildingConfig = useMemo(
    () =>
      buildingDefaults[selectedBuildingId] ?? {
        buildingId: selectedBuildingId,
      },
    [buildingDefaults, selectedBuildingId]
  );

  const patterns = [
    { id: '4-4-4-4', label: 'Box Breathing' },
    { id: '4-7-8', label: 'Relaxing Breath' },
    { id: '5-5', label: 'Coherent Breath' },
  ] as const;

  const visuals = [
    { id: 'circle', label: 'Sphere' },
    { id: 'lotus', label: 'Lotus' },
    { id: 'wave', label: 'Ripple' },
  ] as const;

  const colors = WIDGET_PALETTE;

  return (
    <div className="space-y-6">
      {/* Building Selector */}
      <div>
        <label className="text-xxs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
          <Settings2 className="w-3 h-3" /> Configure Building Breathing
          Defaults
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

      <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
            Default Pattern
          </label>
          <div className="grid grid-cols-1 gap-2">
            {patterns.map((p) => (
              <button
                key={p.id}
                onClick={() => handleUpdateBuilding({ pattern: p.id })}
                className={`p-2 rounded-lg text-xs font-bold transition-all border-2 text-left ${
                  currentBuildingConfig.pattern === p.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex justify-between">
                  <span>{p.label}</span>
                  <span className="opacity-70 font-mono text-xxs tracking-widest">
                    {p.id}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
            Default Visual Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            {visuals.map((v) => (
              <button
                key={v.id}
                onClick={() => handleUpdateBuilding({ visual: v.id })}
                className={`p-2 rounded-lg text-xxs font-black uppercase transition-all border-2 ${
                  currentBuildingConfig.visual === v.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
            Default Color Theme
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => handleUpdateBuilding({ color: c })}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  currentBuildingConfig.color === c
                    ? 'border-slate-800 scale-110 shadow-md'
                    : 'border-transparent hover:scale-105 shadow-sm'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
