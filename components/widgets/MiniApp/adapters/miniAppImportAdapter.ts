/**
 * MiniApp Import Adapter (Wave 2-MA).
 *
 * Implements `ImportAdapter<MiniAppImportData>` for the shared `ImportWizard`.
 * Preserves the exact JSON-file import format that existed on
 * `MiniAppWidget` before migration (see Widget.tsx pre-migration, handleImport):
 *
 *   - Top level must be a JSON array of objects.
 *   - Each object must have a string `html` field; non-strings are skipped.
 *   - `title` is optional; falsy or non-string titles default to "Untitled App".
 *   - Titles are truncated to 100 characters.
 *   - Items are written in batch to `/users/{uid}/miniapps/` with a freshly
 *     generated id per row and `order: index - total` so the import lands at
 *     the top of the library.
 *
 * Magic Generator (Gemini) deliberately stays inside the editor body; it is
 * NOT surfaced here as `aiAssist`, per the Wave 2-MA brief.
 */

import React from 'react';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { MiniAppItem } from '@/types';
import type {
  ImportAdapter,
  ImportParseResult,
  ImportSourcePayload,
  ImportValidationResult,
} from '@/components/common/library/types';

/** Row shape used internally by the wizard after parsing. */
export interface MiniAppImportRow {
  title: string;
  html: string;
}

/** What the adapter hands the wizard across parse → validate → save. */
export interface MiniAppImportData {
  rows: MiniAppImportRow[];
  /** Rows that were skipped during parse (no string `html`). */
  skipped: number;
}

const MAX_TITLE_LENGTH = 100;

function normalizeRow(raw: unknown): MiniAppImportRow | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (typeof record.html !== 'string') return null;
  const rawTitle =
    typeof record.title === 'string' && record.title ? record.title : '';
  const title = rawTitle ? rawTitle.slice(0, MAX_TITLE_LENGTH) : 'Untitled App';
  return { title, html: record.html };
}

async function readPayloadText(source: ImportSourcePayload): Promise<string> {
  if (source.kind === 'json') return source.text;
  if (source.kind === 'csv') return source.text;
  if (source.kind === 'file') {
    return await source.file.text();
  }
  throw new Error(
    `MiniApp import does not support source kind: ${source.kind}`
  );
}

async function parseMiniAppImport(
  source: ImportSourcePayload
): Promise<ImportParseResult<MiniAppImportData>> {
  const text = await readPayloadText(source);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    throw new Error(
      'The selected file is not valid JSON. Export from SpartBoard to get a compatible file.'
    );
  }

  if (!Array.isArray(parsedJson)) {
    throw new Error(
      'Expected a JSON array of mini-app objects. Export from SpartBoard to get a compatible file.'
    );
  }

  let skipped = 0;
  const rows: MiniAppImportRow[] = [];
  for (const raw of parsedJson) {
    const row = normalizeRow(raw);
    if (row) rows.push(row);
    else skipped++;
  }

  const warnings: string[] = [];
  if (skipped > 0) {
    warnings.push(
      `Skipped ${skipped} ${skipped === 1 ? 'entry' : 'entries'} with missing or invalid HTML.`
    );
  }

  return { data: { rows, skipped }, warnings };
}

function validateMiniAppImport(
  data: MiniAppImportData
): ImportValidationResult {
  if (data.rows.length === 0) {
    return {
      ok: false,
      errors: [
        'No importable apps were found. Each entry needs an `html` string.',
      ],
    };
  }
  return { ok: true, errors: [] };
}

function renderMiniAppPreview(data: MiniAppImportData): React.ReactElement {
  const preview = data.rows.slice(0, 8);
  const remaining = data.rows.length - preview.length;
  return React.createElement(
    'div',
    { className: 'flex flex-col gap-2' },
    React.createElement(
      'p',
      { className: 'text-sm font-bold text-slate-700' },
      `${data.rows.length} ${data.rows.length === 1 ? 'app' : 'apps'} ready to import`
    ),
    React.createElement(
      'ul',
      { className: 'flex flex-col gap-1.5' },
      ...preview.map((row, idx) =>
        React.createElement(
          'li',
          {
            key: `miniapp-import-${idx}`,
            className:
              'flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700',
          },
          React.createElement(
            'span',
            {
              className:
                'shrink-0 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100',
            },
            'HTML'
          ),
          React.createElement(
            'span',
            { className: 'truncate font-medium' },
            row.title
          ),
          React.createElement(
            'span',
            { className: 'ml-auto shrink-0 text-xs font-mono text-slate-400' },
            `${(row.html.length / 1024).toFixed(1)} KB`
          )
        )
      )
    ),
    remaining > 0
      ? React.createElement(
          'p',
          { className: 'text-xs text-slate-500' },
          `…and ${remaining} more.`
        )
      : null
  );
}

/**
 * Build the adapter for the currently signed-in teacher. `userId` is bound
 * in at construction time so the wizard has everything it needs for `save()`.
 */
export function createMiniAppImportAdapter(
  userId: string
): ImportAdapter<MiniAppImportData> {
  return {
    widgetLabel: 'Mini App',
    supportedSources: ['json', 'file'],
    parse: parseMiniAppImport,
    validate: validateMiniAppImport,
    renderPreview: renderMiniAppPreview,
    async save(data) {
      if (!userId) throw new Error('Not authenticated');
      if (data.rows.length === 0) return;

      const appsRef = collection(db, 'users', userId, 'miniapps');
      const batch = writeBatch(db);
      const total = data.rows.length;

      data.rows.forEach((row, index) => {
        const id = crypto.randomUUID();
        const appData: MiniAppItem = {
          id,
          title: row.title,
          html: row.html,
          createdAt: Date.now(),
          // Matches the pre-migration behavior: new imports land at the top
          // by taking strictly smaller `order` values than anything existing.
          order: index - total,
        };
        batch.set(doc(appsRef, id), appData);
      });

      await batch.commit();
    },
  };
}
