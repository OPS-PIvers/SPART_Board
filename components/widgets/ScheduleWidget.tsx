import React, { useCallback, useRef, useEffect } from 'react';
import { useDashboard } from '../../context/useDashboard';
import { useScaledFont } from '../../hooks/useScaledFont';
import {
  WidgetData,
  ScheduleItem,
  ScheduleConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../types';
import { Circle, CheckCircle2 } from 'lucide-react';

interface ScheduleRowProps {
  item: ScheduleItem;
  index: number;
  onToggle: (idx: number) => void;
  timeSize: number;
  taskSize: number;
}

const ScheduleRow = React.memo<ScheduleRowProps>(
  ({ item, index, onToggle, timeSize, taskSize }) => {
    return (
      <button
        onClick={() => onToggle(index)}
        className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
          item.done
            ? 'bg-white/30 border-white/20 opacity-60'
            : 'bg-white/50 border-white/30'
        }`}
      >
        {item.done ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-indigo-300" />
        )}
        <div className="flex flex-col items-start">
          <span
            className={`font-mono font-bold ${item.done ? 'text-slate-400' : 'text-indigo-400'}`}
            style={{ fontSize: `${timeSize}px` }}
          >
            {item.time}
          </span>
          <span
            className={`font-bold leading-tight ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}
            style={{ fontSize: `${taskSize}px` }}
          >
            {item.task}
          </span>
        </div>
      </button>
    );
  }
);

ScheduleRow.displayName = 'ScheduleRow';

export const ScheduleWidget: React.FC<{ widget: WidgetData }> = ({
  widget,
}) => {
  const { updateWidget, activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as ScheduleConfig;
  const items = React.useMemo(() => config.items ?? [], [config.items]);

  // Stable callback pattern: Store full config in ref to ensure
  // we preserve all properties during updates while keeping handler stable.
  const configRef = useRef(config);

  // Update ref when config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const toggle = useCallback(
    (idx: number) => {
      const currentConfig = configRef.current;
      const currentItems = currentConfig.items ?? [];
      const newItems = [...currentItems];
      if (newItems[idx]) {
        newItems[idx] = { ...newItems[idx], done: !newItems[idx].done };

        // Explicitly spread currentConfig to preserve all properties,
        // addressing potential data loss concerns.
        updateWidget(widget.id, {
          config: { ...currentConfig, items: newItems } as ScheduleConfig,
        });
      }
    },
    [updateWidget, widget.id]
  );

  const taskSize = useScaledFont(widget.w, widget.h, 0.35, 14, 24);
  const timeSize = useScaledFont(widget.w, widget.h, 0.2, 10, 14);

  return (
    <div
      className={`h-full flex flex-col p-4 bg-transparent rounded-lg font-${globalStyle.fontFamily}`}
    >
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {items.map((item: ScheduleItem, i: number) => (
          <ScheduleRow
            key={i}
            index={i}
            item={item}
            onToggle={toggle}
            timeSize={timeSize}
            taskSize={taskSize}
          />
        ))}
      </div>
    </div>
  );
};
