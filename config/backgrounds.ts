export const BACKGROUND_COLORS = [
  { id: 'bg-brand-gray-darkest' },
  { id: 'bg-brand-blue-dark' },
  { id: 'bg-emerald-950' },
  { id: 'bg-brand-red-dark' },
  { id: 'bg-brand-gray-lightest' },
  { id: 'bg-white' },
  {
    id: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100',
    label: 'Dot Grid',
  },
];

export const BACKGROUND_GRADIENTS = [
  { id: 'bg-gradient-to-br from-slate-900 to-slate-700', label: 'Slate' },
  {
    id: 'bg-gradient-to-br from-brand-blue-primary to-brand-blue-dark',
    label: 'Brand',
  },
  {
    id: 'bg-gradient-to-br from-emerald-400 to-cyan-500',
    label: 'Tropical',
  },
  { id: 'bg-gradient-to-br from-rose-400 to-orange-400', label: 'Sunset' },
  // Weather-specific gradients (used by Weather Widget Nexus sync)
  {
    id: 'bg-gradient-to-br from-blue-400 via-sky-300 to-blue-200',
    label: 'Sunny',
  },
  {
    id: 'bg-gradient-to-br from-slate-500 via-slate-400 to-slate-300',
    label: 'Cloudy',
  },
  {
    id: 'bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900',
    label: 'Rainy',
  },
  {
    id: 'bg-gradient-to-br from-blue-100 via-white to-blue-50',
    label: 'Snowy',
  },
  {
    id: 'bg-gradient-to-br from-teal-600 via-emerald-500 to-teal-400',
    label: 'Windy',
  },
  {
    id: 'bg-gradient-to-br from-slate-300 via-slate-200 to-slate-100',
    label: 'Default',
  },
];
