import React from 'react';
import type { CustomRenderCtx } from '@/components/settings/schema/types';
import { resolveLabel } from '@/components/settings/renderer/resolveLabel';
import { toLunchCountSchoolSite } from '@/config/buildings';
import { GRADE_OPTIONS_BY_SITE, SCHOOL_SITE_OPTIONS } from './gradeOptions';
import type { LunchCountSchoolSite } from './gradeOptions';

// schema-gap: selectWithDependentReset — changing the site must also reset
// gradeLevel (when it's invalid for the new site) and clear the cached menu,
// exactly like the legacy handleSiteChange. A plain Select field only writes
// its own key and can't express that side effect.
const SchoolSiteControlImpl: React.FC<CustomRenderCtx> = ({
  config,
  widget,
  updateConfig,
  t,
  id,
  labelId,
  describedBy,
}) => {
  const rawSite =
    typeof config.schoolSite === 'string' ? config.schoolSite : '';
  const site: LunchCountSchoolSite =
    toLunchCountSchoolSite(rawSite) ?? 'schumann-elementary';
  const gradeLevel =
    typeof config.gradeLevel === 'string' ? config.gradeLevel : '';

  return (
    <select
      id={id}
      value={site}
      aria-labelledby={labelId}
      aria-describedby={describedBy}
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
          {resolveLabel(t, widget.type, opt.label)}
        </option>
      ))}
    </select>
  );
};

export const SchoolSiteControl = React.memo(SchoolSiteControlImpl);
SchoolSiteControl.displayName = 'SchoolSiteControl';
