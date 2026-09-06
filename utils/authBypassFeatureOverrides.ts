import type { GlobalFeature } from '@/types';

export type FeatureOverrideMap = Partial<Record<GlobalFeature, boolean>>;

const LOCAL_STORAGE_KEY = 'authBypassFeatureOverrides';

// Malformed input (bad JSON, non-object, non-boolean values) yields no
// overrides rather than throwing — this only runs in auth-bypass/test mode.
function parseOverrideMap(raw: string | null | undefined): FeatureOverrideMap {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    const result: FeatureOverrideMap = {};
    for (const [key, value] of Object.entries(
      parsed as Record<string, unknown>
    )) {
      if (typeof value === 'boolean') {
        result[key as GlobalFeature] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

// Build-time defaults from VITE_AUTH_BYPASS_FEATURE_OVERRIDES, merged under
// the runtime localStorage overrides (localStorage wins).
export function getBuildTimeFeatureOverrides(
  envValue: string | undefined
): FeatureOverrideMap {
  return parseOverrideMap(envValue);
}

export function getRuntimeFeatureOverrides(
  storage: Pick<Storage, 'getItem'> | undefined
): FeatureOverrideMap {
  if (!storage) return {};
  try {
    return parseOverrideMap(storage.getItem(LOCAL_STORAGE_KEY));
  } catch {
    return {};
  }
}

export function resolveAuthBypassFeatureOverride(
  featureId: GlobalFeature,
  envValue: string | undefined,
  storage: Pick<Storage, 'getItem'> | undefined
): boolean | undefined {
  const buildTime = getBuildTimeFeatureOverrides(envValue);
  const runtime = getRuntimeFeatureOverrides(storage);
  const merged: FeatureOverrideMap = { ...buildTime, ...runtime };
  return merged[featureId];
}
