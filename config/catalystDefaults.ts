import { CatalystCategory } from '../types';

export const DEFAULT_CATALYST_CATEGORIES: CatalystCategory[] = [
  {
    id: 'Get Attention',
    label: 'Attention',
    icon: 'LayoutGrid',
    color: 'bg-red-500',
  },
  { id: 'Engage', label: 'Engage', icon: 'Brain', color: 'bg-amber-500' },
  {
    id: 'Set Up',
    label: 'Set Up',
    icon: 'Settings2',
    color: 'bg-emerald-500',
  },
  {
    id: 'Support',
    label: 'Support',
    icon: 'HelpCircle',
    color: 'bg-blue-500',
  },
];
