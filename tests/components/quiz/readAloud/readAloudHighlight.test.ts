import { describe, it, expect } from 'vitest';
import {
  highlightClass,
  READ_ALOUD_HIGHLIGHT_CLASS,
  sameReadAloudPart,
} from '@/components/quiz/readAloud/readAloudHighlight';
import { readAloudPartKey } from '@/utils/quizReadAloudApi';

describe('readAloudHighlight', () => {
  it('matches parts by kind, index and stimulus id', () => {
    expect(
      sameReadAloudPart(
        { kind: 'choice', index: 1 },
        { kind: 'choice', index: 1 }
      )
    ).toBe(true);
    expect(
      sameReadAloudPart(
        { kind: 'choice', index: 1 },
        { kind: 'choice', index: 2 }
      )
    ).toBe(false);
    expect(
      sameReadAloudPart(
        { kind: 'choice', index: 1 },
        { kind: 'orderingItem', index: 1 }
      )
    ).toBe(false);
    expect(sameReadAloudPart({ kind: 'question' }, { kind: 'question' })).toBe(
      true
    );
    expect(
      sameReadAloudPart(
        { kind: 'stimulus', stimulusId: 'a' },
        { kind: 'stimulus', stimulusId: 'b' }
      )
    ).toBe(false);
    expect(sameReadAloudPart(null, { kind: 'question' })).toBe(false);
  });

  it('returns the ring class only for the highlighted part', () => {
    expect(highlightClass({ kind: 'question' }, { kind: 'question' })).toBe(
      READ_ALOUD_HIGHLIGHT_CLASS
    );
    expect(highlightClass({ kind: 'question' }, { kind: 'whole' })).toBe('');
    expect(highlightClass({ kind: 'question' }, null)).toBe('');
  });

  it('mirrors the server part-key contract', () => {
    expect(readAloudPartKey('q1', { kind: 'question' })).toBe('q:q1:question');
    expect(readAloudPartKey('q1', { kind: 'choice', index: 2 })).toBe(
      'q:q1:choice:2'
    );
    expect(readAloudPartKey('q1', { kind: 'matchingLeft', index: 0 })).toBe(
      'q:q1:left:0'
    );
    expect(readAloudPartKey('q1', { kind: 'matchingRight', index: 3 })).toBe(
      'q:q1:right:3'
    );
    expect(readAloudPartKey('q1', { kind: 'orderingItem', index: 1 })).toBe(
      'q:q1:item:1'
    );
    expect(readAloudPartKey('q1', { kind: 'whole' })).toBe('q:q1:whole');
    expect(readAloudPartKey('q1', { kind: 'stimulus', stimulusId: 's9' })).toBe(
      'stim:s9'
    );
  });
});
