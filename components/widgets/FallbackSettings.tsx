import React from 'react';
import { WidgetData } from '@/types';

// Fallback settings components
// These components must accept the widget prop to satisfy the SettingsComponent type signature,
// even if they don't use it.

export const DefaultSettings: React.FC<{ widget: WidgetData }> = () => (
  <div className="text-slate-500 italic text-sm">
    Standard settings available.
  </div>
);

export const MiniAppSettings: React.FC<{ widget: WidgetData }> = () => (
  <div className="text-slate-500 italic text-sm">
    Manage apps in the main view.
  </div>
);
