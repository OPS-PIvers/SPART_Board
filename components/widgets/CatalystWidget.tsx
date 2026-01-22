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
import { LayoutGrid, Brain, Settings2, HelpCircle } from 'lucide-react';

export const CatalystWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addWidget } = useDashboard();
  const config = widget.config as CatalystConfig;
  const activeTab =
    (config.activeTab as unknown as RoutineCategory) || 'Get Attention';

  const categories: {
    id: RoutineCategory;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: 'Get Attention', label: 'Attention', icon: LayoutGrid },
    { id: 'Engage', label: 'Engage', icon: Brain },
    { id: 'Set Up', label: 'Set Up', icon: Settings2 },
    { id: 'Support', label: 'Support', icon: HelpCircle },
  ];

  const filteredRoutines = CATALYST_ROUTINES.filter(
    (r) => r.category === activeTab
  );

  const spawnAssociatedTools = (routine: CatalystRoutine) => {
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

  const handleTeacherMode = (routine: CatalystRoutine) => {
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

  const handleGoMode = (routine: CatalystRoutine) => {
    // 1. Spawn Visual Anchor
    addWidget('catalyst-visual' as WidgetType, {
      x: 100,
      y: 100,
      w: 350,
      h: 350,
      config: {
        routineId: routine.id,
        title: routine.title,
        icon: routine.icon,
        category: routine.category,
        stepIndex: 0,
      },
    });

    // 2. Spawn Associated Tools
    spawnAssociatedTools(routine);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-200">
      {/* Header Tabs */}
      <div className="flex bg-slate-50 border-b border-slate-200">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() =>
                updateWidget(widget.id, {
                  config: {
                    ...config,
                    activeTab: cat.id as CatalystConfig['activeTab'],
                  },
                })
              }
              className={`flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-all ${
                isActive
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={18} />
              <span className="text-[10px] font-black uppercase tracking-tighter">
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
        {filteredRoutines.map((routine) => {
          const ActionIcon =
            (Icons as unknown as Record<string, React.ElementType>)[
              routine.icon
            ] ?? Icons.Zap;
          return (
            <div
              key={routine.id}
              className="group bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600 shadow-sm">
                  <ActionIcon size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm text-slate-700 leading-tight">
                    {routine.title}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {routine.shortDesc}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleTeacherMode(routine)}
                  className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all shadow-sm"
                >
                  Guide
                </button>
                <button
                  onClick={() => handleGoMode(routine)}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                >
                  Go Mode
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CatalystSettings: React.FC<{ widget: WidgetData }> = ({
  widget: _widget,
}) => {
  return (
    <div className="p-4 text-center space-y-4">
      <div className="p-8 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200">
        <Icons.Command className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <h3 className="font-black text-blue-800 uppercase tracking-widest text-sm">
          Command Center
        </h3>
        <p className="text-xs text-blue-600 mt-2 leading-relaxed font-medium">
          The Catalyst widget provides quick access to teaching routines and
          automates tool setup.
        </p>
      </div>
    </div>
  );
};
