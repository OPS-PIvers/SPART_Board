import React from 'react';
import { WidgetData, ActivityWallConfig } from '@/types';
import { useDashboard } from '@/context/useDashboard';
import { SurfaceColorSettings } from '@/components/common/SurfaceColorSettings';
import { TypographySettings } from '@/components/common/TypographySettings';

export const ActivityWallSettings: React.FC<{ widget: WidgetData }> = () => {
  return (
    <div className="p-4 text-sm text-slate-600 space-y-2">
      <p className="font-semibold text-slate-700">
        Activity management moved to the front of this widget.
      </p>
      <p>
        Use the Activity Library in the widget body to create, view, edit, and
        delete activities.
      </p>
    </div>
  );
};

export const ActivityWallAppearanceSettings: React.FC<{
  widget: WidgetData;
}> = ({ widget }) => {
  const { updateWidget } = useDashboard();
  const config = widget.config as ActivityWallConfig;
  const updateConfig = (updates: Partial<ActivityWallConfig>) =>
    updateWidget(widget.id, { config: { ...config, ...updates } });

  return (
    <div className="space-y-6">
      <TypographySettings config={config} updateConfig={updateConfig} />
      <SurfaceColorSettings config={config} updateConfig={updateConfig} />
    </div>
  );
};
