import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
function files(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const file = `${directory}/${entry.name}`;
    return entry.isDirectory() ? files(file) : /\.(?:js|mjs)$/.test(file) ? [file] : [];
  });
}
let count = 0;
for (const file of ['dist', 'tests', 'integration'].flatMap(files)) {
  const result = spawnSync(process.execPath, ['--check', file], {encoding: 'utf8'});
  assert.equal(result.status, 0, `${file}\n${result.stderr}`); count++;
}
console.log({passed: true, javascriptFiles: count});
