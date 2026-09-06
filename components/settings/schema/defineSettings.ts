import type { WidgetSettingsSchema } from './types';

/** Typed identity helper: every top-level field key must be a `Config` key. */
export function defineSettings<C>(
  schema: WidgetSettingsSchema<C>
): WidgetSettingsSchema<C> {
  return schema;
}
