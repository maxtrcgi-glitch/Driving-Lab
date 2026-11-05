import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';

export const projectRoot = new URL('../../', import.meta.url);
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifyBytes(bytes, expected, label) {
  assert.equal(digest(bytes), expected, `Integrity mismatch: ${label}`);
  return bytes;
}
export function assertA52Integrity(root = projectRoot) {
  const manifest = JSON.parse(fs.readFileSync(new URL('../fixtures/a52-dist.json', import.meta.url)));
  const directory = root instanceof URL ? new URL('dist/', root) : path.join(root, 'dist');
  assert.deepEqual(fs.readdirSync(directory).sort(), Object.keys(manifest.files).sort(), 'Exact A52 dist inventory');
  for (const [name, expected] of Object.entries(manifest.files)) {
    const file = directory instanceof URL ? new URL(name, directory) : path.join(directory, name);
    verifyBytes(fs.readFileSync(file), expected, `dist/${name}`);
  }
  return manifest.files;
}
