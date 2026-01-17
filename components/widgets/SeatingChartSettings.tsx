import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, SeatingChartConfig } from '../../types';
import { RosterModeControl } from '../common/RosterModeControl';
import { Trash2, Eraser } from 'lucide-react';

export const SeatingChartSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as SeatingChartConfig;
  const { rosterMode = 'class' } = config;

  const handleClearAssignments = () => {
    if (confirm('Clear all student assignments?')) {
      updateWidget(widget.id, {
        config: { ...config, assignments: {} },
      });
    }
  };

  const handleClearFurniture = () => {
    if (confirm('Clear all furniture? This will also clear assignments.')) {
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

      <div className="space-y-3">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Actions
        </label>

        <button
          onClick={handleClearAssignments}
          className="w-full flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold"
        >
          <Eraser className="w-4 h-4" />
          Clear Assignments Only
        </button>

        <button
          onClick={handleClearFurniture}
          className="w-full flex items-center gap-2 p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors text-xs font-bold"
        >
          <Trash2 className="w-4 h-4" />
          Clear All (Reset)
        </button>
      </div>
    </div>
  );
};
