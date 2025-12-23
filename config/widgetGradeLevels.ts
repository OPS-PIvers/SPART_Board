import { WidgetType, GradeLevel } from '../types';

/**
 * WIDGET GRADE LEVEL CONFIGURATION
 *
 * This file defines which grade levels each widget is intended for.
 * Teachers will be able to filter widgets by grade level in the sidebar.
 *
 * Grade Levels:
 * - 'k-5': Elementary school (Kindergarten through 5th grade)
 * - '6-12': Middle and high school (6th through 12th grade)
 * - 'k-12': All grades (universal)
 *
 * Instructions:
 * - To change a widget's grade levels, simply edit the array for that widget
 * - A widget can have multiple grade levels: ['k-5', '6-12'] means it shows in both filters
 * - Use ['k-12'] for widgets appropriate for all grades
 *
 * Example:
 *   timer: ['k-12'],              // Shows in all grade filters (universal)
 *   dice: ['k-5'],                // Shows only in K-5 filter
 *   poll: ['6-12'],               // Shows only in 6-12 filter
 *   exampleWidget: ['k-5', '6-12'], // Shows in both K-5 and 6-12 filters
 */
export const WIDGET_GRADE_LEVELS: Record<WidgetType, GradeLevel[]> = {
  // Clock & Time Tools
  clock: ['k-12'],
  timer: ['k-12'],
  stopwatch: ['k-12'],

  // Classroom Management
  traffic: ['k-5'],
  workSymbols: ['k-5'],
  sound: ['k-12'],

  // Content & Communication
  text: ['k-12'],
  checklist: ['k-12'],
  qr: ['6-12'],

  // Random & Fun
  random: ['k-12'],
  dice: ['k-5'],

  // Creative Tools
  drawing: ['k-5'],
  webcam: ['k-12'],

  // Academic Tools
  poll: ['6-12'],
  scoreboard: ['k-12'],
  embed: ['6-12'],

  // Planning & Organization
  schedule: ['k-12'],
  calendar: ['k-12'],
  weather: ['k-12'],
  lunchCount: ['k-5'],
};

/**
 * Helper function to get grade levels for a specific widget type
 */
export function getWidgetGradeLevels(widgetType: WidgetType): GradeLevel[] {
  return WIDGET_GRADE_LEVELS[widgetType] || ['k-12'];
}

/**
 * Helper function to check if a widget matches a grade level filter
 *
 * Filter behavior:
 * - 'all': Shows all widgets
 * - 'k-5': Shows widgets tagged with 'k-5' or 'k-12' (universal)
 * - '6-12': Shows widgets tagged with '6-12' or 'k-12' (universal)
 * - 'k-12': Shows only universal widgets tagged with 'k-12'
 */
export function widgetMatchesGradeFilter(
  widgetType: WidgetType,
  filter: GradeLevel | 'all'
): boolean {
  if (filter === 'all') return true;

  const levels = getWidgetGradeLevels(widgetType);

  // Universal widgets (k-12) appear in any filter
  if (levels.includes('k-12')) return true;

  // For other filters: check for direct match
  return levels.includes(filter);
}
