import React from 'react';
import { WidgetData, SeatingChartConfig } from '../../types';
import { useDashboard } from '../../context/useDashboard';
import { RosterModeControl } from '../common/RosterModeControl';
import { Button } from '../common/Button';
import { Eraser, Trash2 } from 'lucide-react';

export const SeatingChartSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as SeatingChartConfig;
  const {
    rosterMode = 'class',
    customRoster = [],
    assignments = {},
    furniture = [],
  } = config;

  const clearAssignments = () => {
    if (confirm('Are you sure you want to clear all student assignments?')) {
      updateWidget(widget.id, {
        config: { ...config, assignments: {} },
      });
    }
  };

  const clearFurniture = () => {
    if (confirm('Are you sure you want to delete all furniture?')) {
      updateWidget(widget.id, {
        config: { ...config, furniture: [], assignments: {} },
      });
    }
  };

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

      {rosterMode === 'custom' && (
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Custom Roster (One per line)
          </label>
          <textarea
            value={customRoster.join('\n')}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: {
                  ...config,
                  customRoster: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              })
            }
            className="w-full h-32 p-3 text-xs border border-slate-200 rounded-xl outline-none"
            placeholder="Student Names..."
          />
        </div>
      )}

      <div className="space-y-3 pt-4 border-t border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Actions
        </label>
        <Button
          variant="secondary"
          onClick={clearAssignments}
          className="w-full justify-start"
          icon={<Eraser className="w-4 h-4" />}
          disabled={Object.keys(assignments).length === 0}
        >
          Clear Assignments
        </Button>
        <Button
          variant="danger"
          onClick={clearFurniture}
          className="w-full justify-start"
          icon={<Trash2 className="w-4 h-4" />}
          disabled={furniture.length === 0}
        >
          Reset Layout
        </Button>
      </div>
    </div>
  );
};
