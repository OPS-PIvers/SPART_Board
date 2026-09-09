// Client wrappers for the read-aloud callables (docs/plans/QUIZ_READ_ALOUD.md §4).
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { functions, storage } from '@/config/firebase';
import type { QuizReadAloudPart, QuizReadAloudTiming } from '@/types';

export type SynthesizeQuizAudioRequest =
  | {
      mode: 'student';
      sessionId: string;
      questionId: string;
      part: QuizReadAloudPart;
    }
  | { mode: 'preview'; language: string; voice?: string };

export interface SynthesizeQuizAudioResult {
  path: string;
  mimeType: 'audio/mpeg';
  chars: number;
  cached: boolean;
  parts?: QuizReadAloudTiming[];
  chunks?: string[];
}

export interface PrepareQuizReadAloudResult {
  status: 'preparing' | 'ready' | 'partial' | 'failed';
  parts: number;
  synthesized: number;
  chars: number;
}

/** Manifest key for a part; mirrors `partKey` in functions/src/quizReadAloud.ts. */
export function readAloudPartKey(
  questionId: string,
  part: QuizReadAloudPart
): string {
  switch (part.kind) {
    case 'question':
      return `q:${questionId}:question`;
    case 'choice':
      return `q:${questionId}:choice:${part.index}`;
    case 'matchingLeft':
      return `q:${questionId}:left:${part.index}`;
    case 'matchingRight':
      return `q:${questionId}:right:${part.index}`;
    case 'orderingItem':
      return `q:${questionId}:item:${part.index}`;
    case 'whole':
      return `q:${questionId}:whole`;
    case 'stimulus':
      return `stim:${part.stimulusId}`;
  }
}

export async function synthesizeQuizAudio(
  input: SynthesizeQuizAudioRequest
): Promise<SynthesizeQuizAudioResult> {
  const callable = httpsCallable<
    SynthesizeQuizAudioRequest,
    SynthesizeQuizAudioResult
  >(functions, 'synthesizeQuizAudioV1');
  return (await callable(input)).data;
}

export async function prepareQuizReadAloud(
  sessionId: string
): Promise<PrepareQuizReadAloudResult> {
  const callable = httpsCallable<
    { sessionId: string },
    PrepareQuizReadAloudResult
  >(functions, 'prepareQuizReadAloudV1');
  return (await callable({ sessionId })).data;
}

/** Fire-and-forget prepare after an assign; failures only log (the student fallback covers them). */
export function prepareQuizReadAloudInBackground(sessionId: string): void {
  void prepareQuizReadAloud(sessionId).catch((err: unknown) => {
    console.warn('[quizReadAloud] prepare failed', err);
  });
}

/** R9: manifest paths open through the Storage SDK; no signed URLs. */
export function resolveReadAloudUrl(path: string): Promise<string> {
  return getDownloadURL(storageRef(storage, path));
}
