import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import en from '@/locales/en.json';
import { GROUP_ORDER } from '../schema/types';

const HERE = dirname(fileURLToPath(import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!/\.tsx?$/.test(entry.name) || entry.name.includes('.test.')) return [];
    return [path];
  });
}

/** Leaves the renderer resolves from string literals rather than from a schema. */
function hardcodedLeaves(): string[] {
  const literal = /resolveLabel\(\s*ctx\.t,\s*[^,]+,\s*'([^']+)'/g;
  const fallback = /\?\?\s*'([A-Za-z][\w.]*)'\s*\)/g;
  const leaves = new Set<string>(GROUP_ORDER.map((id) => `group.${id}`));
  for (const file of sourceFiles(HERE)) {
    const text = readFileSync(file, 'utf-8');
    for (const match of text.matchAll(literal)) leaves.add(match[1]);
    if (file.endsWith('List.tsx')) {
      for (const match of text.matchAll(fallback)) leaves.add(match[1]);
    }
  }
  return [...leaves];
}

const common = (en as { widgetSettings: { common: Record<string, unknown> } })
  .widgetSettings.common;

function lookup(leaf: string): unknown {
  return leaf
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object'
          ? (node as Record<string, unknown>)[part]
          : undefined,
      common
    );
}

describe('widgetSettings.common leaves', () => {
  const leaves = hardcodedLeaves();

  it('finds the renderer leaves to check', () => {
    expect(leaves).toEqual(
      expect.arrayContaining([
        'reset',
        'addRow',
        'removeRow',
        'reorderRow',
        'group.content',
      ])
    );
  });

  it.each(leaves)('en.json defines widgetSettings.common.%s', (leaf) => {
    expect(typeof lookup(leaf)).toBe('string');
  });
});
