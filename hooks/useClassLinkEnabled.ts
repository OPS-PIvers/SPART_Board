import { useMemo } from 'react';
import { useAuth } from '@/context/useAuth';

/**
 * Resolves whether ClassLink sync should be visible for a given building.
 *
 * Looks up the `classes` feature permission's `buildingDefaults[buildingId]`
 * setting, which is managed by the admin `ClassesConfigurationPanel`. Defaults
 * to enabled when no building is selected or no override is configured.
 */
export function useClassLinkEnabled(buildingId?: string): boolean {
  const { featurePermissions } = useAuth();
  return useMemo(() => {
    if (!buildingId) return true;
    const perm = featurePermissions.find((p) => p.widgetType === 'classes');
    const defaults = (
      perm?.config as
        | {
            buildingDefaults?: Record<string, { classLinkEnabled?: boolean }>;
          }
        | undefined
    )?.buildingDefaults?.[buildingId];
    return defaults?.classLinkEnabled ?? true;
  }, [featurePermissions, buildingId]);
}
