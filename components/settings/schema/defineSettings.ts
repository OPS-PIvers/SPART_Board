import type { WidgetSettingsSchema } from './types';

/** Checks every top-level field key against `C` at compile time, then erases `C` so the registry/drawer need no cast. */
export function defineSettings<C>(
  schema: WidgetSettingsSchema<C>
): WidgetSettingsSchema {
  return schema as WidgetSettingsSchema;
}
