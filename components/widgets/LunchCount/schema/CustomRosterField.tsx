import React from 'react';
import type { CustomRenderCtx } from '@/components/settings/schema/types';
import { resolveLabel } from '@/components/settings/renderer/resolveLabel';

// schema-gap: linesTextarea — the config holds a string[] (one name per
// line); a plain Textarea field writes the raw string value and would break
// the array shape the front face reads.
const CustomRosterFieldImpl: React.FC<CustomRenderCtx> = ({
  config,
  widget,
  updateConfig,
  t,
  id,
  labelId,
  describedBy,
}) => {
  const roster = Array.isArray(config.roster)
    ? (config.roster as string[])
    : [];
  return (
    <textarea
      id={id}
      value={roster.join('\n')}
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      onChange={(e) =>
        updateConfig({
          roster: e.target.value
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        })
      }
      placeholder={resolveLabel(t, widget.type, 'rosterPlaceholder')}
      rows={8}
      className="w-full p-3 text-xs bg-white border border-slate-200 rounded-2xl outline-none resize-none leading-relaxed"
    />
  );
};

export const CustomRosterField = React.memo(CustomRosterFieldImpl);
CustomRosterField.displayName = 'CustomRosterField';
