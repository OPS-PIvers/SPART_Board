import React, { useState } from 'react';
import { SeatingChartGlobalConfig } from '@/types';
import { BUILDINGS } from '@/config/buildings';

interface SeatingChartConfigurationPanelProps {
  config: Record<string, unknown>;
  onChange: (newConfig: Record<string, unknown>) => void;
}

export const SeatingChartConfigurationPanel: React.FC<
  SeatingChartConfigurationPanelProps
> = ({ config, onChange }) => {
  const [activeBuildingId, setActiveBuildingId] = useState(BUILDINGS[0]?.id);

  if (!activeBuildingId) {
    return (
      <div className="p-4 text-sm text-slate-500">No buildings configured.</div>
    );
  }

  // Cast the generic config to our specific type
  const globalConfig = config as unknown as SeatingChartGlobalConfig;
  const buildingDefaults = globalConfig.buildingDefaults ?? {};
  const currentDefaults = buildingDefaults[activeBuildingId] ?? {
    buildingId: activeBuildingId,
    rosterMode: 'class',
  };

  const updateCurrentDefaults = (updates: Partial<typeof currentDefaults>) => {
    const newDefaults = {
      ...currentDefaults,
      ...updates,
      buildingId: activeBuildingId,
    };

    onChange({
      ...globalConfig,
      buildingDefaults: {
        ...buildingDefaults,
        [activeBuildingId]: newDefaults,
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Building Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 custom-scrollbar">
        {BUILDINGS.map((building) => (
          <button
            key={building.id}
            onClick={() => setActiveBuildingId(building.id)}
            className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${
              activeBuildingId === building.id
                ? 'bg-white text-brand-blue-primary border-b-2 border-brand-blue-primary'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {building.name}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
            Seating Chart Building Defaults
          </h3>
          <p className="text-xs text-slate-500">
            Configure the default settings that are applied when a teacher in
            this building adds the Seating Chart widget to their dashboard.
          </p>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Default Roster Source
              </label>
              <select
                value={currentDefaults.rosterMode ?? 'class'}
                onChange={(e) => {
                  const newRosterMode = e.target.value as 'class' | 'custom';
                  const updates: Partial<typeof currentDefaults> = {
                    rosterMode: newRosterMode,
                  };
                  if (newRosterMode === 'class') {
                    updates.names = undefined;
                  }
                  updateCurrentDefaults(updates);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue-primary outline-none font-bold bg-white"
              >
                <option value="class">ClassLink Roster</option>
                <option value="custom">Custom Roster</option>
              </select>
            </div>

            {currentDefaults.rosterMode === 'custom' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Default Custom Roster Names
                </label>
                <textarea
                  value={currentDefaults.names ?? ''}
                  onChange={(e) =>
                    updateCurrentDefaults({ names: e.target.value })
                  }
                  placeholder="Enter student names (one per line)..."
                  className="w-full h-40 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-primary resize-none font-sans bg-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
