import React, { memo } from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface ChecklistItemViewProps {
  id: string;
  label: string;
  isCompleted: boolean;
  dynamicFontSize: number;
  onToggle: (id: string) => void;
}

export const ChecklistItemView: React.FC<ChecklistItemViewProps> = memo(
  ({ id, label, isCompleted, dynamicFontSize, onToggle }) => {
    return (
      <li
        onClick={() => onToggle(id)}
        className="group/item flex items-start gap-3 cursor-pointer select-none"
      >
        <div
          className="shrink-0 transition-transform active:scale-90 flex items-center justify-center"
          style={{ height: `${dynamicFontSize * 1.2}px` }}
        >
          {isCompleted ? (
            <CheckSquare
              className="text-green-500 fill-green-50"
              style={{
                width: `${dynamicFontSize}px`,
                height: `${dynamicFontSize}px`,
              }}
            />
          ) : (
            <Square
              className="text-slate-300"
              style={{
                width: `${dynamicFontSize}px`,
                height: `${dynamicFontSize}px`,
              }}
            />
          )}
        </div>
        <span
          className={`font-medium leading-tight transition-all ${
            isCompleted
              ? 'text-slate-400 line-through decoration-slate-300'
              : 'text-slate-700'
          }`}
          style={{ fontSize: `${dynamicFontSize}px` }}
        >
          {label}
        </span>
      </li>
    );
  }
);

ChecklistItemView.displayName = 'ChecklistItemView';
