import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/useAuth';
import { useDashboardActions } from '@/context/dashboardCanvasStore';
import { WIDGET_SETTINGS_SCHEMAS } from '@/components/widgets/WidgetRegistry';
import { SettingsLabel } from '@/components/common/SettingsLabel';
import type { WidgetData, WidgetType } from '@/types';
import type { FieldCtx, WidgetSettingsSchema } from '../schema/types';
import { resolveStyleFields } from '../schema/styleKeys';
import { SchemaRenderer } from '../renderer/SchemaRenderer';
import { FieldRenderer } from '../renderer/FieldRenderer';
import { resolveLabel } from '../renderer/resolveLabel';

export interface SchemaSettingsFallbackProps {
  widget: WidgetData;
}

type SchemaState = {
  type: WidgetType | null;
  schema: WidgetSettingsSchema | null | undefined;
};

// Dispatch (not setState) mirrors SettingsDrawerHost's loader — keeps the no-setState-in-effect rule happy.
const schemaReducer = (_: SchemaState, next: SchemaState): SchemaState => next;

/**
 * Flag-off fallback for a migrated widget's legacy settings panel (item 2.8).
 * Renders the schema's groups plus a trailing Style section for its
 * `styleKeys`; the legacy panel's own Style tab still supplies the Window
 * tier (UniversalStyleSettings) since this only fills the "settings" slot.
 */
export const SchemaSettingsFallback: React.FC<SchemaSettingsFallbackProps> = ({
  widget,
}) => {
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
    void loader().then((loaded) => {
      if (!cancelled) dispatchSchema({ type: widget.type, schema: loaded });
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

  if (schema === undefined) {
    return (
      <div
        className="flex flex-col gap-3"
        data-testid="widget-settings-fallback-skeleton"
        aria-busy="true"
      >
        <span className="sr-only">{t('widgetSettings.common.loading')}</span>
        {[0, 1, 2].map((row) => (
          <div key={row} className="h-8 rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!schema) {
    return (
      <p className="text-sm text-slate-500 italic">
        {t('widgetSettings.common.empty')}
      </p>
    );
  }

  const styleFields = resolveStyleFields(schema.styleKeys);

  return (
    <div className="flex flex-col gap-5">
      <SchemaRenderer
        schema={schema}
        widget={widget}
        ctx={ctx}
        updateConfig={updateConfig}
      />
      {styleFields.length > 0 && (
        <section data-group="style">
          <SettingsLabel as="span">
            {resolveLabel(t, widget.type, 'style.contentTier')}
          </SettingsLabel>
          <div className="divide-y divide-slate-100">
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
        </section>
      )}
    </div>
  );
};
