import React, { useRef } from 'react';
import { GripVertical, Plus, X } from 'lucide-react';
import { SortableList } from '@/components/common/SortableList';
import type { FieldProps } from '../FieldProps';
import type { ListField } from '@/components/settings/schema/types';
import { resolveLabel } from '../resolveLabel';

type Row = Record<string, unknown>;

let rowIdCounter = 0;

const ListImpl: React.FC<FieldProps> = ({
  field,
  value,
  onChange,
  id,
  describedBy,
  labelId,
  disabled,
  ctx,
  renderRow,
}) => {
  // Positional ids: an edit replaces the row object, so identity keys would remount the row and drop focus.
  const positionalIds = useRef<string[]>([]);
  const rows = Array.isArray(value) ? (value as Row[]) : [];
  while (positionalIds.current.length < rows.length) {
    positionalIds.current.push(`row-${rowIdCounter++}`);
  }
  if (positionalIds.current.length > rows.length) {
    positionalIds.current.length = rows.length;
  }

  const getRowId = (row: Row, index: number): string =>
    typeof row.id === 'string' && row.id
      ? row.id
      : (positionalIds.current[index] ?? `row-${index}`);

  if (field.type !== 'list') return null;
  const listField = field as ListField<string>;
  const maxRows = listField.maxRows;
  const sortable = listField.sortable ?? false;
  const addDisabled =
    disabled || (maxRows !== undefined && rows.length >= maxRows);

  const handleAdd = () => {
    const newRow = listField.row.createRow ? listField.row.createRow() : {};
    onChange([...rows, newRow]);
  };

  const handleRemove = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, nextRow: Row) => {
    onChange(rows.map((row, i) => (i === index ? nextRow : row)));
  };

  const addLabel = resolveLabel(
    ctx.t,
    ctx.widget.type,
    listField.addLabel ?? 'addRow'
  );
  const removeLabel = resolveLabel(ctx.t, ctx.widget.type, 'removeRow');
  const reorderLabel = resolveLabel(ctx.t, ctx.widget.type, 'reorderRow');

  const row = (
    rowValue: Row,
    index: number,
    dragHandle?: {
      attributes: React.HTMLAttributes<HTMLElement>;
      listeners: Record<string, (event: Event) => void> | undefined;
    }
  ) => (
    <div className="flex items-start gap-2">
      {dragHandle && (
        <button
          type="button"
          {...dragHandle.attributes}
          {...(dragHandle.listeners ?? {})}
          disabled={disabled}
          aria-label={reorderLabel}
          className="mt-1 text-slate-400 hover:text-slate-600 cursor-grab disabled:cursor-not-allowed"
        >
          <GripVertical style={{ width: 14, height: 14 }} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        {renderRow
          ? renderRow(rowValue, index, (next) => handleRowChange(index, next))
          : null}
      </div>
      <button
        type="button"
        onClick={() => handleRemove(index)}
        disabled={disabled}
        aria-label={removeLabel}
        className="mt-1 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed"
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      className="flex flex-col gap-2"
    >
      {sortable ? (
        <SortableList
          items={rows}
          getId={(item) => getRowId(item, rows.indexOf(item))}
          onReorder={(next) => onChange(next)}
          renderItem={(item, dragHandle, index) => row(item, index, dragHandle)}
        />
      ) : (
        rows.map((r, index) => (
          <div key={getRowId(r, index)}>{row(r, index)}</div>
        ))
      )}
      <button
        type="button"
        onClick={handleAdd}
        disabled={addDisabled}
        className="flex items-center gap-1 text-xs font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus style={{ width: 14, height: 14 }} />
        {addLabel}
      </button>
    </div>
  );
};

export const List = ListImpl;
