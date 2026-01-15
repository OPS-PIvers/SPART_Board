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
