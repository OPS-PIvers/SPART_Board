/**
 * Utility function to conditionally join CSS class names.
 * Filters out falsy values and joins the remaining class names with spaces.
 *
 * @param classes - Array of class names or conditional expressions
 * @returns A single string of space-separated class names
 *
 * @example
 * cn('base-class', isActive && 'active-class', undefined, 'other-class')
 * // Returns: "base-class active-class other-class" (if isActive is true)
 */
export const cn = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');
