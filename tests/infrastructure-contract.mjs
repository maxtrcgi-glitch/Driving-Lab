import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {projectRoot, assertA52Integrity, verifyBytes} from './support/integrity.mjs';
import {baselineFile} from './support/baselines.mjs';
import {auditResources} from './static-audit.mjs';

// Negative controls operate only on disposable copies, never on game files.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'a52-audit-negative-'));
try {
  fs.cpSync(new URL('dist/', projectRoot), path.join(temp, 'dist'), {recursive: true});
  assertA52Integrity(temp); auditResources(temp);
  fs.appendFileSync(path.join(temp, 'dist/camera-settings.js'), '\n// deliberate corruption\n');
  assert.throws(() => assertA52Integrity(temp), /Integrity mismatch/);
  fs.unlinkSync(path.join(temp, 'dist/camera-settings.js'));
  assert.throws(() => auditResources(temp));
  fs.writeFileSync(path.join(temp, 'dist/extra.tmp'), 'unapproved');
  assert.throws(() => assertA52Integrity(temp), /inventory/);
  assert.throws(() => baselineFile('made-up:dist/physics.js'), /Missing historical fixture/);
  assert.throws(() => verifyBytes(Buffer.from('corrupt'), '0'.repeat(64), 'fixture'), /Integrity mismatch/);
  console.log({passed: true, negativeControls: 5, sourceDistMutated: false});
} finally { fs.rmSync(temp, {recursive: true, force: true}); }
