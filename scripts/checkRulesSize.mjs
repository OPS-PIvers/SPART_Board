#!/usr/bin/env node
/**
 * Guard firestore.rules against Firebase's compiled-ruleset size cap.
 *
 * BACKGROUND: the Firebase Rules API rejects a ruleset whose SOURCE TEXT
 * exceeds 256 KiB (262144 bytes) with a bare
 * `HTTP Error: 400, Request contains an invalid argument` at the
 * `firebaserules.googleapis.com/v1/projects/*:test` compile step — no mention
 * of size. Comments count toward the cap.
 *
 * Nothing else in the pipeline catches this: the Firestore emulator that backs
 * `pnpm run test:rules` does NOT enforce the cap, so the full rules suite goes
 * green on a file that the real API will refuse. The failure therefore lands in
 * the deploy job on `main`/`dev-*` AFTER merge, where it also blocks the
 * indexes, Storage rules, and Cloud Functions bundled into the same deploy.
 *
 * That is exactly how #2915 shipped: it added 569 bytes to a file already 92
 * bytes under the cap, and the dev-paul deploy failed on a green PR. It had
 * happened once before (#2089, which reclaimed headroom by slimming comments).
 *
 * This check is byte-exact and needs no emulator or network, so it runs in
 * `validate` and ahead of `test:rules`.
 */

import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 262144; // 256 KiB, enforced by the Firebase Rules API
const WARN_RATIO = 0.9;

const RULES_PATH = fileURLToPath(
  new URL('../firestore.rules', import.meta.url)
);

const bytes = statSync(RULES_PATH).size;
const pct = ((bytes / MAX_BYTES) * 100).toFixed(1);

if (bytes > MAX_BYTES) {
  const over = bytes - MAX_BYTES;
  const commentBytes = readFileSync(RULES_PATH, 'utf8')
    .split('\n')
    .filter((line) => line.trimStart().startsWith('//'))
    .reduce((sum, line) => sum + Buffer.byteLength(line, 'utf8') + 1, 0);
  console.error(
    `\nfirestore.rules is ${bytes} bytes — ${over} OVER the ${MAX_BYTES}-byte ` +
      `(256 KiB) Firebase ruleset cap.\n\n` +
      `The deploy will fail with "HTTP Error: 400, Request contains an invalid ` +
      `argument" at the rules compile step. The emulator does not enforce this, ` +
      `so test:rules will still pass.\n\n` +
      `Comments count toward the cap and currently account for ${commentBytes} ` +
      `bytes. Condense comment blocks to reclaim headroom (see #2089 and #2915) ` +
      `— that is a comments-only change with no rule-logic impact.\n`
  );
  process.exit(1);
}

if (bytes > MAX_BYTES * WARN_RATIO) {
  console.warn(
    `warning: firestore.rules is ${bytes} bytes (${pct}% of the ${MAX_BYTES}-byte ` +
      `cap, ${MAX_BYTES - bytes} left). Reclaim headroom before it blocks a deploy.`
  );
} else {
  console.log(
    `firestore.rules: ${bytes} bytes (${pct}% of cap, ${MAX_BYTES - bytes} free)`
  );
}
