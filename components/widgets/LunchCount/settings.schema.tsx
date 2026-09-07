import type {
  CustomField,
  FieldCtx,
  SegmentedField,
} from '@/components/settings/schema/types';
import { defineSettings } from '@/components/settings/schema/defineSettings';
import type { LunchCountConfig } from '@/types';
import { toLunchCountSchoolSite } from '@/config/buildings';
import { SchoolSiteControl } from './schema/SchoolSiteControl';
import { LunchTimeControl } from './schema/LunchTimeControl';
import { CustomRosterField } from './schema/CustomRosterField';
import { GRADE_OPTIONS_BY_SITE } from './schema/gradeOptions';
import type { LunchCountSchoolSite } from './schema/gradeOptions';

const renderSchoolSite: CustomField<'schoolSite'>['render'] = (ctx) => (
  <SchoolSiteControl {...ctx} />
);

const renderLunchTime: CustomField<'lunchTimeHour'>['render'] = (ctx) => (
  <LunchTimeControl {...ctx} />
);

const renderRoster: CustomField<'roster'>['render'] = (ctx) => (
  <CustomRosterField {...ctx} />
);

const resolvedSite = (ctx: FieldCtx): LunchCountSchoolSite =>
  toLunchCountSchoolSite(
    typeof ctx.config.schoolSite === 'string' ? ctx.config.schoolSite : ''
  ) ?? 'schumann-elementary';

// One segmented control per site (rather than a single dependent Custom
// field): validateSchema doesn't reject a repeated field key, and only one of
// these is ever visible at a time, so they never collide in the rendered
// list or the Tab order.
const gradeLevelFields: SegmentedField<'gradeLevel'>[] = (
  Object.keys(GRADE_OPTIONS_BY_SITE) as LunchCountSchoolSite[]
).map((site) => ({
  key: 'gradeLevel',
  type: 'segmented',
  label: 'gradeLevel',
  visibleWhen: (ctx) => resolvedSite(ctx) === site,
  options: GRADE_OPTIONS_BY_SITE[site],
}));

const isManualMode = (ctx: FieldCtx) => ctx.config.isManualMode === true;
const isCustomRoster = (ctx: FieldCtx) => ctx.config.rosterMode === 'custom';

const schema = defineSettings<LunchCountConfig>({
  groups: [
    {
      id: 'content',
      fields: [
        {
          key: 'schoolSite',
          type: 'custom',
          label: 'schoolSite',
          render: renderSchoolSite,
        },
        {
          key: 'lunchTimeHour',
          type: 'custom',
          label: 'lunchTime',
          render: renderLunchTime,
        },
        ...gradeLevelFields,
        {
          key: 'manualHotLunch',
          type: 'text',
          label: 'manualHotLunch',
          visibleWhen: isManualMode,
        },
        {
          key: 'manualBentoBox',
          type: 'text',
          label: 'manualBentoBox',
          visibleWhen: isManualMode,
        },
        {
          key: 'roster',
          type: 'custom',
          label: 'roster',
          visibleWhen: isCustomRoster,
          render: renderRoster,
        },
      ],
    },
    {
      id: 'behavior',
      fields: [
        { key: 'rosterMode', type: 'rosterPicker', label: 'rosterMode' },
        { key: 'isManualMode', type: 'toggle', label: 'isManualMode' },
      ],
    },
  ],
  styleKeys: ['cardColor'],
});

export default schema;
