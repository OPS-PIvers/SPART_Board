import React, { useMemo } from 'react';
import { useDashboard } from '../../context/useDashboard';
import {
  WidgetData,
  SeatingChartConfig,
  RandomConfig,
  RandomGroup,
} from '../../types';
import { RosterModeControl } from '../common/RosterModeControl';
import { Trash2, Eraser, RefreshCw, Users } from 'lucide-react';
import { SettingsLabel } from '../common/SettingsLabel';
import { generateGroupedLayout } from './seatingChartLayouts';
import { Button } from '../common/Button';

export const SeatingChartSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard, addToast } = useDashboard();
  const config = widget.config as SeatingChartConfig;
  const { rosterMode = 'class', names = '' } = config;

  // Find Random Widget
  const randomWidget = useMemo(
    () => activeDashboard?.widgets.find((w) => w.type === 'random'),
    [activeDashboard]
  );

  const importFromRandom = () => {
    if (!randomWidget) {
      addToast('No Randomizer widget found!', 'error');
      return;
    }

    const randomConfig = randomWidget.config as RandomConfig;
    const lastResult = randomConfig.lastResult;

    if (
      Array.isArray(lastResult) &&
      lastResult.length > 0 &&
      typeof lastResult[0] === 'object' &&
      lastResult[0] !== null &&
      'names' in lastResult[0]
    ) {
      if (!confirm('This will replace your current layout. Continue?')) return;

      const groups = lastResult as RandomGroup[];

      // Use widget dimensions for layout generation
      // Fallback to reasonable defaults if dimensions are missing/zero
      const w = widget.w && widget.w > 0 ? widget.w : 800;
      const h = widget.h && widget.h > 0 ? widget.h : 600;

      const { furniture, assignments } = generateGroupedLayout(
        groups,
        w,
        h,
        config.gridSize ?? 20
      );

      updateWidget(widget.id, {
        config: {
          ...config,
          furniture,
          assignments,
          // Switch to custom roster mode if we are importing specific names that might not match the class roster exactly?
          // Actually, stick to current mode. If names match, assignments work.
          // If using 'class' roster, ensure names match exactly.
        },
      });
      addToast(`Imported ${groups.length} groups!`, 'success');
    } else {
      addToast('Randomizer needs to have generated groups first.', 'info');
    }
  };

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
      {/* Nexus Connection: Randomizer Import */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-900">
          <Users className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">
            Import Groups
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={importFromRandom}
          disabled={!randomWidget}
          title={
            !randomWidget ? 'Add a Randomizer widget first' : 'Import Groups'
          }
          icon={<RefreshCw className="w-3 h-3" />}
        >
          Sync
        </Button>
      </div>

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
          <SettingsLabel>Custom Roster</SettingsLabel>
          <textarea
            value={names}
            onChange={(e) =>
              updateWidget(widget.id, {
                config: { ...config, names: e.target.value },
              })
            }
            placeholder="Enter student names (one per line)..."
            className="w-full h-40 p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue-primary resize-none font-sans"
          />
        </div>
      )}

      <div className="space-y-3">
        <SettingsLabel>Actions</SettingsLabel>

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
