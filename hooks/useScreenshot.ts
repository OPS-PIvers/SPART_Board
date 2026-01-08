import { useState, useCallback } from 'react';
import { toPng } from 'html-to-image';

interface UseScreenshotResult {
  takeScreenshot: () => Promise<void>;
  isFlashing: boolean;
  isCapturing: boolean;
}

export const useScreenshot = (
  nodeRef: React.RefObject<HTMLElement | null>,
  fileName: string
): UseScreenshotResult => {
  const [isFlashing, setIsFlashing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const takeScreenshot = useCallback(async () => {
    if (!nodeRef.current) return;

    try {
      setIsCapturing(true);

      // Trigger Flash Animation
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 150); // Flash duration

      // Generate Image
      // We use a slight delay to ensure the flash overlay isn't captured if it renders synchronously,
      // though typically we want the flash visual to happen *after* the data capture in a real camera.
      // However, for web, we capture *before* the flash blocks the view, or we exclude the flash element.
      // html-to-image has a filter option we can use to exclude the flash div if needed.
      const dataUrl = await toPng(nodeRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Higher quality
        filter: (node) => {
          // Exclude the flash overlay from the screenshot itself
          return !(
            node instanceof HTMLElement && node.dataset.screenshot === 'flash'
          );
        },
      });

      // Download logic
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Screenshot failed:', err);
      alert('Failed to capture widget. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [nodeRef, fileName]);

  return { takeScreenshot, isFlashing, isCapturing };
};
