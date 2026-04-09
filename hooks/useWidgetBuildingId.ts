import { useAuth } from '@/context/useAuth';
import { WidgetData } from '@/types';

/**
 * Returns the effective building ID for a widget.
 * Prefers `widget.buildingId` if it's still in the user's selected buildings,
 * otherwise falls back to the user's primary building.
 */
export function useWidgetBuildingId(widget: WidgetData): string | undefined {
  const { selectedBuildings = [] } = useAuth();
  if (widget.buildingId && selectedBuildings.includes(widget.buildingId)) {
    return widget.buildingId;
  }
  return selectedBuildings[0];
}
