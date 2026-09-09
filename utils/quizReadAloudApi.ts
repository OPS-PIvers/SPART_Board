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

export interface ExtractStimulusTextResult {
  text: string;
  source: 'pdf-text' | 'ocr' | 'needs-manual';
}

/** Teacher-only authoring call (plan §4.2); the server picks text layer vs OCR. */
export async function extractStimulusReadAloudText(input: {
  stimulusId: string;
  type: 'image' | 'pdf';
  driveFileId?: string;
  url?: string;
}): Promise<ExtractStimulusTextResult> {
  const callable = httpsCallable<typeof input, ExtractStimulusTextResult>(
    functions,
    'extractStimulusReadAloudTextV1'
  );
  return (await callable(input)).data;
}

export const STIMULUS_CHUNK_BYTES = 4500;
const utf8 = new TextEncoder();
const byteLength = (s: string) => utf8.encode(s).length;

/** Client mirror of the server's R4 chunker so the text pane can highlight the chunk being read. */
export function chunkReadAloudText(
  text: string,
  maxBytes = STIMULUS_CHUNK_BYTES
): string[] {
  const clean = text.trim();
  if (!clean) return [];
  const sentences = clean.split(/(?<=[.!?])\s+|\n{2,}/).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  const push = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };
  for (const sentence of sentences) {
    let piece = sentence.trim();
    while (byteLength(piece) > maxBytes) {
      push();
      let cut = piece.length;
      while (cut > 0 && byteLength(piece.slice(0, cut)) > maxBytes)
        cut = Math.floor(cut * 0.9);
      const space = piece.lastIndexOf(' ', cut);
      const at = space > cut / 2 ? space : cut;
      chunks.push(piece.slice(0, at).trim());
      piece = piece.slice(at).trim();
    }
    const candidate = current ? `${current} ${piece}` : piece;
    if (byteLength(candidate) > maxBytes) {
      push();
      current = piece;
    } else {
      current = candidate;
    }
  }
  push();
  return chunks;
}
