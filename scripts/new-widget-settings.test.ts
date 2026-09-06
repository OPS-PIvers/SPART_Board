import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  toPascalCase,
  resolveWidgetFolder,
  resolveConfigTypeName,
  generateSchemaContent,
  generateSchemaTestContent,
  generateFixtureContent,
  insertLocaleStub,
  buildPlan,
} from './new-widget-settings';

describe('toPascalCase', () => {
  it('capitalizes single words', () => {
    expect(toPascalCase('dice')).toBe('Dice');
  });

  it('capitalizes and joins hyphenated words', () => {
    expect(toPascalCase('time-tool')).toBe('TimeTool');
  });
});

describe('resolveWidgetFolder', () => {
  it('resolves a folder from a slash-qualified import path', () => {
    const registry = `export const WIDGET_COMPONENTS = {\n  url: lazyNamed(() => import('./UrlWidget/Widget'), 'UrlWidget'),\n};`;
    expect(resolveWidgetFolder(registry, 'url')).toBe('UrlWidget');
  });

  it('resolves a folder from a bare import path', () => {
    const registry = `export const WIDGET_COMPONENTS = {\n  dice: lazyNamed(() => import('./DiceWidget'), 'DiceWidget'),\n};`;
    expect(resolveWidgetFolder(registry, 'dice')).toBe('DiceWidget');
  });

  it('throws loudly for an unknown type', () => {
    const registry = `export const WIDGET_COMPONENTS = {\n  dice: lazyNamed(() => import('./DiceWidget'), 'DiceWidget'),\n};`;
    expect(() => resolveWidgetFolder(registry, 'bogus')).toThrow(
      /Unknown widget type/
    );
  });
});

describe('resolveConfigTypeName', () => {
  it('finds a <Pascal>Config match', () => {
    const types = `export interface DiceConfig {\n  sides: number;\n}`;
    expect(resolveConfigTypeName(types, 'dice', 'DiceWidget')).toBe(
      'DiceConfig'
    );
  });

  it('falls back to <Pascal>WidgetConfig', () => {
    const types = `export interface UrlWidgetConfig {\n  url: string;\n}`;
    expect(resolveConfigTypeName(types, 'url', 'UrlWidget')).toBe(
      'UrlWidgetConfig'
    );
  });

  it('throws loudly when no candidate exists', () => {
    const types = `export interface SomethingElse {}`;
    expect(() => resolveConfigTypeName(types, 'dice', 'DiceWidget')).toThrow(
      /Could not find a config type/
    );
  });
});

describe('template generation', () => {
  it('generates a defineSettings schema module', () => {
    const content = generateSchemaContent('DiceConfig');
    expect(content).toContain("import type { DiceConfig } from '@/types';");
    expect(content).toContain('defineSettings<DiceConfig>({');
    expect(content).toContain("id: 'content'");
  });

  it('generates a schema test calling validateSchema', () => {
    const content = generateSchemaTestContent('dice');
    expect(content).toContain("validateSchema('dice', schema)");
  });

  it('generates a migration fixture with type and empty config', () => {
    const content = generateFixtureContent('dice');
    expect(JSON.parse(content)).toEqual({ type: 'dice', config: {} });
  });
});

describe('insertLocaleStub', () => {
  it('creates the widgetSettings namespace when absent', () => {
    const before = '{\n  "common": {\n    "cancel": "Cancel"\n  }\n}\n';
    const { text, changed } = insertLocaleStub(before, 'dice');
    expect(changed).toBe(true);
    expect(JSON.parse(text)).toEqual({
      common: { cancel: 'Cancel' },
      widgetSettings: { dice: {} },
    });
  });

  it('inserts a new type alphabetically among existing siblings', () => {
    const before =
      '{\n  "widgetSettings": {\n    "checklist": {},\n    "weather": {}\n  }\n}\n';
    const { text, changed } = insertLocaleStub(before, 'dice');
    expect(changed).toBe(true);
    const parsed = JSON.parse(text);
    expect(Object.keys(parsed.widgetSettings)).toEqual([
      'checklist',
      'dice',
      'weather',
    ]);
  });

  it('appends after the last sibling when it sorts last', () => {
    const before =
      '{\n  "widgetSettings": {\n    "checklist": {},\n    "dice": {}\n  }\n}\n';
    const { text } = insertLocaleStub(before, 'weather');
    const parsed = JSON.parse(text);
    expect(Object.keys(parsed.widgetSettings)).toEqual([
      'checklist',
      'dice',
      'weather',
    ]);
  });

  it('is idempotent: a second insert of the same type is a no-op', () => {
    const before = '{\n  "widgetSettings": {\n    "dice": {}\n  }\n}\n';
    const { text, changed } = insertLocaleStub(before, 'dice');
    expect(changed).toBe(false);
    expect(text).toBe(before);
  });

  it('leaves unrelated top-level keys byte-identical', () => {
    const before =
      '{\n  "common": {\n    "cancel": "Cancel"\n  },\n  "widgetWindow": {\n    "close": "Close"\n  }\n}\n';
    const { text } = insertLocaleStub(before, 'dice');
    expect(text).toContain('"common": {\n    "cancel": "Cancel"\n  },');
    expect(text).toContain('"widgetWindow": {\n    "close": "Close"\n  }');
    expect(JSON.parse(text)).toEqual({
      common: { cancel: 'Cancel' },
      widgetSettings: { dice: {} },
      widgetWindow: { close: 'Close' },
    });
  });

  it('produces valid JSON when inserting between two top-level keys', () => {
    const before =
      '{\n  "common": {\n    "cancel": "Cancel"\n  },\n  "widgetWindow": {\n    "close": "Close"\n  }\n}\n';
    const { text } = insertLocaleStub(before, 'dice');
    expect(() => JSON.parse(text)).not.toThrow();
  });
});

describe('buildPlan (temp-dir integration of the pure resolvers)', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'new-widget-settings-'));
    writeFileSync(
      join(root, 'types.ts'),
      `export interface DiceConfig {\n  sides: number;\n}\n`
    );
    const registryDir = join(root, 'components/widgets');
    mkdirSync(registryDir, { recursive: true });
    writeFileSync(
      join(registryDir, 'WidgetRegistry.ts'),
      `export const WIDGET_COMPONENTS = {\n  dice: lazyNamed(() => import('./DiceWidget'), 'DiceWidget'),\n};`
    );
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('resolves paths and content for a known widget type', () => {
    const plan = buildPlan(root, 'dice');
    expect(plan.folder).toBe('DiceWidget');
    expect(plan.configTypeName).toBe('DiceConfig');
    expect(plan.schemaPath).toBe(
      join(root, 'components/widgets/DiceWidget/settings.schema.ts')
    );
    expect(plan.fixturePath).toBe(
      join(root, 'tests/fixtures/widgetConfigs/dice.json')
    );
    const written = readFileSync(join(root, 'types.ts'), 'utf-8');
    expect(written).toContain('DiceConfig');
  });
});
