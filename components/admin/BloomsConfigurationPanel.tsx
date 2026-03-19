import React from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { BloomsGlobalConfig, BloomsLevel } from '@/types';
import { BLOOMS_DATA } from '@/config/bloomsData';
import { IconPicker } from '@/components/widgets/InstructionalRoutines/IconPicker';

interface BloomsConfigurationPanelProps {
  config: Partial<BloomsGlobalConfig>;
  onChange: (newConfig: BloomsGlobalConfig) => void;
}

const DEFAULT_LEVELS: BloomsLevel[] = BLOOMS_DATA.questionStarters.map(
  (d, i) => ({
    level: d.level,
    starters: d.starters,
    color:
      ['#4cc9f0', '#4895ef', '#3f37c9', '#480ca8', '#7209b7', '#9d4ede'][i] ||
      '#3b82f6',
    icon: 'HelpCircle',
  })
);

export const BloomsConfigurationPanel: React.FC<
  BloomsConfigurationPanelProps
> = ({ config, onChange }) => {
  const levels = config.levels ?? DEFAULT_LEVELS;

  const updateLevel = (levelName: string, updates: Partial<BloomsLevel>) => {
    const next = levels.map((l) =>
      l.level === levelName ? { ...l, ...updates } : l
    );
    onChange({ levels: next });
  };

  const addLevel = () => {
    const newLevel: BloomsLevel = {
      level: `New Level ${levels.length + 1}`,
      starters: ['New sentence starter...'],
      color: '#3b82f6',
      icon: 'HelpCircle',
    };
    onChange({ levels: [...levels, newLevel] });
  };

  const removeLevel = (levelName: string) => {
    const next = levels.filter((l) => l.level !== levelName);
    onChange({ levels: next });
  };

  const addStarter = (levelName: string) => {
    const next = levels.map((l) =>
      l.level === levelName
        ? {
            ...l,
            starters: [...l.starters, ''],
          }
        : l
    );
    onChange({ levels: next });
  };

  const updateStarter = (levelName: string, index: number, value: string) => {
    const next = levels.map((l) => {
      if (l.level === levelName) {
        const nextStarters = [...l.starters];
        nextStarters[index] = value;
        return { ...l, starters: nextStarters };
      }
      return l;
    });
    onChange({ levels: next });
  };

  const removeStarter = (levelName: string, index: number) => {
    const next = levels.map((l) => {
      if (l.level === levelName) {
        const nextStarters = l.starters.filter((_, i) => i !== index);
        return { ...l, starters: nextStarters };
      }
      return l;
    });
    onChange({ levels: next });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          Bloom&apos;s Taxonomy Levels & Starters
        </h4>
        <button
          onClick={addLevel}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue-primary text-white rounded-lg text-xxs font-black uppercase tracking-wider hover:bg-brand-blue-dark transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" /> Add Level
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {levels.map((level) => (
          <div
            key={level.level}
            className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Level Header */}
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <IconPicker
                currentIcon={level.icon ?? 'HelpCircle'}
                onSelect={(icon) => updateLevel(level.level, { icon })}
                color="blue"
              />
              <input
                type="text"
                value={level.level}
                onChange={(e) =>
                  updateLevel(level.level, { level: e.target.value })
                }
                className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-slate-800 p-0 text-sm"
                placeholder="Level Name"
              />
              <input
                type="color"
                value={level.color}
                onChange={(e) =>
                  updateLevel(level.level, { color: e.target.value })
                }
                className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
              />
              <button
                onClick={() => removeLevel(level.level)}
                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                title="Remove Level"
                aria-label="Remove level"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Starters List */}
            <div className="p-4 space-y-2">
              <label className="text-xxs font-black text-slate-400 uppercase tracking-widest block mb-2">
                Sentence Starters
              </label>
              {level.starters.map((starter, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <input
                    type="text"
                    value={starter}
                    onChange={(e) =>
                      updateStarter(level.level, index, e.target.value)
                    }
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:border-brand-blue-primary focus:bg-white outline-none transition-all"
                    placeholder="Enter sentence starter..."
                  />
                  <button
                    onClick={() => removeStarter(level.level, index)}
                    className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    aria-label="Remove starter"
                    title="Remove starter"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addStarter(level.level)}
                className="w-full py-2 mt-2 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 hover:border-brand-blue-light hover:text-brand-blue-primary transition-all flex items-center justify-center gap-2 text-xxs font-bold uppercase"
              >
                <Plus className="w-3.5 h-3.5" /> Add Starter
              </button>
            </div>
          </div>
        ))}

        {levels.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center bg-white border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
            <HelpCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-black uppercase tracking-widest text-xs">
              No levels defined
            </p>
            <p className="text-xs mt-1">Add your first level to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};
