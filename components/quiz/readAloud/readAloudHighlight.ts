// Part identity + the D1 highlight class for the part being read.
import type { QuizReadAloudPart } from '@/types';

export const READ_ALOUD_HIGHLIGHT_CLASS =
  'ring-2 ring-brand-blue-primary/60 bg-brand-blue-lighter/60';

export function sameReadAloudPart(
  a: QuizReadAloudPart | null | undefined,
  b: QuizReadAloudPart | null | undefined
): boolean {
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.kind === 'stimulus' && b.kind === 'stimulus')
    return a.stimulusId === b.stimulusId;
  if ('index' in a && 'index' in b) return a.index === b.index;
  return true;
}

/** Empty string when `part` is not the one being read, else the ring + tint. */
export function highlightClass(
  part: QuizReadAloudPart | null | undefined,
  highlighted: QuizReadAloudPart | null | undefined
): string {
  return sameReadAloudPart(part, highlighted) ? READ_ALOUD_HIGHLIGHT_CLASS : '';
}
