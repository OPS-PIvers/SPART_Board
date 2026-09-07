import React from 'react';
import type {
  FieldCtx,
  UpdateConfig,
} from '@/components/settings/schema/types';
import { resolveLabel } from '@/components/settings/renderer/resolveLabel';
import { toLunchCountSchoolSite } from '@/config/buildings';
import { GRADE_OPTIONS_BY_SITE, SCHOOL_SITE_OPTIONS } from './gradeOptions';
import type { LunchCountSchoolSite } from './gradeOptions';

type Props = FieldCtx & { updateConfig: UpdateConfig };

// schema-gap: selectWithDependentReset — changing the site must also reset
// gradeLevel (when it's invalid for the new site) and clear the cached menu,
// exactly like the legacy handleSiteChange. A plain Select field only writes
// its own key and can't express that side effect.
const SchoolSiteControlImpl: React.FC<Props> = ({
  config,
  widget,
  updateConfig,
  t,
}) => {
  const label = resolveLabel(t, widget.type, 'schoolSite');
  const rawSite =
    typeof config.schoolSite === 'string' ? config.schoolSite : '';
  const site: LunchCountSchoolSite =
    toLunchCountSchoolSite(rawSite) ?? 'schumann-elementary';
  const gradeLevel =
    typeof config.gradeLevel === 'string' ? config.gradeLevel : '';

  return (
    <select
      value={site}
      aria-label={label}
      onChange={(e) => {
        const newSite = e.target.value as LunchCountSchoolSite;
        const validGrades = GRADE_OPTIONS_BY_SITE[newSite].map((g) => g.value);
        updateConfig({
          schoolSite: newSite,
          cachedMenu: null,
          gradeLevel: validGrades.includes(gradeLevel) ? gradeLevel : '',
        });
      }}
      className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {SCHOOL_SITE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export const SchoolSiteControl = React.memo(SchoolSiteControlImpl);
SchoolSiteControl.displayName = 'SchoolSiteControl';
