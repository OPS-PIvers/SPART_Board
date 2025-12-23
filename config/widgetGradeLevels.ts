import { WidgetType, GradeLevel } from '../types';

/**
 * WIDGET GRADE LEVEL CONFIGURATION
 *
 * This file defines which grade levels each widget is intended for.
 * Teachers will be able to filter widgets by grade level in the sidebar.
 *
 * Grade Levels:
 * - 'k-2': Kindergarten through 2nd grade
 * - '3-5': 3rd through 5th grade
 * - '6-8': 6th through 8th grade (middle school)
 * - '9-12': 9th through 12th grade (high school)
 * - 'universal': Appropriate for all grades
 *
 * Instructions:
 * - To change a widget's grade levels, simply edit the array for that widget
 * - A widget can have multiple grade levels: ['k-2', '3-5'] means it shows in both filters
 * - Each grade level will be displayed as a separate chip in the UI
 * - Use ['universal'] for widgets appropriate for all grades
 *
 * Example:
 *   timer: ['universal'],         // Shows in all grade filters
 *   dice: ['k-2'],                // Shows only in K-2 filter
 *   poll: ['6-8', '9-12'],        // Shows in 6-8 and 9-12 filters
 *   exampleWidget: ['k-2', '3-5'], // Shows in K-2 and 3-5 filters with two separate chips
 */
export const WIDGET_GRADE_LEVELS: Record<WidgetType, GradeLevel[]> = {
  // Clock & Time Tools
  clock: ['universal'],
  timer: ['universal'],
  stopwatch: ['universal'],

  // Classroom Management
  traffic: ['k-2', '3-5'],
  workSymbols: ['k-2', '3-5'],
  sound: ['universal'],

  // Content & Communication
  text: ['universal'],
  checklist: ['universal'],
  qr: ['6-8', '9-12'],

  // Random & Fun
  random: ['universal'],
  dice: ['k-2', '3-5'],

  // Creative Tools
  drawing: ['k-2', '3-5'],
  webcam: ['universal'],

  // Academic Tools
  poll: ['6-8', '9-12'],
  scoreboard: ['universal'],
  embed: ['6-8', '9-12'],

  // Planning & Organization
  schedule: ['universal'],
  calendar: ['universal'],
  weather: ['universal'],
  lunchCount: ['k-2', '3-5'],
};

/**
 * Helper function to get grade levels for a specific widget type
 */
export function getWidgetGradeLevels(widgetType: WidgetType): GradeLevel[] {
  return WIDGET_GRADE_LEVELS[widgetType] || ['universal'];
}

/**
 * Helper function to check if a widget matches a grade level filter
 *
 * Filter behavior:
 * - 'all': Shows all widgets
 * - 'k-2': Shows widgets tagged with 'k-2' or 'universal'
 * - '3-5': Shows widgets tagged with '3-5' or 'universal'
 * - '6-8': Shows widgets tagged with '6-8' or 'universal'
 * - '9-12': Shows widgets tagged with '9-12' or 'universal'
 * - 'universal': Shows only widgets tagged with 'universal'
 */
export function widgetMatchesGradeFilter(
  widgetType: WidgetType,
  filter: GradeLevel | 'all'
): boolean {
  if (filter === 'all') return true;

  const levels = getWidgetGradeLevels(widgetType);

  // Universal widgets appear in any filter
  if (levels.includes('universal')) return true;

  // For other filters: check for direct match
  return levels.includes(filter);
}
