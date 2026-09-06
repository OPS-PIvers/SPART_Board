import React, { useId } from 'react';
import { SettingsLabel } from '@/components/common/SettingsLabel';
import type { WidgetData } from '@/types';
import {
  GROUP_ORDER,
  type FieldCtx,
  type Group,
  type UpdateConfig,
  type WidgetSettingsSchema,
} from '../schema/types';
import { FieldRenderer } from './FieldRenderer';
import { resolveLabel } from './resolveLabel';

export type SchemaRendererProps = {
  schema: WidgetSettingsSchema;
  widget: WidgetData;
  ctx: FieldCtx;
  updateConfig: UpdateConfig;
  defaults?: Record<string, unknown>;
};

export const SchemaRenderer: React.FC<SchemaRendererProps> = ({
  schema,
  widget,
  ctx,
  updateConfig,
  defaults,
}) => {
  const uid = useId();

  const groups = GROUP_ORDER.map((id) =>
    schema.groups.find((group) => group.id === id)
  ).filter((group): group is Group => group !== undefined);

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        const visibleFields = group.fields.filter((field) =>
          field.visibleWhen ? field.visibleWhen(ctx) : true
        );
        if (visibleFields.length === 0) return null;

        const headingId = `${uid}${widget.id}-group-${group.id}`;
        const title = resolveLabel(
          ctx.t,
          widget.type,
          group.title ?? `group.${group.id}`
        );

        return (
          <section
            key={group.id}
            role="group"
            aria-labelledby={headingId}
            data-group={group.id}
          >
            <SettingsLabel as="span" id={headingId} tone="drawer">
              {title}
            </SettingsLabel>
            <div className="divide-y divide-slate-100">
              {visibleFields.map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  widget={widget}
                  ctx={ctx}
                  updateConfig={updateConfig}
                  defaults={defaults}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
