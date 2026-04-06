export const getFontClass = (fontFamily: string, globalFont: string) => {
  if (fontFamily === 'global') return `font-${globalFont}`;
  if (fontFamily.startsWith('font-')) return fontFamily;
  return `font-${fontFamily}`;
};

/** Converts a hex color + alpha into an rgba() CSS string. */
export const hexToRgba = (hex: string | undefined, alpha: number): string => {
  const clean = (hex ?? '#ffffff').replace('#', '');
  const a =
    typeof alpha === 'number' && !isNaN(alpha)
      ? Math.max(0, Math.min(1, alpha))
      : 1;

  let r, g, b;
  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else {
    return `rgba(255, 255, 255, ${a})`;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(255, 255, 255, ${a})`;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};
