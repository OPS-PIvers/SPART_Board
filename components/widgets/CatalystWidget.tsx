import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import {
  WidgetData,
  CatalystConfig,
  WidgetType,
  WidgetConfig,
} from '../../types';
import {
  CATALYST_ROUTINES,
  CatalystRoutine,
  RoutineCategory,
} from '../../config/catalystRoutines';
import * as Icons from 'lucide-react';
import {
  LayoutGrid,
  Brain,
  Settings2,
  HelpCircle,
  ChevronLeft,
  Zap,
  BookOpen,
} from 'lucide-react';

import { WidgetLayout } from './WidgetLayout';

export const CatalystWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addWidget } = useDashboard();
  const config = widget.config as CatalystConfig;
  const { activeCategory, activeStrategyId } = config;

  const navigateTo = (catId: string | null, stratId: string | null) => {
    updateWidget(widget.id, {
      config: {
        ...config,
        activeCategory: catId,
        activeStrategyId: stratId,
      },
    });
  };

  const categories: {
    id: RoutineCategory;
    label: string;
    icon: React.ElementType;
    color: string;
  }[] = [
    {
      id: 'Get Attention',
      label: 'Attention',
      icon: LayoutGrid,
      color: 'bg-red-500',
    },
    { id: 'Engage', label: 'Engage', icon: Brain, color: 'bg-amber-500' },
    { id: 'Set Up', label: 'Set Up', icon: Settings2, color: 'bg-emerald-500' },
    { id: 'Support', label: 'Support', icon: HelpCircle, color: 'bg-blue-500' },
  ];

  const activeRoutine = activeStrategyId
    ? CATALYST_ROUTINES.find((r) => r.id === activeStrategyId)
    : null;

  const filteredRoutines = activeCategory
    ? CATALYST_ROUTINES.filter((r) => r.category === activeCategory)
    : [];

  const handleGoMode = (routine: CatalystRoutine) => {
    // 1. Spawn Visual Anchor
    addWidget('catalyst-visual' as WidgetType, {
      x: 100,
      y: 100,
      w: 600,
      h: 400,
      config: {
        routineId: routine.id,
        title: routine.title,
        icon: routine.icon,
        category: routine.category,
        stepIndex: 0,
      },
    });

    // 2. Spawn Associated Tools
    if (routine.associatedWidgets) {
      routine.associatedWidgets.forEach((tool, index) => {
        addWidget(tool.type, {
          x: widget.x + (index + 1) * 40,
          y: widget.y + (index + 1) * 40,
          config: tool.config as WidgetConfig,
        });
      });
    }
  };

  const handleGuideMode = (routine: CatalystRoutine) => {
    addWidget('catalyst-instruction' as WidgetType, {
      x: widget.x + widget.w + 20,
      y: widget.y,
      config: {
        routineId: routine.id,
        title: routine.title,
        instructions: routine.instructions,
        stepIndex: 0,
      },
    });
  };

  const renderCategories = () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            onClick={() => navigateTo(cat.id, null)}
            className={`${cat.color} h-32 rounded-3xl p-4 flex flex-col items-center justify-center gap-3 text-white shadow-lg hover:scale-105 transition-transform`}
          >
            <Icon size={32} />
            <span className="font-black uppercase tracking-widest text-xs">
              {cat.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderRoutineList = () => (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => navigateTo(null, null)}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-black uppercase tracking-widest text-slate-700">
          {activeCategory}
        </h2>
      </div>
      {filteredRoutines.map((routine) => {
        const RoutineIcon =
          (Icons as unknown as Record<string, React.ElementType>)[
            routine.icon
          ] ?? Zap;
        return (
          <button
            key={routine.id}
            onClick={() => navigateTo(activeCategory, routine.id)}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left shadow-sm"
          >
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
              <RoutineIcon size={24} />
            </div>
            <div>
              <div className="font-black uppercase text-sm text-slate-700">
                {routine.title}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {routine.shortDesc}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderRoutineDetail = () => {
    if (!activeRoutine) return null;
    const RoutineIcon =
      (Icons as unknown as Record<string, React.ElementType>)[
        activeRoutine.icon
      ] ?? Zap;

    return (
      <div className="flex flex-col h-full p-4">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigateTo(activeCategory, null)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
              <RoutineIcon size={20} />
            </div>
            <h2 className="font-black uppercase tracking-widest text-indigo-900 text-sm">
              {activeRoutine.title}
            </h2>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-y-auto custom-scrollbar">
          <h3 className="font-black uppercase text-[10px] text-slate-400 tracking-[0.2em] mb-4">
            Teacher Guide
          </h3>
          <div className="space-y-4">
            {activeRoutine.instructions.split('\n').map((line, i) => (
              <p
                key={i}
                className="text-sm font-medium text-slate-600 leading-relaxed"
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => handleGuideMode(activeRoutine)}
            className="bg-white border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <BookOpen size={18} />
            Guide
          </button>
          <button
            onClick={() => handleGoMode(activeRoutine)}
            className="bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Zap size={18} />
            Go Mode
          </button>
        </div>
      </div>
    );
  };

  const getContent = () => {
    if (activeStrategyId) return renderRoutineDetail();
    if (activeCategory) return renderRoutineList();
    return renderCategories();
  };

  return (
    <WidgetLayout
      padding="p-0"
      content={
        <div className="w-full h-full bg-slate-50 overflow-y-auto custom-scrollbar">
          {getContent()}
        </div>
      }
    />
  );
};

export const CatalystSettings: React.FC<{ widget: WidgetData }> = ({
  widget: _widget,
}) => {
  return (
    <div className="p-4 text-center space-y-4">
      <div className="p-8 bg-indigo-50 rounded-3xl border-2 border-dashed border-indigo-200">
        <Icons.Rocket className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
        <h3 className="font-black text-indigo-800 uppercase tracking-widest text-sm">
          Catalyst Engine
        </h3>
        <p className="text-xs text-indigo-600 mt-2 leading-relaxed font-medium">
          Automate classroom routines and deploy interactive tools instantly.
        </p>
      </div>
    </div>
  );
};
