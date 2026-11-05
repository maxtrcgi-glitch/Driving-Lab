import fs from 'node:fs';
import {digest, projectRoot} from '../support/integrity.mjs';

// Deliberately retains the old, now-inapplicable source-identity expectations.
// A changed byte is reported as a failure, never converted to a pass or silently skipped.
const audits = JSON.parse(fs.readFileSync(new URL('../fixtures/historical-identities.json', import.meta.url)));
const results = audits.map(audit => {
  const mismatches = Object.entries(audit.files).filter(([name, expected]) =>
    digest(fs.readFileSync(new URL(`dist/${name}`, projectRoot))) !== expected).map(([name]) => name);
  if (audit.app_version_only_sha256 && digest(fs.readFileSync(new URL('dist/app.js', projectRoot))) !== audit.app_version_only_sha256)
    mismatches.push('app.js (A42→A51 version-only substitution)');
  return {test: audit.test, ref: audit.ref, commit: audit.commit, status: mismatches.length ? 'FAIL' : 'PASS', mismatches};
});
fs.mkdirSync(new URL('reports/', projectRoot), {recursive: true});
fs.writeFileSync(new URL('reports/legacy-identities.json', projectRoot), JSON.stringify({diagnosticOnly: true, results}, null, 2));
console.log(JSON.stringify({diagnosticOnly: true, results}, null, 2));
process.exitCode = results.some(result => result.status !== 'PASS') ? 1 : 0;
