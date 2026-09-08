import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Static allowlist (§3 item 11): the drawer's surfaces are light, so every
 * slate text token it uses must clear AA on white. `slate-700` is the minimum
 * for headings and body copy; `slate-600` is allowed for help lines and icons.
 */
const ALLOWED_SLATE_TEXT = new Set([
  'text-slate-600',
  'text-slate-700',
  'text-slate-800',
  'text-slate-900',
]);

const FILES = [
  'components/settings/SettingsDrawer.tsx',
  'components/settings/schema/windowStyle.tsx',
];

describe('drawer text tokens clear AA on white', () => {
  it.each(FILES)('%s uses only allowlisted slate text tokens', (file) => {
    const source = readFileSync(file, 'utf-8');
    const used = [...source.matchAll(/text-slate-\d{2,3}/g)].map((m) => m[0]);
    expect(used.length).toBeGreaterThan(0);
    const offenders = [...new Set(used)].filter(
      (token) => !ALLOWED_SLATE_TEXT.has(token)
    );
    expect(offenders).toEqual([]);
  });

  it('uses the drawer tone for section headings, never slate-400/500', () => {
    const source = readFileSync(FILES[0], 'utf-8');
    expect(source).not.toMatch(/text-slate-[45]00/);
  });
});
