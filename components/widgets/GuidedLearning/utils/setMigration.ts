import { GuidedLearningSet, GuidedLearningStep } from '@/types';

type LegacyGuidedLearningSet = GuidedLearningSet & {
  imageUrl?: string;
  imagePath?: string;
};

export function normalizeGuidedLearningSet(
  input: GuidedLearningSet
): GuidedLearningSet {
  const legacy = input as LegacyGuidedLearningSet;

  const imageUrls =
    input.imageUrls && input.imageUrls.length > 0
      ? input.imageUrls
      : legacy.imageUrl
        ? [legacy.imageUrl]
        : [];

  const imagePaths =
    input.imagePaths && input.imagePaths.length > 0
      ? input.imagePaths
      : legacy.imagePath
        ? [legacy.imagePath]
        : undefined;

  const lastImageIndex = Math.max(imageUrls.length - 1, 0);
  const steps: GuidedLearningStep[] = (input.steps ?? []).map((step) => ({
    ...step,
    imageIndex: Math.min(
      Math.max(step.imageIndex ?? 0, 0),
      imageUrls.length > 0 ? lastImageIndex : 0
    ),
    showOverlay: step.showOverlay ?? 'none',
  }));

  return {
    ...input,
    imageUrls,
    imagePaths,
    steps,
  };
}
