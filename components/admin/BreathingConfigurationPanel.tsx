import React, { useState } from 'react';
import { BUILDINGS } from '@/config/buildings';
import { BreathingGlobalConfig, BreathingBuildingConfig } from '@/types';
import { WIDGET_PALETTE } from '@/config/colors';

interface BreathingConfigurationPanelProps {
  config: BreathingGlobalConfig;
  onChange: (newConfig: BreathingGlobalConfig) => void;
}

const PATTERN_OPTIONS = [
  { id: '4-4-4-4', label: 'Box Breathing' },
  { id: '4-7-8', label: 'Relaxing Breath' },
  { id: '5-5', label: 'Coherent Breath' },
] as const;

const VISUAL_OPTIONS = [
  { id: 'circle', label: 'Sphere' },
  { id: 'lotus', label: 'Lotus' },
  { id: 'wave', label: 'Ripple' },
] as const;

export const BreathingConfigurationPanel: React.FC<
  BreathingConfigurationPanelProps
> = ({ config, onChange }) => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    BUILDINGS[0].id
  );

  const buildingDefaults = config.buildingDefaults ?? {};
  const currentBuildingConfig: BreathingBuildingConfig =
    buildingDefaults[selectedBuildingId] ?? {};

  const handleUpdateBuilding = (updates: Partial<BreathingBuildingConfig>) => {
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
          Configure Building Breathing Defaults
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

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-6">
        <p className="text-xxs text-slate-500 leading-tight">
          These defaults will pre-configure the Breathing widget when a teacher
          in <b>{BUILDINGS.find((b) => b.id === selectedBuildingId)?.name}</b>{' '}
          adds it to their dashboard.
        </p>

        {/* Pattern Selection */}
        <div>
          <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
            Default Pattern
          </label>
          <div className="grid grid-cols-1 gap-2">
            {PATTERN_OPTIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => handleUpdateBuilding({ pattern: p.id })}
                className={`p-2 rounded-lg text-xs font-bold transition-all border-2 text-left ${
                  (currentBuildingConfig.pattern ?? '4-4-4-4') === p.id
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

        {/* Visual Style Selection */}
        <div>
          <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
            Default Visual Style
          </label>
          <div className="grid grid-cols-3 gap-2">
            {VISUAL_OPTIONS.map((v) => (
              <button
                key={v.id}
                onClick={() => handleUpdateBuilding({ visual: v.id })}
                className={`p-2 rounded-lg text-xxs font-black uppercase transition-all border-2 ${
                  (currentBuildingConfig.visual ?? 'circle') === v.id
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Color Theme Selection */}
        <div>
          <label className="text-xxs font-bold text-slate-500 uppercase mb-2 block">
            Default Color Theme
          </label>
          <div className="flex flex-wrap gap-2">
            {WIDGET_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => handleUpdateBuilding({ color: c })}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  (currentBuildingConfig.color ?? '#3b82f6') === c
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
