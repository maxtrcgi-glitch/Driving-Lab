import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertA52Integrity, projectRoot} from './support/integrity.mjs';
import {verifyBaselines} from './support/baselines.mjs';

export function auditResources(root = fileURLToPath(projectRoot)) {
  const dist = path.resolve(root, 'dist');
  const links = [];
  function requireResource(from, spec) {
    assert.ok(!/^(?:https?:|\/\/)/.test(spec), `External runtime dependency in ${from}: ${spec}`);
    if (spec.startsWith('data:') || spec.startsWith('#')) return;
    const target = path.resolve(path.dirname(from), decodeURIComponent(spec.split(/[?#]/)[0]));
    assert.ok(target.startsWith(dist + path.sep), `Resource escapes dist: ${spec}`);
    assert.ok(fs.statSync(target).isFile(), `Missing resource: ${spec} from ${from}`);
    links.push({from: path.relative(dist, from), spec});
  }
  for (const name of fs.readdirSync(dist)) {
    const file = path.join(dist, name), source = fs.readFileSync(file, 'utf8');
    if (name.endsWith('.js')) {
      for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*|\bimport\s*\(\s*)['"]([^'"]+)['"]/g)) {
        assert.ok(match[1].startsWith('.'), `Non-relative module dependency: ${name}: ${match[1]}`);
        requireResource(file, match[1]);
      }
    }
    if (name.endsWith('.html')) {
      for (const match of source.matchAll(/<(script|link|img|source)\b[^>]*\b(?:src|href)=["']([^"']+)["'][^>]*>/g)) requireResource(file, match[2]);
    }
    if (name.endsWith('.css')) for (const match of source.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) requireResource(file, match[1]);
  }
  for (const icon of JSON.parse(fs.readFileSync(path.join(dist, 'manifest.webmanifest'))).icons)
    requireResource(path.join(dist, 'manifest.webmanifest'), icon.src);
  return links;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const hashes = assertA52Integrity(), fixtures = verifyBaselines(), resources = auditResources();
  fs.mkdirSync('reports', {recursive: true});
  const result = {passed: true, distFiles: Object.keys(hashes).length, resourceLinks: resources.length, fixtureAliases: fixtures.aliases};
  fs.writeFileSync('reports/static-audit.json', JSON.stringify(result, null, 2));
  console.log(result);
}
