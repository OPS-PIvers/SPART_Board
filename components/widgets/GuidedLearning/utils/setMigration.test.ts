import { describe, expect, it } from 'vitest';
import { GuidedLearningSet, GuidedLearningStep } from '@/types';
import { normalizeGuidedLearningSet } from './setMigration';

/**
 * Helper type to simulate legacy/malformed data from Firestore/Drive.
 * Marks typically required fields as optional to test robust normalization.
 */
type LegacyGuidedLearningSetInput = Omit<
  GuidedLearningSet,
  'steps' | 'imageUrls'
> & {
  steps?: GuidedLearningStep[];
  imageUrls?: string[];
  imageUrl?: string;
  imagePath?: string;
};

describe('normalizeGuidedLearningSet', () => {
  const baseSet: GuidedLearningSet = {
    id: 'test-set',
    title: 'Test Set',
    imageUrls: ['url1'],
    imagePaths: ['path1'],
    steps: [
      {
        id: 'step1',
        xPct: 50,
        yPct: 50,
        imageIndex: 0,
        interactionType: 'text-popover',
        showOverlay: 'popover',
      },
    ],
    mode: 'guided',
    createdAt: 123456,
    updatedAt: 123456,
  };

  it('identity: returns same values if already normalized', () => {
    const result = normalizeGuidedLearningSet(baseSet);
    expect(result).toEqual(baseSet);
  });

  it('migration: migrates legacy imageUrl to imageUrls array', () => {
    const legacySet: LegacyGuidedLearningSetInput = {
      ...baseSet,
      imageUrls: [],
      imageUrl: 'legacy-url',
    };

    const result = normalizeGuidedLearningSet(legacySet as GuidedLearningSet);
    expect(result.imageUrls).toEqual(['legacy-url']);
  });

  it('migration: migrates legacy imagePath to imagePaths array', () => {
    const legacySet: LegacyGuidedLearningSetInput = {
      ...baseSet,
      imagePaths: [],
      imagePath: 'legacy-path',
    };

    const result = normalizeGuidedLearningSet(legacySet as GuidedLearningSet);
    expect(result.imagePaths).toEqual(['legacy-path']);
  });

  it('step normalization: clamps imageIndex within bounds', () => {
    const setWithBadIndices: GuidedLearningSet = {
      ...baseSet,
      imageUrls: ['url1', 'url2'], // last index is 1
      steps: [
        {
          ...baseSet.steps[0],
          id: 'too-low',
          imageIndex: -1,
        },
        {
          ...baseSet.steps[0],
          id: 'too-high',
          imageIndex: 5,
        },
      ],
    };

    const result = normalizeGuidedLearningSet(setWithBadIndices);
    expect(result.steps[0].imageIndex).toBe(0);
    expect(result.steps[1].imageIndex).toBe(1);
  });

  it('step normalization: defaults imageIndex to 0 if imageUrls is empty', () => {
    const setWithNoImages: GuidedLearningSet = {
      ...baseSet,
      imageUrls: [],
      steps: [
        {
          ...baseSet.steps[0],
          imageIndex: 5,
        },
      ],
    };

    const result = normalizeGuidedLearningSet(setWithNoImages);
    expect(result.steps[0].imageIndex).toBe(0);
  });

  it('step normalization: defaults showOverlay to "none"', () => {
    // Test missing showOverlay; it is optional in GuidedLearningStep but we ensure a default is applied.
    const setWithMissingOverlay: GuidedLearningSet = {
      ...baseSet,
      steps: [
        {
          id: 'step1',
          xPct: 10,
          yPct: 10,
          imageIndex: 0,
          interactionType: 'text-popover',
        } as GuidedLearningStep,
      ],
    };

    const result = normalizeGuidedLearningSet(setWithMissingOverlay);
    expect(result.steps[0].showOverlay).toBe('none');
  });

  it('handles missing steps by defaulting to empty array', () => {
    const setWithoutSteps: LegacyGuidedLearningSetInput = {
      ...baseSet,
      steps: undefined,
    };

    const result = normalizeGuidedLearningSet(
      setWithoutSteps as GuidedLearningSet
    );
    expect(result.steps).toEqual([]);
  });

  it('handles missing imageUrls by defaulting to empty array', () => {
    const setWithoutImageUrls: LegacyGuidedLearningSetInput = {
      ...baseSet,
      imageUrls: undefined,
    };

    const result = normalizeGuidedLearningSet(
      setWithoutImageUrls as GuidedLearningSet
    );
    expect(result.imageUrls).toEqual([]);
  });
});
