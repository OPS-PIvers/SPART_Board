// Scaffolds a widget settings schema, en.json stub, schema test and fixture: pnpm run new-widget-settings <type> [--dry-run]
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const REPO_ROOT = join(__dirname, '..');

export function toPascalCase(type: string): string {
  return type
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/** Resolves the `components/widgets/<Widget>` folder for `type` from WidgetRegistry.ts text. */
export function resolveWidgetFolder(
  registryText: string,
  type: string
): string {
  const escaped = type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `^\\s*${escaped}:\\s*lazyNamed\\(\\(\\)\\s*=>\\s*import\\('\\.\\/([^']+)'\\)`,
    'm'
  );
  const match = registryText.match(pattern);
  if (!match) {
    throw new Error(
      `Unknown widget type "${type}": no entry for it in WIDGET_COMPONENTS ` +
        `(components/widgets/WidgetRegistry.ts). Register the widget there first.`
    );
  }
  const importPath = match[1];
  const folder = importPath.split('/')[0];
  return folder;
}

/** Resolves the `*Config` type name declared for `type` in types.ts. */
export function resolveConfigTypeName(
  typesText: string,
  type: string,
  folder: string
): string {
  const pascalType = toPascalCase(type);
  const candidates = [
    `${pascalType}Config`,
    `${pascalType}WidgetConfig`,
    `${folder}Config`,
  ];
  for (const candidate of candidates) {
    const pattern = new RegExp(
      `^export (?:interface|type) ${candidate}\\b`,
      'm'
    );
    if (pattern.test(typesText)) return candidate;
  }
  throw new Error(
    `Could not find a config type for widget type "${type}" in types.ts. ` +
      `Tried: ${candidates.join(', ')}. Define the widget's *Config type in ` +
      `types.ts before scaffolding its settings schema.`
  );
}

export function generateSchemaContent(configTypeName: string): string {
  return `import { defineSettings } from '@/components/settings/schema/defineSettings';
import type { ${configTypeName} } from '@/types';

export default defineSettings<${configTypeName}>({
  groups: [
    {
      id: 'content',
      fields: [],
    },
  ],
});
`;
}

export function generateSchemaTestContent(type: string): string {
  return `import { describe, it, expect } from 'vitest';
import schema from './settings.schema';
import { validateSchema } from '@/components/settings/schema/validateSchema';

describe('${type} settings schema', () => {
  it('passes validateSchema with no errors', () => {
    const result = validateSchema('${type}', schema);
    expect(result.errors).toEqual([]);
  });
});
`;
}

export function generateFixtureContent(type: string): string {
  return `${JSON.stringify({ type, config: {} }, null, 2)}\n`;
}

/** Splits a JSON object body into top-level entries, tracking absolute offsets in `text`. */
type JsonEntry = { key: string; start: number; end: number };

export function listObjectEntries(
  text: string,
  bodyStart: number,
  bodyEnd: number
): JsonEntry[] {
  const entries: JsonEntry[] = [];
  let i = bodyStart;
  while (i < bodyEnd) {
    while (i < bodyEnd && /[\s,]/.test(text[i])) i++;
    if (i >= bodyEnd) break;
    const entryStart = i;
    if (text[i] !== '"') {
      throw new Error(`Unexpected token at offset ${i} while parsing JSON`);
    }
    i++;
    while (text[i] !== '"' || text[i - 1] === '\\') i++;
    const key = text.slice(entryStart + 1, i);
    i++; // closing quote
    while (text[i] !== ':') i++;
    i++;
    while (/\s/.test(text[i])) i++;
    const valueStart = i;
    let depth = 0;
    let inString = false;
    for (; i < bodyEnd; i++) {
      const c = text[i];
      if (inString) {
        if (c === '\\') {
          i++;
          continue;
        }
        if (c === '"') inString = false;
        continue;
      }
      if (c === '"') {
        inString = true;
        continue;
      }
      if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') depth--;
      else if (c === ',' && depth === 0) break;
    }
    // The last entry runs to bodyEnd and swallows trailing whitespace; trim it back.
    let entryEnd = i;
    if (entryEnd === bodyEnd) {
      while (entryEnd > valueStart && /\s/.test(text[entryEnd - 1])) {
        entryEnd--;
      }
    }
    entries.push({ key, start: entryStart, end: entryEnd });
  }
  return entries;
}

/** Finds the `{ ... }` body bounds of the object whose opening brace is at `openBraceIndex`. */
export function findObjectBody(
  text: string,
  openBraceIndex: number
): { bodyStart: number; bodyEnd: number } {
  let depth = 0;
  let inString = false;
  for (let i = openBraceIndex; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === '\\') {
        i++;
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return { bodyStart: openBraceIndex + 1, bodyEnd: i };
    }
  }
  throw new Error('Unterminated JSON object');
}

function detectNewline(text: string): string {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

// Idempotently inserts `"<key>": <valueText>` alphabetically into a JSON object body.
function insertSortedEntry(
  text: string,
  bodyStart: number,
  bodyEnd: number,
  key: string,
  indent: string,
  valueText: string
): { text: string; changed: boolean } {
  const entries = listObjectEntries(text, bodyStart, bodyEnd);
  const existing = entries.find((e) => e.key === key);
  if (existing) return { text, changed: false };

  const nl = detectNewline(text);
  const next = entries.find((e) => e.key.localeCompare(key) > 0);
  const newLine = `${indent}"${key}": ${valueText}`;

  if (entries.length === 0) {
    const inserted = `${nl}${newLine}${nl}${indent.slice(0, -2)}`;
    return {
      text: text.slice(0, bodyStart) + inserted + text.slice(bodyEnd),
      changed: true,
    };
  }

  if (next) {
    // A non-last entry's `end` is its trailing comma; insert just after it to keep `next` indentation.
    const nextIdx = entries.indexOf(next);
    const insertAt = nextIdx > 0 ? entries[nextIdx - 1].end + 1 : bodyStart;
    const inserted = `${nl}${newLine},`;
    return {
      text: text.slice(0, insertAt) + inserted + text.slice(insertAt),
      changed: true,
    };
  }

  const last = entries[entries.length - 1];
  const inserted = `,${nl}${newLine}`;
  return {
    text: text.slice(0, last.end) + inserted + text.slice(last.end),
    changed: true,
  };
}

/** Idempotently inserts the `widgetSettings.<type>` stub namespace into an en.json string. */
export function insertLocaleStub(
  text: string,
  type: string
): { text: string; changed: boolean } {
  const topMatch = text.match(/(^|\n)(\s*)"widgetSettings":\s*\{/);
  if (topMatch) {
    const openBraceIndex = (topMatch.index ?? 0) + topMatch[0].length - 1;
    const { bodyStart, bodyEnd } = findObjectBody(text, openBraceIndex);
    const indent = `${topMatch[2]}  `;
    return insertSortedEntry(text, bodyStart, bodyEnd, type, indent, '{}');
  }

  // No widgetSettings namespace yet: insert it as a new top-level key.
  const rootOpen = text.indexOf('{');
  const { bodyStart, bodyEnd } = findObjectBody(text, rootOpen);
  const value = `{\n    "${type}": {}\n  }`;
  const result = insertSortedEntry(
    text,
    bodyStart,
    bodyEnd,
    'widgetSettings',
    '  ',
    value
  );
  return { ...result, changed: true };
}

export type ScaffoldPlan = {
  type: string;
  folder: string;
  configTypeName: string;
  schemaPath: string;
  schemaTestPath: string;
  fixturePath: string;
  schemaContent: string;
  schemaTestContent: string;
  fixtureContent: string;
};

export function buildPlan(repoRoot: string, type: string): ScaffoldPlan {
  const registryText = readFileSync(
    join(repoRoot, 'components/widgets/WidgetRegistry.ts'),
    'utf-8'
  );
  const folder = resolveWidgetFolder(registryText, type);
  const typesText = readFileSync(join(repoRoot, 'types.ts'), 'utf-8');
  const configTypeName = resolveConfigTypeName(typesText, type, folder);

  const widgetDir = join(repoRoot, 'components/widgets', folder);
  return {
    type,
    folder,
    configTypeName,
    schemaPath: join(widgetDir, 'settings.schema.ts'),
    schemaTestPath: join(widgetDir, 'settings.schema.test.ts'),
    fixturePath: join(repoRoot, 'tests/fixtures/widgetConfigs', `${type}.json`),
    schemaContent: generateSchemaContent(configTypeName),
    schemaTestContent: generateSchemaTestContent(type),
    fixtureContent: generateFixtureContent(type),
  };
}

function writeFileIfAbsent(path: string, content: string, dryRun: boolean) {
  if (existsSync(path)) {
    console.log(`skip (exists): ${path}`);
    return;
  }
  if (dryRun) {
    console.log(`would create: ${path}`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf-8');
  console.log(`created: ${path}`);
}

function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const type = args.find((a) => !a.startsWith('--'));
  if (!type) {
    console.error('Usage: pnpm run new-widget-settings <type> [--dry-run]');
    process.exit(1);
  }

  let plan: ScaffoldPlan;
  try {
    plan = buildPlan(REPO_ROOT, type);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
    return;
  }

  writeFileIfAbsent(plan.schemaPath, plan.schemaContent, dryRun);
  writeFileIfAbsent(plan.schemaTestPath, plan.schemaTestContent, dryRun);
  writeFileIfAbsent(plan.fixturePath, plan.fixtureContent, dryRun);

  const enJsonPath = join(REPO_ROOT, 'locales/en.json');
  const enJsonText = readFileSync(enJsonPath, 'utf-8');
  const { text: updatedEnJson, changed } = insertLocaleStub(enJsonText, type);
  if (!changed) {
    console.log(`skip (exists): widgetSettings.${type} in ${enJsonPath}`);
  } else if (dryRun) {
    console.log(`would update: ${enJsonPath} (widgetSettings.${type})`);
  } else {
    writeFileSync(enJsonPath, updatedEnJson, 'utf-8');
    console.log(`updated: ${enJsonPath} (widgetSettings.${type})`);
  }
}

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) run();
