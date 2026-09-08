#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const [filename] = process.argv.slice(2);

if (!filename) {
  console.error('Usage: node validate_gl_json.mjs <file.gl.json>');
  process.exit(1);
}

const source = await readFile(filename, 'utf8');
let set;

try {
  set = JSON.parse(source);
} catch (error) {
  throw new Error(`File is not valid JSON: ${error.message}`);
}

const fail = (message) => {
  throw new Error(message);
};
const isObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

if (!isObject(set)) fail('The file must contain one JSON object');
if (typeof set.title !== 'string' || !set.title.trim()) {
  fail('title must be a non-empty string');
}
if (set.schemaVersion !== 2) fail('schemaVersion must be 2');
if (!['structured', 'guided', 'explore'].includes(set.mode)) {
  fail('mode must be structured, guided, or explore');
}
for (const forbidden of ['imagePaths', 'isBuilding', 'authorUid']) {
  if (forbidden in set) fail(`Remove importer-specific field: ${forbidden}`);
}

if (!Array.isArray(set.imageUrls) || set.imageUrls.length === 0) {
  fail('imageUrls must contain at least one embedded image');
}
if (
  set.imageKinds !== undefined &&
  (!Array.isArray(set.imageKinds) ||
    set.imageKinds.length !== set.imageUrls.length ||
    set.imageKinds.some((kind) => !['image', 'video'].includes(kind)))
) {
  fail('imageKinds must align with imageUrls and contain image or video');
}

const decodedImages = set.imageUrls.map((url, index) => {
  if (typeof url !== 'string') fail(`imageUrls[${index}] must be a string`);
  if (url.startsWith('blob:')) fail(`imageUrls[${index}] contains a blob URL`);

  const kind = set.imageKinds?.[index] ?? 'image';
  if (kind === 'video') {
    if (!/^https:\/\//.test(url)) {
      fail(`imageUrls[${index}] must be an https URL for a video slide`);
    }
    return { index, kind, url: true };
  }

  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(url);
  if (!match) {
    fail(`imageUrls[${index}] must be an embedded PNG or JPEG data URI`);
  }

  const bytes = Buffer.from(match[2], 'base64');
  const signature = bytes.subarray(0, 8).toString('hex');
  const validPng = match[1] === 'png' && signature === '89504e470d0a1a0a';
  const validJpeg =
    match[1] === 'jpeg' && bytes.length >= 3 && signature.startsWith('ffd8ff');
  if (!validPng && !validJpeg) {
    fail(`imageUrls[${index}] has an invalid ${match[1]} payload`);
  }

  return { index, kind: match[1], bytes: bytes.length };
});

if (!Array.isArray(set.steps) || set.steps.length === 0) {
  fail('steps must contain at least one step');
}

const interactionTypes = new Set([
  'tooltip',
  'text-popover',
  'pan-zoom',
  'spotlight',
  'pan-zoom-spotlight',
  'audio',
  'video',
  'question',
]);
const ids = new Set();

set.steps.forEach((step, index) => {
  const path = `steps[${index}]`;
  if (!isObject(step)) fail(`${path} must be an object`);
  if (typeof step.id !== 'string' || !step.id.trim()) {
    fail(`${path}.id must be a non-empty string`);
  }
  if (ids.has(step.id)) fail(`${path}.id must be unique`);
  ids.add(step.id);

  for (const key of ['xPct', 'yPct']) {
    if (!Number.isFinite(step[key]) || step[key] < 0 || step[key] > 100) {
      fail(`${path}.${key} must be a number from 0 to 100`);
    }
  }
  if (
    !Number.isInteger(step.imageIndex) ||
    step.imageIndex < 0 ||
    step.imageIndex >= set.imageUrls.length
  ) {
    fail(`${path}.imageIndex is outside imageUrls`);
  }
  if (!interactionTypes.has(step.interactionType)) {
    fail(`${path}.interactionType is invalid`);
  }

  if (step.label !== undefined) {
    if (typeof step.label !== 'string' || !step.label.trim()) {
      fail(`${path}.label must be a non-empty string when present`);
    }
    const labelWords = step.label.trim().split(/\s+/).length;
    if (labelWords > 4) fail(`${path}.label exceeds four words`);
  }

  if (typeof step.text === 'string') {
    const textWords = step.text.trim().split(/\s+/).filter(Boolean).length;
    if (textWords > 25) fail(`${path}.text exceeds 25 words`);
  }

  if (step.interactionType === 'question') {
    if (!isObject(step.question)) fail(`${path}.question must be an object`);
    if (step.question.type === 'multiple-choice') {
      if (!Array.isArray(step.question.choices)) {
        fail(`${path}.question.choices must be an array`);
      }
      if (!step.question.choices.includes(step.question.correctAnswer)) {
        fail(`${path}.question.correctAnswer must appear in choices`);
      }
    }
    if (
      step.question.type === 'matching' &&
      (!Array.isArray(step.question.matchingPairs) ||
        step.question.matchingPairs.length === 0)
    ) {
      fail(`${path}.question.matchingPairs must not be empty`);
    }
    if (
      step.question.type === 'sorting' &&
      (!Array.isArray(step.question.sortingItems) ||
        step.question.sortingItems.length === 0)
    ) {
      fail(`${path}.question.sortingItems must not be empty`);
    }
  }
});

console.log(
  JSON.stringify(
    {
      file: filename,
      fileBytes: Buffer.byteLength(source),
      title: set.title,
      schemaVersion: set.schemaVersion,
      steps: set.steps.length,
      images: decodedImages,
    },
    null,
    2
  )
);
