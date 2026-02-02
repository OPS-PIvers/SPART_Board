import React from 'react';
import { WidgetData, LunchCountConfig } from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { RosterModeControl } from '../../common/RosterModeControl';
import { Toggle } from '../../common/Toggle';
import { School, Users } from 'lucide-react';

const SCHOOL_OPTIONS = [
  { id: 'schumann-elementary', label: 'Schumann Elementary' },
  { id: 'orono-intermediate-school', label: 'Orono Intermediate' },
];

export const LunchCountSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as LunchCountConfig;
  const {
    schoolSite = 'schumann-elementary',
    isManualMode = false,
    manualHotLunch = '',
    manualBentoBox = '',
    roster = [],
    rosterMode = 'class',
  } = config;

  return (
    <div className="space-y-6">
      <RosterModeControl
        rosterMode={rosterMode}
        onModeChange={(mode) =>
          updateWidget(widget.id, {
            config: { ...config, rosterMode: mode },
          })
        }
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div>
            <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
              <School className="w-3 h-3" /> School Site
            </label>
            <select
              value={schoolSite}
              onChange={(e) =>
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    schoolSite: e.target
                      .value as LunchCountConfig['schoolSite'],
                    cachedMenu: null,
                  },
                })
              }
              className="w-full p-2.5 text-xs  border border-slate-200 rounded-xl outline-none bg-white"
            >
              {SCHOOL_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xxs  text-indigo-700 uppercase tracking-wider">
                Manual Mode
              </span>
              <Toggle
                checked={isManualMode}
                onChange={() =>
                  updateWidget(widget.id, {
                    config: { ...config, isManualMode: !isManualMode },
                  })
                }
                size="sm"
                activeColor="bg-indigo-600"
              />
            </div>
            {isManualMode && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <input
                  placeholder="Hot Lunch Name"
                  value={manualHotLunch}
                  onChange={(e) =>
                    updateWidget(widget.id, {
                      config: { ...config, manualHotLunch: e.target.value },
                    })
                  }
                  className="w-full p-2 text-xxs  border border-indigo-200 rounded-lg outline-none"
                />
                <input
                  placeholder="Bento Box Name"
                  value={manualBentoBox}
                  onChange={(e) =>
                    updateWidget(widget.id, {
                      config: { ...config, manualBentoBox: e.target.value },
                    })
                  }
                  className="w-full p-2 text-xxs  border border-indigo-200 rounded-lg outline-none"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          {rosterMode === 'custom' ? (
            <>
              <label className="text-xxs  text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                <Users className="w-3 h-3" /> Custom Roster
              </label>
              <textarea
                value={roster.join('\n')}
                onChange={(e) =>
                  updateWidget(widget.id, {
                    config: {
                      ...config,
                      roster: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  })
                }
                placeholder="Enter one student per line..."
                className="w-full h-[240px] p-3 text-xs  bg-white border border-slate-200 rounded-2xl outline-none resize-none leading-relaxed"
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center gap-3">
              <Users className="w-8 h-8 text-slate-300" />
              <div className="text-xxs  uppercase text-slate-400 tracking-widest">
                Using Active Class Roster
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
