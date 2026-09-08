import { useCallback } from 'react';
import { useAuth } from '@/context/useAuth';
import { TOOLS } from '@/config/tools';
import type { InternalToolType, WidgetType } from '@/types';

export type ToolLabelResolver = (type: WidgetType | InternalToolType) => string;

/** Dock-facing widget name: the admin `displayName` override when set, else the static TOOLS label. */
export function useToolLabel(): ToolLabelResolver {
  const { featurePermissions } = useAuth();
  return useCallback(
    (type) => {
      const permission = featurePermissions.find((p) => p.widgetType === type);
      const staticLabel = TOOLS.find((t) => t.type === type)?.label ?? '';
      const trimmed = permission?.displayName?.trim() ?? '';
      return trimmed !== '' ? trimmed : staticLabel;
    },
    [featurePermissions]
  );
}
