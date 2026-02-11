import React from 'react';
import { WidgetData, MaterialsConfig } from '../../../types';
import { useDashboard } from '../../../context/useDashboard';
import { MATERIAL_ITEMS } from './constants';
import { SettingsLabel } from '../../common/SettingsLabel';

export const MaterialsSettings: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as MaterialsConfig;
  const selectedItems = React.useMemo(
    () => new Set(config.selectedItems || []),
    [config.selectedItems]
  );

  const toggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }

    // Also filter out any active items that are no longer selected
    const currentActive = config.activeItems || [];
    const newActive = currentActive.filter((activeId: string) =>
      newSelected.has(activeId)
    );

    updateWidget(widget.id, {
      config: {
        ...config,
        selectedItems: Array.from(newSelected),
        activeItems: newActive,
      },
    });
  };

  const isAllSelected = selectedItems.size === MATERIAL_ITEMS.length;

  const toggleAll = () => {
    if (isAllSelected) {
      updateWidget(widget.id, {
        config: { ...config, selectedItems: [], activeItems: [] },
      });
    } else {
      updateWidget(widget.id, {
        config: {
          ...config,
          selectedItems: MATERIAL_ITEMS.map((i) => i.id),
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex items-center justify-between">
        <SettingsLabel className="mb-0">Available Materials</SettingsLabel>
        <button
          onClick={toggleAll}
          className="text-xs text-blue-500  hover:underline"
        >
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
        {MATERIAL_ITEMS.map((item) => {
          const isSelected = selectedItems.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  isSelected
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white border-slate-300'
                }`}
              >
                {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              <item.icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isSelected ? 'text-blue-500' : 'text-slate-400'
                }`}
              />
              <span
                className={`text-sm  truncate ${
                  isSelected ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xxs text-slate-400 leading-tight">
        Selected materials will appear on the widget face. Tap them to toggle
        visibility for students.
      </p>
    </div>
  );
};
