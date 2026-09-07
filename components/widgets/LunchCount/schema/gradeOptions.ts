import type { LunchCountConfig } from '@/types';

export type LunchCountSchoolSite = LunchCountConfig['schoolSite'];

// District-specific option data (site names + grade codes). Labels are
// widgetSettings.lunchCount leaves, not literal English — Segmented/Select
// resolve `option.label` through i18n per render, and validateSchema warns
// on a literal-looking (space/uppercase) option label that doesn't resolve.
export const SCHOOL_SITE_OPTIONS: {
  value: LunchCountSchoolSite;
  label: string;
}[] = [
  { value: 'schumann-elementary', label: 'siteSchumann' },
  { value: 'orono-intermediate-school', label: 'siteIntermediate' },
  { value: 'orono-middle-school', label: 'siteMiddle' },
  { value: 'orono-high-school', label: 'siteHigh' },
];

export const GRADE_OPTIONS_BY_SITE: Record<
  LunchCountSchoolSite,
  { value: string; label: string }[]
> = {
  'schumann-elementary': [
    { value: 'K', label: 'gradeK' },
    { value: '1', label: 'grade1' },
    { value: '2', label: 'grade2' },
    { value: 'MAC', label: 'gradeMac' },
  ],
  'orono-intermediate-school': [
    { value: '3', label: 'grade3' },
    { value: '4', label: 'grade4' },
    { value: '5', label: 'grade5' },
  ],
  'orono-middle-school': [
    { value: '6', label: 'grade6' },
    { value: '7', label: 'grade7' },
    { value: '8', label: 'grade8' },
  ],
  'orono-high-school': [
    { value: '9', label: 'grade9' },
    { value: '10', label: 'grade10' },
    { value: '11', label: 'grade11' },
    { value: '12', label: 'grade12' },
  ],
};
