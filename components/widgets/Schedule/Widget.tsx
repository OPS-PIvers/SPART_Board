import React from 'react';
import { useDashboard } from '../../../context/useDashboard';
import { useScaledFont } from '../../../hooks/useScaledFont';
import {
  WidgetData,
  ScheduleItem,
  ScheduleConfig,
  DEFAULT_GLOBAL_STYLE,
} from '../../../types';
import { Circle, CheckCircle2, Clock } from 'lucide-react';
import { useSchedule } from './useSchedule';

interface ScheduleRowProps {
  item: ScheduleItem;
  index: number;
  isActive: boolean;
  onToggle: (idx: number) => void;
  timeSize: number;
  taskSize: number;
  iconSize: number;
  countdown: string | null;
}

const ScheduleRow = React.memo<ScheduleRowProps>(
  ({
    item,
    index,
    isActive,
    onToggle,
    timeSize,
    taskSize,
    iconSize,
    countdown,
  }) => {
    return (
      <button
        onClick={() => onToggle(index)}
        className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
          item.done
            ? 'bg-white/30 border-white/20 opacity-60'
            : isActive
              ? 'bg-indigo-50/80 border-indigo-200 ring-2 ring-indigo-500/20'
              : 'bg-white/50 border-white/30'
        }`}
      >
        {item.done ? (
          <CheckCircle2 className="text-green-500 shrink-0" size={iconSize} />
        ) : (
          <Circle
            className={`shrink-0 ${isActive ? 'text-indigo-500' : 'text-indigo-300'}`}
            size={iconSize}
          />
        )}
        <div className="flex flex-col items-start flex-1 min-w-0">
          <div className="flex items-center justify-between w-full gap-2">
            <span
              className={`font-mono font-bold ${item.done ? 'text-slate-400' : isActive ? 'text-indigo-600' : 'text-indigo-400'}`}
              style={{ fontSize: `${timeSize}px` }}
            >
              {item.time}
              {item.endTime ? ` - ${item.endTime}` : ''}
            </span>
            {isActive && countdown && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-mono font-bold text-[10px] animate-pulse">
                <Clock className="w-3 h-3" />
                {countdown}
              </span>
            )}
          </div>
          <span
            className={`font-bold leading-tight truncate w-full text-left ${item.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}
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
  const { activeDashboard } = useDashboard();
  const globalStyle = activeDashboard?.globalStyle ?? DEFAULT_GLOBAL_STYLE;
  const config = widget.config as ScheduleConfig;
  const { fontFamily = 'global' } = config;

  const { items, activeIndex, countdown, toggleDone } = useSchedule(
    widget.id,
    config
  );

  const taskSize = useScaledFont(widget.w, widget.h, 0.35, 14, 36);
  const timeSize = useScaledFont(widget.w, widget.h, 0.2, 10, 22);
  const iconSize = useScaledFont(widget.w, widget.h, 0.3, 16, 32);

  const getFontClass = () => {
    if (fontFamily === 'global') {
      return `font-${globalStyle.fontFamily}`;
    }
    if (fontFamily.startsWith('font-')) {
      return fontFamily;
    }
    return `font-${fontFamily}`;
  };

  return (
    <div className={`h-full flex flex-col p-4 ${getFontClass()}`}>
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {items.map((item: ScheduleItem, i: number) => (
          <ScheduleRow
            key={item.id}
            index={i}
            item={item}
            isActive={i === activeIndex}
            onToggle={toggleDone}
            timeSize={timeSize}
            taskSize={taskSize}
            iconSize={iconSize}
            countdown={i === activeIndex ? countdown : null}
          />
        ))}
        {items.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-60">
            <Clock className="w-8 h-8" />
            <p className="text-xs font-medium">No events scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
};
