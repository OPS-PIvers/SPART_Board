import React from 'react';
import { useAuth } from '@/context/useAuth';
import { useWidgetBuildingId } from '@/hooks/useWidgetBuildingId';
import { BUILDINGS } from '@/config/buildings';
import { WidgetData } from '@/types';

interface WidgetBuildingToggleProps {
  widget: WidgetData;
  updateWidget: (id: string, updates: Partial<WidgetData>) => void;
}

/**
 * Compact inline building toggle for the settings panel header.
 * Shows grade-level labels (e.g. "6-8 | 9-12") as a small segmented control.
 * Only renders when the user has 2+ buildings selected.
 */
export const WidgetBuildingToggle: React.FC<WidgetBuildingToggleProps> = ({
  widget,
  updateWidget,
}) => {
  const { selectedBuildings = [] } = useAuth();
  const effectiveBuildingId = useWidgetBuildingId(widget);

  if (selectedBuildings.length < 2) return null;

  const userBuildings = BUILDINGS.filter((b) =>
    selectedBuildings.includes(b.id)
  );

  return (
    <div
      className="flex items-center bg-slate-200/80 rounded-lg p-0.5 shrink-0"
      role="radiogroup"
      aria-label="Building"
    >
      {userBuildings.map((building) => {
        const isActive = building.id === effectiveBuildingId;
        return (
          <button
            key={building.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={building.name}
            onClick={() => {
              if (isActive) return;
              updateWidget(widget.id, { buildingId: building.id });
            }}
            className={`px-2 py-0.5 text-xxs font-bold rounded-md transition-all ${
              isActive
                ? 'bg-white text-slate-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {building.gradeLabel}
          </button>
        );
      })}
    </div>
  );
};
