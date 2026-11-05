import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projectRoot, verifyBytes} from './integrity.mjs';

const manifest = JSON.parse(fs.readFileSync(new URL('../fixtures/baseline-modules.json', import.meta.url)));
// Compatibility with the former git-show call sites: return Buffer unless encoding is explicit.
// Every alias is pinned to actual historical bytes. No fallback to current code or Git tags.
export function baselineFile(spec, options = {}) {
  const entry = manifest.files[spec];
  assert.ok(entry, `Missing historical fixture: ${spec}`);
  const bytes = verifyBytes(fs.readFileSync(new URL(entry.source, projectRoot)), entry.sha256, spec);
  return options.encoding ? bytes.toString(options.encoding) : bytes;
}
export function verifyBaselines() {
  for (const spec of Object.keys(manifest.files)) baselineFile(spec);
  return {aliases: Object.keys(manifest.files).length, refs: manifest.refs};
}
