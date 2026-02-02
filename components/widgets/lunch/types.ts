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

export interface SubmitReportModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback to submit the report data */
  onSubmit: (notes: string, extraPizza?: number) => Promise<void>;
  /** The report data to display and submit */
  data: {
    date: string;
    staffName: string;
    hotLunch: number;
    bentoBox: number;
    hotLunchName: string;
    bentoBoxName: string;
    schoolSite: 'schumann-elementary' | 'orono-intermediate-school';
  };
  /** Whether the report is currently being submitted */
  isSubmitting: boolean;
}
