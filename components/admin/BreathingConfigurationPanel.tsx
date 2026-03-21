import React, { useState, useMemo } from 'react';
import { BreathingGlobalConfig, BuildingBreathingDefaults } from '@/types';
import { WIDGET_PALETTE } from '@/config/colors';
import { BUILDINGS } from '@/config/buildings';
import { Settings2 } from 'lucide-react';

interface BreathingConfigurationPanelProps {
  config: Record<string, unknown>;
  onChange: (updates: Record<string, unknown>) => void;
}

export const BreathingConfigurationPanel: React.FC<
  BreathingConfigurationPanelProps
> = ({ config, onChange }) => {
  const typedConfig = config as unknown as BreathingGlobalConfig;

  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    BUILDINGS[0].id
  );

  // Patterns reference from BreathingSettings.tsx
  const patterns = [
    { id: '4-4-4-4', label: 'Box Breathing' },
    { id: '4-7-8', label: 'Relaxing Breath' },
    { id: '5-5', label: 'Coherent Breath' },
  ] as const;

  // Visuals reference from BreathingSettings.tsx
  const visuals = [
    { id: 'circle', label: 'Sphere' },
    { id: 'lotus', label: 'Lotus' },
    { id: 'wave', label: 'Ripple' },
  ] as const;

  const updateBuildingDefaults = (
    updates: Partial<BuildingBreathingDefaults>
  ) => {
    const newDefaults = { ...(typedConfig.buildingDefaults || {}) };
    newDefaults[selectedBuildingId] = {
      ...(newDefaults[selectedBuildingId] || {
        buildingId: selectedBuildingId,
      }),
      ...updates,
    };

    onChange({ buildingDefaults: newDefaults });
  };

  const currentBuildingConfig = useMemo(
    () =>
      (typedConfig.buildingDefaults || {})[selectedBuildingId] || {
        buildingId: selectedBuildingId,
      },
    [typedConfig.buildingDefaults, selectedBuildingId]
  );

  return (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
        <p className="text-sm font-bold text-slate-700">
          Default User-Level Settings
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Configure the initial breathing pattern, visual style, and color that
          the widget will start with. Users can still change these during the
          session.
        </p>
      </div>

      {/* Building Selector */}
      <div>
        <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-2">
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

      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div className="space-y-4">
            {/* Pattern Selection */}
            <div>
              <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
                Default Pattern
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {patterns.map((p) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      updateBuildingDefaults({
                        pattern: p.id as BuildingBreathingDefaults['pattern'],
                      })
                    }
                    className={`p-2 rounded-lg text-xs font-bold transition-all border-2 text-left ${
                      currentBuildingConfig.pattern === p.id
                        ? 'bg-brand-blue-primary border-brand-blue-primary text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{p.label}</span>
                      <span
                        className={`opacity-70 font-mono text-xxs tracking-widest ${
                          currentBuildingConfig.pattern === p.id
                            ? 'text-white'
                            : 'text-slate-400'
                        }`}
                      >
                        {p.id}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style Selection */}
            <div>
              <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
                Default Visual Style
              </label>
              <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                {visuals.map((v) => (
                  <button
                    key={v.id}
                    onClick={() =>
                      updateBuildingDefaults({
                        visual: v.id as BuildingBreathingDefaults['visual'],
                      })
                    }
                    className={`flex-1 py-1.5 text-xxs font-bold uppercase rounded transition-colors ${
                      currentBuildingConfig.visual === v.id
                        ? 'bg-brand-blue-primary text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
                Default Color Theme
              </label>
              <div className="flex flex-wrap gap-2">
                {WIDGET_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateBuildingDefaults({ color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      currentBuildingConfig.color === color
                        ? 'border-slate-800 scale-110 shadow-md'
                        : 'border-transparent hover:scale-105 shadow-sm'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select default color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
