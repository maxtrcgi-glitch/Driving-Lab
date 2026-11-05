import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';

export const requiredSuites = ['check:syntax', 'check:static', 'check:infrastructure', 'check', 'check:fast', 'check:predictor', 'check:shadow', 'check:seat', 'check:traffic-ai2', 'check:continuity', 'check:camera', 'check:launch', 'check:head', 'check:calibration', 'check:highway2', 'check:integration'];
fs.mkdirSync('reports/current', {recursive: true});
const scripts = JSON.parse(fs.readFileSync('package.json')).scripts, results = [];
// Continue independent suites to report all failures, but exit nonzero if any fails or times out.
for (const suite of requiredSuites) {
  assert.ok(scripts[suite], `Missing required command ${suite}`);
  const start = performance.now(), logPath = `reports/current/${suite.replace(':', '-')}.log`;
  const fd = fs.openSync(logPath, 'w');
  let result;
  try { result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', suite], {stdio: ['ignore', fd, fd], timeout: 900000}); }
  finally { fs.closeSync(fd); }
  const row = {command: `npm run ${suite}`, status: result.status === 0 && !result.error ? 'PASS' : 'FAIL', exitCode: result.status, error: result.error?.message, seconds: Math.round((performance.now() - start) / 10) / 100, logPath};
  results.push(row); console.log(JSON.stringify(row));
  fs.writeFileSync('reports/current/results.json', JSON.stringify({browserIncluded: false, required: true, results}, null, 2));
}
process.exitCode = results.every(result => result.status === 'PASS') ? 0 : 1;
