import type { AppearanceKey, Field } from './types';

/**
 * Content-tier Style fields (D18): one shared field per appearance key the
 * generic tier can render. A schema's `styleKeys` selects from this map.
 * `layout` is deliberately absent — its options are per-widget, so it stays a
 * schema field in the widget's own `display` group.
 */
export const UNIVERSAL_STYLE_FIELDS: Partial<Record<AppearanceKey, Field>> = {
  fontFamily: {
    type: 'fontFamily',
    key: 'fontFamily',
    label: 'style.fontFamily',
  },
  fontColor: { type: 'color', key: 'fontColor', label: 'style.fontColor' },
  cardColor: {
    type: 'surfaceColor',
    key: 'cardColor',
    label: 'style.cardColor',
    opacityKey: 'cardOpacity',
  },
  cardOpacity: {
    type: 'slider',
    key: 'cardOpacity',
    label: 'style.cardOpacity',
    min: 0,
    max: 1,
    step: 0.05,
  },
  textSizePreset: {
    type: 'textSizePreset',
    key: 'textSizePreset',
    label: 'style.textSizePreset',
  },
  bgColor: { type: 'color', key: 'bgColor', label: 'style.bgColor' },
  fontSize: {
    type: 'number',
    key: 'fontSize',
    label: 'style.fontSize',
    min: 8,
    max: 200,
    step: 1,
  },
  textColor: { type: 'color', key: 'textColor', label: 'style.textColor' },
  titleColor: { type: 'color', key: 'titleColor', label: 'style.titleColor' },
  scaleMultiplier: {
    type: 'slider',
    key: 'scaleMultiplier',
    label: 'style.scaleMultiplier',
    min: 0.5,
    max: 2,
    step: 0.1,
  },
};

/** Resolves a schema's `styleKeys` to the Content-tier fields the drawer renders. */
export function resolveStyleFields(
  styleKeys: ReadonlyArray<AppearanceKey> | undefined
): Field[] {
  return (styleKeys ?? [])
    .map((key) => UNIVERSAL_STYLE_FIELDS[key])
    .filter((field): field is Field => field !== undefined);
}
