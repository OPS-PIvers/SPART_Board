import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

/**
 * Trims transparent whitespace from an image Data URL.
 * Returns a Promise that resolves to a new Data URL.
 */
export const trimImageWhitespace = (dataUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = 0;
      let maxY = 0;
      let found = false;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            found = true;
          }
        }
      }

      if (!found) {
        // Fully transparent, return original
        resolve(dataUrl);
        return;
      }

      // Add a small padding
      const padding = 2;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);

      const width = maxX - minX;
      const height = maxY - minY;

      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = width;
      trimmedCanvas.height = height;
      const trimmedCtx = trimmedCanvas.getContext('2d');
      if (!trimmedCtx) {
        reject(new Error('Could not get trimmed canvas context'));
        return;
      }

      trimmedCtx.drawImage(
        canvas,
        minX,
        minY,
        width,
        height,
        0,
        0,
        width,
        height
      );

      resolve(trimmedCanvas.toDataURL());
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
    // We use the library for high-quality background removal
    const blob = await imglyRemoveBackground(dataUrl, {
      progress: (key, current, total) => {
        console.warn(`Background removal progress: ${key} ${current}/${total}`);
      },
    });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
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
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      const visited = new Uint8Array(width * height);
      const queue: [number, number][] = [];

      // Start from all four corners
      const corners = [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
      ];

      corners.forEach(([x, y]) => {
        const offset = (y * width + x) * 4;
        const a = data[offset + 3];

        if (a > 0) {
          queue.push([x, y]);
          visited[y * width + x] = 1;
        }
      });

      // Sample color from top-left corner as the reference background color
      const startOffset = 0;
      const bgR = data[startOffset];
      const bgG = data[startOffset + 1];
      const bgB = data[startOffset + 2];

      const matchColor = (offset: number) => {
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const a = data[offset + 3];

        // If transparent, it matches "background" (already removed)
        if (a === 0) return true;

        const diff = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
        return diff <= tolerance * 3;
      };

      while (queue.length > 0) {
        const pos = queue.shift();
        if (!pos) continue;

        const [x, y] = pos;
        const offset = (y * width + x) * 4;

        if (matchColor(offset)) {
          // Set to transparent
          data[offset + 3] = 0;

          // Check neighbors
          const neighbors = [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1],
          ];

          for (const [nx, ny] of neighbors) {
            if (
              nx >= 0 &&
              nx < width &&
              ny >= 0 &&
              ny < height &&
              visited[ny * width + nx] === 0
            ) {
              visited[ny * width + nx] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = dataUrl;
  });
};
