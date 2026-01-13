import { useState, useCallback } from 'react';
import { toPng } from 'html-to-image';

interface UseScreenshotResult {
  takeScreenshot: () => Promise<void>;
  isFlashing: boolean;
  isCapturing: boolean;
}

interface ScreenshotOptions {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

export const useScreenshot = (
  nodeOrRef: React.RefObject<HTMLElement | null> | HTMLElement | null,
  fileName: string,
  options: ScreenshotOptions = {}
): UseScreenshotResult => {
  const [isFlashing, setIsFlashing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const { onSuccess, onError } = options;

  const takeScreenshot = useCallback(async () => {
    const node =
      nodeOrRef && 'current' in nodeOrRef ? nodeOrRef.current : nodeOrRef;

    if (!node) return;

    try {
      setIsCapturing(true);

      // Trigger Flash Animation
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 300); // Flash duration matches CSS duration-300

      // Allow a brief delay so React can process the flash state change before capture starts.
      // The flash overlay is also excluded via the filter below as a secondary safeguard.
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Generate Image
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2, // Higher quality
        filter: (node: Element) => {
          if (!(node instanceof HTMLElement)) {
            return true;
          }

          // Exclude the flash overlay and anything marked for exclusion
          const dataset = node.dataset;
          const shouldExclude =
            dataset.screenshot === 'flash' ||
            dataset.screenshot === 'exclude' ||
            node.classList.contains('isFlashing');

          return !shouldExclude;
        },
      });

      // Download logic
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
      onSuccess?.();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Screenshot failed:', error);
      onError?.(error);
    } finally {
      setIsCapturing(false);
    }
  }, [nodeOrRef, fileName, onSuccess, onError]);

  return { takeScreenshot, isFlashing, isCapturing };
};
