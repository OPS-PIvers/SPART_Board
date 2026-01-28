import JSZip from 'jszip';

export interface ParsedNotebook {
  title: string;
  pages: { blob: Blob; extension: string }[];
}

export const parseNotebookFile = async (
  file: File
): Promise<ParsedNotebook> => {
  const zip = new JSZip();
  await zip.loadAsync(file);

  // Collect potential page files
  const pageFiles: { name: string; obj: JSZip.JSZipObject }[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      // Look for files like 'page0.png', 'images/page001.png', 'page0.svg'
      if (
        relativePath.match(/page\d+\.(png|svg)$/i) ||
        relativePath.match(/preview\d*\.(png)$/i)
      ) {
        pageFiles.push({ name: relativePath, obj: zipEntry });
      }
    }
  });

  // Filter and prioritize
  const pngs = pageFiles.filter((f) => f.name.endsWith('.png'));
  const svgs = pageFiles.filter((f) => f.name.endsWith('.svg'));

  // Prefer PNGs if available as they are pre-rendered
  // If PNGs are found, filter out thumbnails (often named differently or small)
  // But generally 'page*.png' is good.
  const targetFiles = pngs.length > 0 ? pngs : svgs;

  // Filter out likely thumbnails if we have many files (e.g. thumb_page1.png vs page1.png)
  // For now, simple sort.

  // Sort numerically based on the number in the filename
  targetFiles.sort((a, b) => {
    const numA = parseInt(a.name.match(/(\d+)/)?.[0] ?? '0');
    const numB = parseInt(b.name.match(/(\d+)/)?.[0] ?? '0');
    return numA - numB;
  });

  // Deduplicate: if multiple files map to same page number (unlikely with this logic unless folder structure duplicates), keep one.
  // Actually, usually it's just one set.

  if (targetFiles.length === 0) {
    // Fallback: Check for generic 'preview.png'
    const preview = zip.file('preview.png') ?? zip.file('thumbnail.png');
    if (preview) {
      const blob = await preview.async('blob');
      return {
        title: file.name,
        pages: [{ blob, extension: 'png' }],
      };
    }
    throw new Error('No valid pages found in Notebook file.');
  }

  const pageData = await Promise.all(
    targetFiles.map(async (entry) => {
      const blob = await entry.obj.async('blob');
      const extension = entry.name.toLowerCase().endsWith('.svg')
        ? 'svg'
        : 'png';
      return { blob, extension };
    })
  );

  return {
    title: file.name,
    pages: pageData,
  };
};
