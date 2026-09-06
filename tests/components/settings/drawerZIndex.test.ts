import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { Z_INDEX } from '@/config/zIndex';

describe('Z_INDEX.drawer (D19)', () => {
  it('sits above annotation chrome and below every overlay that can open from it', () => {
    expect(Z_INDEX.drawer).toBe(9980);
    expect(Z_INDEX.drawer).toBeGreaterThan(Z_INDEX.annotationChrome);
    expect(Z_INDEX.drawer).toBeLessThan(Z_INDEX.announcementOverlay);
    expect(Z_INDEX.drawer).toBeLessThan(Z_INDEX.maximized);
    expect(Z_INDEX.drawer).toBeLessThan(Z_INDEX.modal);
    expect(Z_INDEX.drawer).toBeLessThan(Z_INDEX.popover);
  });

  it('is exposed as a Tailwind z-index token', () => {
    const config = readFileSync('tailwind.config.js', 'utf-8');
    expect(config).toContain('drawer: Z_INDEX.drawer.toString()');
  });
});
