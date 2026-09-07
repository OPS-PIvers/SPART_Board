import React from 'react';
import { Code, Link2 } from 'lucide-react';
import type {
  FieldCtx,
  UpdateConfig,
} from '@/components/settings/schema/types';
import { resolveLabel } from '@/components/settings/renderer/resolveLabel';
import { useWidgetBuildingId } from '@/hooks/useWidgetBuildingId';
import { useEmbedConfig } from './hooks/useEmbedConfig';
import type { EmbedConfig } from '@/types';

type Props = FieldCtx & { updateConfig: UpdateConfig };

// schema-gap: buildingGatedSegmented — the building's `hideUrlField` global
// config (Firestore, loaded via useEmbedConfig) hides this toggle entirely
// and forces code mode; a pure visibleWhen predicate has no hook access.
const EmbedModeControlImpl: React.FC<Props> = ({
  config,
  widget,
  updateConfig,
  t,
}) => {
  const buildingId = useWidgetBuildingId(widget);
  const { config: globalConfig } = useEmbedConfig(buildingId);
  const hideUrlField = globalConfig?.hideUrlField ?? false;

  if (hideUrlField) return null;

  const mode = (config.mode as EmbedConfig['mode']) ?? 'url';
  const label = (leaf: string) => resolveLabel(t, widget.type, leaf);

  return (
    <div
      role="radiogroup"
      aria-label={label('modeLabel')}
      className="flex bg-slate-100 p-1 rounded-xl"
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'url'}
        onClick={() => updateConfig({ mode: 'url' })}
        className={`flex-1 py-1.5 text-xxs rounded-lg transition-all flex items-center justify-center gap-2 ${
          mode === 'url'
            ? 'bg-white shadow-sm text-indigo-600'
            : 'text-slate-600'
        }`}
      >
        <Link2 className="w-3 h-3" aria-hidden="true" />
        {label('modeUrlOption')}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'code'}
        onClick={() => updateConfig({ mode: 'code' })}
        className={`flex-1 py-1.5 text-xxs rounded-lg transition-all flex items-center justify-center gap-2 ${
          mode === 'code'
            ? 'bg-white shadow-sm text-indigo-600'
            : 'text-slate-600'
        }`}
      >
        <Code className="w-3 h-3" aria-hidden="true" />
        {label('modeCodeOption')}
      </button>
    </div>
  );
};

export const EmbedModeControl = React.memo(EmbedModeControlImpl);
EmbedModeControl.displayName = 'EmbedModeControl';
