import React from 'react';
import { useDashboard } from '../../context/useDashboard';
import {
  WidgetData,
  CatalystConfig,
  WidgetType,
  WidgetConfig,
} from '../../types';
import {
  CATALYST_ACTIONS,
  CatalystAction,
} from '../../config/catalystRoutines';
import * as Icons from 'lucide-react';
import { LayoutGrid, Brain, Settings2, HelpCircle } from 'lucide-react';

export const CatalystWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, addWidget } = useDashboard();
  const config = widget.config as CatalystConfig;
  const activeTab = config.activeTab || 'attention';

  const categories = [
    { id: 'attention', label: 'Attention', icon: LayoutGrid },
    { id: 'engage', label: 'Engage', icon: Brain },
    { id: 'setup', label: 'Set Up', icon: Settings2 },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ] as const;

  const filteredActions = CATALYST_ACTIONS.filter(
    (a) => a.category === activeTab
  );

  const spawnAssociatedTools = (action: CatalystAction) => {
    if (action.associatedTools) {
      action.associatedTools.forEach((tool, index) => {
        addWidget(tool.type, {
          x: widget.x + (index + 1) * 40,
          y: widget.y + (index + 1) * 40,
          config: tool.config as WidgetConfig,
        });
      });
    }
  };

  const handleTeacherMode = (action: CatalystAction) => {
    addWidget('catalyst-instruction' as WidgetType, {
      x: widget.x + widget.w + 20,
      y: widget.y,
      config: { routineId: action.id, stepIndex: 0 },
    });
  };

  const handleGoMode = (action: CatalystAction) => {
    // 1. Spawn Action Widget (if any)
    if (action.actionWidget) {
      addWidget(action.actionWidget.type, {
        x: widget.x,
        y: widget.y - 250,
        config: action.actionWidget.config as WidgetConfig,
      });
    }

    // 2. Spawn Visual Anchor
    addWidget('catalyst-visual' as WidgetType, {
      x: 100,
      y: 100,
      w: 600,
      h: 400,
      config: { routineId: action.id, stepIndex: 0 },
    });

    // 3. Spawn Associated Tools
    spawnAssociatedTools(action);
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
                  config: { ...config, activeTab: cat.id },
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
        {filteredActions.map((action) => {
          const ActionIcon =
            (Icons as unknown as Record<string, React.ElementType>)[
              action.icon
            ] ?? Icons.Zap;
          return (
            <div
              key={action.id}
              className="group bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={`p-2 rounded-xl bg-${action.color}-100 text-${action.color}-600 shadow-sm`}
                >
                  <ActionIcon size={20} />
                </div>
                <span className="font-black text-sm text-slate-700">
                  {action.label}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleTeacherMode(action)}
                  className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all shadow-sm"
                >
                  Teacher Mode
                </button>
                <button
                  onClick={() => handleGoMode(action)}
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
