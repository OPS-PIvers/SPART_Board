import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import { WidgetData, CatalystVisualConfig } from '../../types';
import { DraggableWindow } from '../common/DraggableWindow';
import { getIcon } from '../../utils/icons';
import {
  Hand,
  Megaphone,
  Users,
  ListTodo,
  Zap,
  HelpCircle,
} from 'lucide-react';

export const CatalystVisualWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const {
    updateWidget,
    removeWidget,
    duplicateWidget,
    bringToFront,
    addToast,
  } = useDashboard();
  const config = widget.config as CatalystVisualConfig;

  const renderIcon = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      Hand: Hand,
      Megaphone: Megaphone,
      Users: Users,
      ListTodo: ListTodo,
      Zap: Zap,
    };
    const Icon = icons[iconName] ?? getIcon(iconName) ?? HelpCircle;
    return React.createElement(Icon, { className: 'w-32 h-32' });
  };

  const colors: Record<string, string> = {
    'Get Attention': 'bg-red-50 text-red-600 border-red-200',
    Engage: 'bg-blue-50 text-blue-600 border-blue-200',
    'Set Up': 'bg-green-50 text-green-600 border-green-200',
    Support: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  const theme =
    colors[config.category ?? ''] ??
    'bg-slate-50 text-slate-600 border-slate-200';
  const title = config.title ?? 'Visual Anchor';

  return (
    <DraggableWindow
      widget={widget}
      title={title}
      settings={<CatalystVisualSettings widget={widget} />}
      updateWidget={updateWidget}
      removeWidget={removeWidget}
      duplicateWidget={duplicateWidget}
      bringToFront={bringToFront}
      addToast={addToast}
      globalStyle={{
        fontFamily: 'sans',
        windowTransparency: 0.8,
        windowBorderRadius: '2xl',
        dockTransparency: 0.4,
        dockBorderRadius: 'full',
        dockTextColor: '#334155',
        dockTextShadow: false,
      }}
    >
      <div
        className={`h-full flex flex-col items-center justify-center p-6 ${theme} border-4 border-double rounded-b-xl`}
      >
        <div className="mb-4 animate-pulse">
          {renderIcon(config.icon ?? '')}
        </div>
        <h2 className="text-2xl font-black text-center uppercase tracking-wider leading-tight">
          {title}
        </h2>
      </div>
    </DraggableWindow>
  );
};

export const CatalystVisualSettings: React.FC<{ widget: WidgetData }> = ({
  widget: _widget,
}) => {
  return (
    <div className="p-4 text-center">
      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
        Visual Anchor Mode
      </p>
    </div>
  );
};
