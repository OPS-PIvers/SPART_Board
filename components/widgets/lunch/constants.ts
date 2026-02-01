export type LunchType = 'hot' | 'bento' | 'home';

export interface NutrisliceFood {
  name?: string;
}

export interface NutrisliceMenuItem {
  is_section_title?: boolean;
  section_name?: string;
  food?: NutrisliceFood;
  text?: string;
}

export interface NutrisliceDay {
  date: string;
  menu_items?: NutrisliceMenuItem[];
}

export interface NutrisliceWeek {
  days?: NutrisliceDay[];
}

export const SCHOOL_OPTIONS = [
  { id: 'schumann-elementary', label: 'Schumann Elementary' },
  { id: 'orono-intermediate-school', label: 'Orono Intermediate' },
];

export const DEFAULT_RECIPIENT_EMAIL = 'paul.ivers@orono.k12.mn.us';
