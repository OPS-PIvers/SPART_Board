import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';
import { WorkerMessage, TrimResult, FloodFillResult } from './imageWorker';

/**
 * Helper to run a task in a web worker
 */
const runInWorker = <T>(message: WorkerMessage): Promise<T> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./imageWorker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e: MessageEvent<T>) => {
      resolve(e.data);
      worker.terminate();
    };

    worker.onerror = (err) => {
      reject(new Error(err.message || 'Worker error'));
      worker.terminate();
    };

    worker.postMessage(message);
  });
};

/**
 * Trims transparent whitespace from an image Data URL.
 * Returns a Promise that resolves to a new Data URL.
 */
export const trimImageWhitespace = (dataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      try {
        // Run heavy scanning in worker
        const result = await runInWorker<TrimResult>({
          type: 'trim',
          imageData: imageData.data,
          width: canvas.width,
          height: canvas.height,
        });

        if (
          !result.found ||
          result.width === undefined ||
          result.height === undefined ||
          result.minX === undefined ||
          result.minY === undefined
        ) {
          resolve(dataUrl);
          return;
        }

        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = result.width;
        trimmedCanvas.height = result.height;
        const trimmedCtx = trimmedCanvas.getContext('2d');
        if (!trimmedCtx) {
          reject(new Error('Could not get trimmed canvas context'));
          return;
        }

        trimmedCtx.drawImage(
          canvas,
          result.minX,
          result.minY,
          result.width,
          result.height,
          0,
          0,
          result.width,
          result.height
        );

        resolve(trimmedCanvas.toDataURL('image/png'));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = dataUrl;
  });
};

/**
 * Removes the background from an image using professional AI-based segmentation.
 * Falls back to flood fill if the library fails or isn't supported.
 */
export const removeBackground = async (dataUrl: string): Promise<string> => {
  try {
    // High-quality background removal using library
    const blob = await imglyRemoveBackground(dataUrl, {
      progress: (key: string, current: number, total: number) => {
        if (current === total) {
          // Final progress log
          console.warn(`Background removal complete: ${key}`);
        }
      },
    });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(
      'Failed to remove background with @imgly/background-removal, falling back to flood fill',
      error
    );
    return removeBackgroundFloodFill(dataUrl);
  }
};

/**
 * Removes the background from an image using flood fill from corners.
 * Assumes the corners represent the background color.
 * (Fallback method)
 */
export const removeBackgroundFloodFill = (
  dataUrl: string,
  tolerance = 20
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      try {
        // Run heavy flood fill in worker
        const result = await runInWorker<FloodFillResult>({
          type: 'floodFill',
          imageData: imageData.data,
          width: canvas.width,
          height: canvas.height,
          tolerance,
        });

        ctx.putImageData(
          new ImageData(
            Uint8ClampedArray.from(result.imageData),
            canvas.width,
            canvas.height
          ),
          0,
          0
        );
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = dataUrl;
  });
};