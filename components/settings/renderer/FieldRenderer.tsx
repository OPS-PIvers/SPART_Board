import React, { useCallback, useId, useMemo } from 'react';
import type { WidgetData } from '@/types';
import type { Field, FieldCtx, UpdateConfig } from '../schema/types';
import { FIELD_COMPONENTS } from './fields';
import { resolveLabel } from './resolveLabel';

export type FieldRendererProps = {
  field: Field;
  widget: WidgetData;
  ctx: FieldCtx;
  updateConfig: UpdateConfig;
  defaults?: Record<string, unknown>;
};

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  widget,
  ctx,
  updateConfig,
  defaults,
}) => {
  const uid = useId();
  const id = `${uid}${widget.id}-${field.key}`;
  const helpId = `${id}-help`;

  const onChange = useCallback(
    (value: unknown) => updateConfig({ [field.key]: value }),
    [updateConfig, field.key]
  );

  const label = resolveLabel(ctx.t, widget.type, field.label);
  const help = field.help
    ? resolveLabel(ctx.t, widget.type, field.help)
    : undefined;

  const visible = field.visibleWhen ? field.visibleWhen(ctx) : true;
  const disabled = field.disabledWhen ? field.disabledWhen(ctx) : false;
  const value = ctx.config[field.key];

  const defaultValue = defaults ? defaults[field.key] : undefined;
  const canReset =
    defaults !== undefined &&
    defaultValue !== undefined &&
    value !== undefined &&
    value !== defaultValue;

  const control = useMemo(() => {
    const Component = FIELD_COMPONENTS[field.type] ?? FIELD_COMPONENTS.custom;
    const renderRow =
      field.type === 'list'
        ? (
            row: Record<string, unknown>,
            rowIndex: number,
            onRowChange: (nextRow: Record<string, unknown>) => void
          ) => (
            <div className="flex flex-col gap-1">
              {field.row.fields.map((rowField) => (
                <FieldRenderer
                  key={rowField.key}
                  field={rowField}
                  widget={widget}
                  ctx={{ ...ctx, config: row }}
                  updateConfig={(patch) => onRowChange({ ...row, ...patch })}
                />
              ))}
            </div>
          )
        : undefined;
    return (
      <Component
        field={field}
        value={value}
        onChange={onChange}
        id={id}
        describedBy={help ? helpId : undefined}
        disabled={disabled}
        ctx={ctx}
        updateConfig={updateConfig}
        renderRow={renderRow}
      />
    );
  }, [
    field,
    widget,
    ctx,
    updateConfig,
    value,
    onChange,
    id,
    help,
    helpId,
    disabled,
  ]);

  if (!visible) return null;

  const inline = field.type === 'toggle';

  const labelRow = (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-xs font-semibold text-slate-700">
        {label}
      </label>
      {canReset && (
        <button
          type="button"
          onClick={() => onChange(defaultValue)}
          className="text-xxs text-slate-600 hover:text-slate-800 underline"
        >
          {resolveLabel(ctx.t, widget.type, 'reset')}
        </button>
      )}
    </div>
  );

  const helpLine = help ? (
    <p id={helpId} className="text-xxs text-slate-600">
      {help}
    </p>
  ) : null;

  return (
    <div
      data-layout={inline ? 'inline' : 'stacked'}
      data-field-key={field.key}
      className={
        inline
          ? 'flex items-start justify-between gap-3 py-2'
          : 'flex flex-col gap-1.5 py-2'
      }
    >
      {inline ? (
        <>
          <div className="flex flex-col gap-0.5 min-w-0">
            {labelRow}
            {helpLine}
          </div>
          <fieldset disabled={disabled} className="contents">
            {control}
          </fieldset>
        </>
      ) : (
        <>
          {labelRow}
          <fieldset disabled={disabled} className="contents">
            {control}
          </fieldset>
          {helpLine}
        </>
      )}
    </div>
  );
};
