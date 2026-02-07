import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import {
  WidgetData,
  CatalystConfig,
  WidgetType,
  WidgetConfig,
  CatalystRoutine,
} from '../../types';
import { CATALYST_ROUTINES } from '../../config/catalystRoutines';
import { DEFAULT_CATALYST_CATEGORIES } from '../../config/catalystDefaults';
import * as Icons from 'lucide-react';
import { Zap, BookOpen, ChevronLeft } from 'lucide-react';

import { WidgetLayout } from './WidgetLayout';
import { CatalystSettings } from './CatalystSettings'; // Import the new settings component

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

  // Merge categories: Start with defaults, override/append with custom by ID
  const categoriesMap = new Map<
    string,
    (typeof DEFAULT_CATALYST_CATEGORIES)[number]
  >();
  DEFAULT_CATALYST_CATEGORIES.forEach((c) => categoriesMap.set(c.id, c));
  if (config.customCategories) {
    config.customCategories.forEach((c) => categoriesMap.set(c.id, c));
  }
  const categories = Array.from(categoriesMap.values());

  // Merge routines: Start with defaults, override/append with custom
  const routinesMap = new Map<string, CatalystRoutine>();
  CATALYST_ROUTINES.forEach((r) => routinesMap.set(r.id, r));
  if (config.customRoutines) {
    config.customRoutines.forEach((r) => routinesMap.set(r.id, r));
  }
  const allRoutines = Array.from(routinesMap.values());

  const activeRoutine = activeStrategyId
    ? allRoutines.find((r) => r.id === activeStrategyId)
    : null;

  const filteredRoutines = activeCategory
    ? allRoutines.filter((r) => r.category === activeCategory)
    : [];

  const renderIcon = (
    iconName: string,
    size: number = 24,
    className: string = ''
  ) => {
    // Validate icon URLs before rendering
    const isSafeIconUrl = (value: string): boolean => {
      if (!value) return false;
      if (value.startsWith('data:')) {
        // Only allow data URLs that are clearly images and reasonably sized
        const MAX_DATA_URL_LENGTH = 100_000;
        return (
          /^data:image\//i.test(value) && value.length <= MAX_DATA_URL_LENGTH
        );
      }
      try {
        const url = new URL(value);
        return url.protocol === 'https:';
      } catch {
        return false;
      }
    };

    if (isSafeIconUrl(iconName)) {
      return (
        <img
          src={iconName}
          className={`object-contain ${className}`}
          alt=""
          style={{ width: size, height: size }}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      );
    }
    const IconComp =
      (Icons as unknown as Record<string, React.ElementType>)[iconName] ?? Zap;
    return <IconComp size={size} className={className} />;
  };

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
        return (
          <button
            key={cat.id}
            onClick={() => navigateTo(cat.id, null)}
            className={`${cat.color} h-32 rounded-3xl p-4 flex flex-col items-center justify-center gap-3 text-white shadow-lg hover:scale-105 transition-transform`}
          >
            {renderIcon(cat.icon, 32)}
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
          {categories.find((c) => c.id === activeCategory)?.label ??
            activeCategory}
        </h2>
      </div>
      {filteredRoutines.map((routine) => {
        return (
          <button
            key={routine.id}
            onClick={() => navigateTo(activeCategory, routine.id)}
            className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left shadow-sm"
          >
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
              {renderIcon(routine.icon, 24)}
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
              {renderIcon(activeRoutine.icon, 20)}
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

// Re-export CatalystSettings so WidgetRegistry can load it via lazyNamed(() => import('./CatalystWidget'), 'CatalystSettings')
export { CatalystSettings };
