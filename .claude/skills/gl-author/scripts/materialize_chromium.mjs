#!/usr/bin/env node

import { createReadStream, createWriteStream } from 'node:fs';
import { chmod, mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createBrotliDecompress } from 'node:zlib';

const [archiveArg, outputArg] = process.argv.slice(2);

if (!archiveArg || !outputArg) {
  console.error(
    'Usage: node materialize_chromium.mjs <chromium.br> <output-path>'
  );
  process.exit(1);
}

const archivePath = resolve(archiveArg);
const outputPath = resolve(outputArg);

await stat(archivePath);
await mkdir(dirname(outputPath), { recursive: true });
await pipeline(
  createReadStream(archivePath),
  createBrotliDecompress(),
  createWriteStream(outputPath)
);
await chmod(outputPath, 0o755);

console.log(outputPath);
