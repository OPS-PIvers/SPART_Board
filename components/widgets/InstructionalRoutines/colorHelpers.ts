/**
 * Helper function to get Tailwind color classes for routine colors.
 * This is needed because Tailwind's JIT compiler cannot detect dynamically
 * constructed class names using template literals.
 */
export const getRoutineColorClasses = (
  color: string
): { bg: string; text: string } => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
    lime: { bg: 'bg-lime-50', text: 'text-lime-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
    sky: { bg: 'bg-sky-50', text: 'text-sky-600' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-600' },
    zinc: { bg: 'bg-zinc-50', text: 'text-zinc-600' },
    stone: { bg: 'bg-stone-50', text: 'text-stone-600' },
    neutral: { bg: 'bg-neutral-50', text: 'text-neutral-600' },
  };

  return colorMap[color] ?? colorMap.blue;
};

/**
 * Helper function to get Tailwind border color classes for routine step colors.
 */
export const getRoutineStepBorderClass = (color: string): string => {
  const borderMap: Record<string, string> = {
    blue: 'border-blue-100',
    indigo: 'border-indigo-100',
    violet: 'border-violet-100',
    purple: 'border-purple-100',
    fuchsia: 'border-fuchsia-100',
    pink: 'border-pink-100',
    rose: 'border-rose-100',
    red: 'border-red-100',
    orange: 'border-orange-100',
    amber: 'border-amber-100',
    yellow: 'border-yellow-100',
    lime: 'border-lime-100',
    green: 'border-green-100',
    emerald: 'border-emerald-100',
    teal: 'border-teal-100',
    cyan: 'border-cyan-100',
    sky: 'border-sky-100',
    slate: 'border-slate-100',
    zinc: 'border-zinc-100',
    stone: 'border-stone-100',
    neutral: 'border-neutral-100',
  };

  return borderMap[color] ?? borderMap.blue;
};
