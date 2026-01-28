import JSZip from 'jszip';

export interface ParsedNotebook {
  title: string;
  pages: { blob: Blob; extension: string }[];
  assets: { blob: Blob; extension: string }[];
}

export const parseNotebookFile = async (
  file: File
): Promise<ParsedNotebook> => {
  const zip = new JSZip();
  await zip.loadAsync(file);

  // Collect potential page files
  const pageFiles: { name: string; obj: JSZip.JSZipObject }[] = [];
  const assetFiles: { name: string; obj: JSZip.JSZipObject }[] = [];

  zip.forEach((relativePath: string, zipEntry: JSZip.JSZipObject) => {
    if (!zipEntry.dir) {
      // Look for files like 'page0.png', 'images/page001.png', 'page0.svg'
      if (
        relativePath.match(/page\d+\.(png|svg)$/i) ||
        relativePath.match(/preview\d*\.(png)$/i)
      ) {
        pageFiles.push({ name: relativePath, obj: zipEntry });
      } else if (
        !relativePath.endsWith('.xml') &&
        !relativePath.match(/thumbnail/i) &&
        relativePath.match(/\.(png|jpg|jpeg|svg)$/i)
      ) {
        assetFiles.push({ name: relativePath, obj: zipEntry });
      }
    }
  });

  // Filter and prioritize
  const pngs = pageFiles.filter((f) => f.name.toLowerCase().endsWith('.png'));
  const svgs = pageFiles.filter((f) => f.name.toLowerCase().endsWith('.svg'));

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

  const assetData = await Promise.all(
    assetFiles.map(async (entry) => {
      const blob = await entry.obj.async('blob');
      const lower = entry.name.toLowerCase();
      let extension = 'png';
      if (lower.endsWith('.svg')) extension = 'svg';
      else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg'))
        extension = 'jpg';
      return { blob, extension };
    })
  );

  if (targetFiles.length === 0) {
    // Fallback: Check for generic 'preview.png'
    const preview = zip.file('preview.png') ?? zip.file('thumbnail.png');
    if (preview) {
      const blob = await preview.async('blob');
      return {
        title: file.name,
        pages: [{ blob, extension: 'png' }],
        assets: assetData,
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
    assets: assetData,
  };
};
