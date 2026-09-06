import type { WidgetType } from '@/types';
import type { TranslateFn } from '../schema/types';

const MISSING = ' __missing__';

/** Resolves a bare leaf key: widgetSettings.<type>.<leaf>, then widgetSettings.common.<leaf>. */
export function resolveLabel(
  t: TranslateFn,
  widgetType: WidgetType,
  leaf: string
): string {
  const scoped = t(`widgetSettings.${widgetType}.${leaf}`, {
    defaultValue: MISSING,
  });
  if (scoped !== MISSING) return scoped;
  const common = t(`widgetSettings.common.${leaf}`, { defaultValue: MISSING });
  return common === MISSING ? leaf : common;
}
