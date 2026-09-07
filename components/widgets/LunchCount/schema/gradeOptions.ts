import type { LunchCountConfig } from '@/types';

export type LunchCountSchoolSite = LunchCountConfig['schoolSite'];

// District-specific option data (site names + grade codes), not app copy — kept literal, not run through i18n.
export const SCHOOL_SITE_OPTIONS: {
  value: LunchCountSchoolSite;
  label: string;
}[] = [
  { value: 'schumann-elementary', label: 'Schumann Elementary' },
  { value: 'orono-intermediate-school', label: 'Orono Intermediate' },
  { value: 'orono-middle-school', label: 'Orono Middle School' },
  { value: 'orono-high-school', label: 'Orono High School' },
];

export const GRADE_OPTIONS_BY_SITE: Record<
  LunchCountSchoolSite,
  { value: string; label: string }[]
> = {
  'schumann-elementary': [
    { value: 'K', label: 'K' },
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: 'MAC', label: 'MAC' },
  ],
  'orono-intermediate-school': [
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
  ],
  'orono-middle-school': [
    { value: '6', label: '6' },
    { value: '7', label: '7' },
    { value: '8', label: '8' },
  ],
  'orono-high-school': [
    { value: '9', label: '9' },
    { value: '10', label: '10' },
    { value: '11', label: '11' },
    { value: '12', label: '12' },
  ],
};
