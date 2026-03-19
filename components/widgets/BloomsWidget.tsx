import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  WidgetComponentProps,
  BloomsConfig,
  BloomsGlobalConfig,
  BloomsLevel,
} from '@/types';
import { useDashboard } from '@/context/useDashboard';
import { useAuth } from '@/context/useAuth';
import { BLOOMS_DATA } from '@/config/bloomsData';

const DEFAULT_LEVELS: BloomsLevel[] = BLOOMS_DATA.questionStarters.map(
  (d, i) => ({
    level: d.level,
    starters: d.starters,
    color:
      ['#4cc9f0', '#4895ef', '#3f37c9', '#480ca8', '#7209b7', '#9d4ede'][i] ??
      '#3b82f6',
    icon: 'HelpCircle',
  })
);

const LucideIconsRecord = LucideIcons as unknown as Record<
  string,
  React.ElementType
>;

export const BloomsWidget: React.FC<WidgetComponentProps> = ({ widget }) => {
  const { featurePermissions } = useAuth();
  const config = widget.config as BloomsConfig;

  // 1. Get Global Config from Feature Permissions
  const permission = featurePermissions.find((p) => p.widgetType === 'blooms');
  const globalConfig = permission?.config as BloomsGlobalConfig | undefined;

  // 2. Resolve Levels (Custom Instance Overrides > Global Config > Hardcoded Defaults)
  const levels = config.customStarters?.length
    ? config.customStarters
    : globalConfig?.levels?.length
      ? globalConfig.levels
      : DEFAULT_LEVELS;

  const [activeTab, setActiveTab] = useState<string>(
    config.activeLevel ?? levels[0]?.level ?? ''
  );

  const activeLevel = levels.find((l) => l.level === activeTab) ?? levels[0];

  if (!activeLevel) return null;

  const getIcon = (name: string) => {
    return LucideIconsRecord[name] ?? LucideIcons.HelpCircle;
  };

  return (
    <div className="flex h-full w-full bg-white select-none overflow-hidden rounded-lg">
      {/* Sidebar Navigation */}
      <div
        className="flex flex-col border-r border-slate-200 bg-slate-50 shrink-0"
        style={{ width: 'min(140px, 35cqw)' }}
      >
        <div
          className="border-b border-slate-200 bg-white"
          style={{ padding: 'min(12px, 3cqmin)' }}
        >
          <label
            className="font-black uppercase text-slate-400 tracking-widest block"
            style={{
              fontSize: 'min(9px, 2.2cqmin)',
              marginBottom: 'min(4px, 1cqmin)',
            }}
          >
            Bloom&apos;s Taxonomy
          </label>
          <div
            className="flex items-center text-slate-700 font-bold uppercase tracking-tight"
            style={{ gap: 'min(6px, 1.5cqmin)', fontSize: 'min(12px, 3cqmin)' }}
          >
            <LucideIcons.Triangle
              className="text-slate-400"
              style={{
                width: 'min(14px, 3.5cqmin)',
                height: 'min(14px, 3.5cqmin)',
              }}
            />
            Starters
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar"
          style={{ padding: 'min(8px, 2cqmin)' }}
        >
          {levels.map((level) => {
            const isActive = activeTab === level.level;
            const IconComp = getIcon(level.icon ?? 'HelpCircle');

            return (
              <button
                key={level.level}
                onClick={() => setActiveTab(level.level)}
                className={`w-full flex flex-col items-center justify-center transition-all border ${
                  isActive
                    ? 'shadow-md text-white scale-100'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-100 scale-95'
                }`}
                style={{
                  padding: 'min(12px, 3cqmin)',
                  borderRadius: 'min(12px, 3cqmin)',
                  marginBottom: 'min(8px, 2cqmin)',
                  ...(isActive
                    ? { backgroundColor: level.color, borderColor: level.color }
                    : {
                        borderBottomColor: level.color,
                        borderBottomWidth: '3px',
                      }),
                }}
              >
                <IconComp
                  className="mb-2"
                  style={{
                    width: 'min(22px, 5.5cqmin)',
                    height: 'min(22px, 5.5cqmin)',
                    color: isActive ? '#ffffff' : level.color,
                  }}
                />
                <span
                  className="font-bold text-center leading-tight uppercase tracking-tight"
                  style={{ fontSize: 'min(9px, 2.4cqmin)' }}
                >
                  {level.level.split(':').pop()?.trim() ?? level.level}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 overflow-y-auto bg-white custom-scrollbar"
        style={{ padding: 'min(20px, 5cqmin)' }}
      >
        <div className="animate-in fade-in slide-in-from-right-2 duration-300">
          <h3
            className="font-black mb-4 uppercase tracking-tight flex items-center"
            style={{
              color: activeLevel.color,
              fontSize: 'min(18px, 4.5cqmin)',
              gap: 'min(8px, 2cqmin)',
              marginBottom: 'min(16px, 4cqmin)',
            }}
          >
            {React.createElement(getIcon(activeLevel.icon ?? 'HelpCircle'), {
              style: {
                width: 'min(20px, 5cqmin)',
                height: 'min(20px, 5cqmin)',
              },
            })}
            {activeLevel.level}
          </h3>
          <ul className="flex flex-col" style={{ gap: 'min(12px, 3cqmin)' }}>
            {activeLevel.starters.map((starter, i) => (
              <li
                key={i}
                className="font-medium text-slate-700 border-l-4 leading-relaxed shadow-sm bg-slate-50 rounded-r-lg"
                style={{
                  borderLeftColor: activeLevel.color,
                  fontSize: 'min(14px, 3.5cqmin)',
                  paddingLeft: 'min(16px, 4cqmin)',
                  paddingTop: 'min(8px, 2cqmin)',
                  paddingBottom: 'min(8px, 2cqmin)',
                }}
              >
                {starter}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export const BloomsSettings: React.FC<WidgetComponentProps> = ({ widget }) => {
  const config = widget.config as BloomsConfig;
  const { updateWidget } = useDashboard();
  const { featurePermissions } = useAuth();
  const [editingLevel, setEditingLevel] = useState<string | null>(null);

  // Resolve what levels we are looking at (local vs global vs default)
  const permission = featurePermissions.find((p) => p.widgetType === 'blooms');
  const globalConfig = permission?.config as BloomsGlobalConfig | undefined;
  const baseLevels = globalConfig?.levels?.length
    ? globalConfig.levels
    : DEFAULT_LEVELS;

  const currentLevels = config.customStarters ?? baseLevels;

  const handleUpdateStarters = (levelName: string, starters: string[]) => {
    const existing = (config.customStarters ?? []).find(
      (s) => s.level === levelName
    );
    let newCustom;
    if (existing) {
      newCustom = (config.customStarters ?? []).map((s) =>
        s.level === levelName ? { ...s, starters } : s
      );
    } else {
      const baseLevel =
        baseLevels.find((l) => l.level === levelName) ?? baseLevels[0];
      newCustom = [
        ...(config.customStarters ?? []),
        { ...baseLevel, starters },
      ];
    }
    updateWidget(widget.id, {
      config: { ...config, customStarters: newCustom },
    });
  };

  const resetToDefault = (levelName: string) => {
    updateWidget(widget.id, {
      config: {
        ...config,
        customStarters: (config.customStarters ?? []).filter(
          (s) => s.level !== levelName
        ),
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-indigo-50 rounded-xl flex items-start gap-3 border border-indigo-100">
        <LucideIcons.Info className="w-4 h-4 text-indigo-500 mt-0.5" />
        <p className="text-[10px] text-indigo-700 leading-relaxed">
          Customize the question starters for each level of Bloom&apos;s
          Taxonomy. Changes will only apply to this widget instance.
        </p>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {baseLevels.map((level) => {
          const isEditing = editingLevel === level.level;
          const currentData =
            currentLevels.find((s) => s.level === level.level) ?? level;

          return (
            <div
              key={level.level}
              className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
            >
              <button
                onClick={() => setEditingLevel(isEditing ? null : level.level)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="text-xs font-bold text-slate-700">
                  {level.level}
                </span>
                <div className="flex items-center gap-2">
                  {(config.customStarters ?? []).find(
                    (s) => s.level === level.level
                  ) && (
                    <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase font-bold">
                      Custom
                    </span>
                  )}
                  <LucideIcons.Settings2
                    className={`w-4 h-4 text-slate-400 transition-transform ${isEditing ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>

              {isEditing && (
                <div className="p-3 border-t border-slate-100 bg-slate-50 space-y-3">
                  <div className="space-y-2">
                    {currentData.starters.map((starter, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={starter}
                          onChange={(e) => {
                            const newStarters = [...currentData.starters];
                            newStarters[idx] = e.target.value;
                            handleUpdateStarters(level.level, newStarters);
                          }}
                          className="flex-1 text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => {
                            const newStarters = currentData.starters.filter(
                              (_, i) => i !== idx
                            );
                            handleUpdateStarters(level.level, newStarters);
                          }}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LucideIcons.Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        handleUpdateStarters(level.level, [
                          ...currentData.starters,
                          '',
                        ]);
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2 text-[10px] text-indigo-600 hover:bg-indigo-100 rounded-lg border border-dashed border-indigo-200 transition-colors mt-2"
                    >
                      <LucideIcons.Plus className="w-3 h-3" /> Add Starter
                    </button>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-200 mt-3">
                    <button
                      onClick={() => resetToDefault(level.level)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
