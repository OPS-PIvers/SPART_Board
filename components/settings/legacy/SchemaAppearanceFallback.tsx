import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/useAuth';
import { useDashboardActions } from '@/context/dashboardCanvasStore';
import { WIDGET_SETTINGS_SCHEMAS } from '@/components/widgets/WidgetRegistry';
import type { WidgetData, WidgetType } from '@/types';
import type { FieldCtx, WidgetSettingsSchema } from '../schema/types';
import { resolveStyleFields } from '../schema/styleKeys';
import { FieldRenderer } from '../renderer/FieldRenderer';

export interface SchemaAppearanceFallbackProps {
  widget: WidgetData;
}

type SchemaState = {
  type: WidgetType | null;
  schema: WidgetSettingsSchema | null | undefined;
};

// Dispatch (not setState) mirrors SettingsDrawerHost's loader — keeps the no-setState-in-effect rule happy.
const schemaReducer = (_: SchemaState, next: SchemaState): SchemaState => next;

// Flag-off fallback rendering a migrated widget's Content-tier styleKeys into the legacy panel's Style tab (item 2.8).
export const SchemaAppearanceFallback: React.FC<
  SchemaAppearanceFallbackProps
> = ({ widget }) => {
  const { t } = useTranslation();
  const { isAdmin, canAccessFeature } = useAuth();
  const { updateWidget } = useDashboardActions();

  const [schemaState, dispatchSchema] = useReducer(schemaReducer, {
    type: null,
    schema: null,
  });
  useEffect(() => {
    const loader = WIDGET_SETTINGS_SCHEMAS[widget.type];
    if (!loader) {
      dispatchSchema({ type: widget.type, schema: null });
      return undefined;
    }
    dispatchSchema({ type: widget.type, schema: undefined });
    let cancelled = false;
    void loader()
      .then((loaded) => {
        if (!cancelled) dispatchSchema({ type: widget.type, schema: loaded });
      })
      .catch(() => {
        if (!cancelled) dispatchSchema({ type: widget.type, schema: null });
      });
    return () => {
      cancelled = true;
    };
  }, [widget.type]);
  const schema =
    schemaState.type === widget.type ? schemaState.schema : undefined;

  const widgetId = widget.id;
  const widgetConfig = widget.config;
  const updateConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateWidget(widgetId, {
        config: { ...(widgetConfig ?? {}), ...patch },
      });
    },
    [widgetId, widgetConfig, updateWidget]
  );

  const config = useMemo(
    () => (widget.config ?? {}) as Record<string, unknown>,
    [widget.config]
  );

  const ctx: FieldCtx = useMemo(
    () => ({
      config,
      widget,
      isAdmin: isAdmin === true,
      canAccessFeature,
      t,
    }),
    [config, widget, isAdmin, canAccessFeature, t]
  );

  if (!schema) return null;

  const styleFields = resolveStyleFields(schema.styleKeys);
  if (styleFields.length === 0) return null;

  return (
    <div className="flex flex-col divide-y divide-slate-100">
      {styleFields.map((field) => (
        <FieldRenderer
          key={field.key}
          field={field}
          widget={widget}
          ctx={ctx}
          updateConfig={updateConfig}
        />
      ))}
    </div>
  );
};
