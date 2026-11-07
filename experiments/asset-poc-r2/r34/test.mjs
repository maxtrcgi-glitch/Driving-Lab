import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const out = 'reports/r34';
const origin = 'http://127.0.0.1:8765';
const server = spawn('python3', ['-m', 'http.server', '8765', '--directory', 'experiments/asset-poc-r2']);
const errors = [];
const results = [];
let browser;
await fs.mkdir(out, { recursive: true });
try {
  for (let i = 0; i < 100; i++) {
    if (await fetch(origin).then(r => r.ok, () => false)) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  const views = [
    ['driver-daylight', 'driver', false, 20],
    ['driver-low-sun', 'driver', true, 20],
    ['roadside', 'roadside', false, 20],
    ['overview', 'overview', false, 20]
  ];
  for (const dir of ['r23c', 'r34']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const bytes = new Map();
    const pending = [];
    page.on('pageerror', error => errors.push(String(error)));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('requestfailed', request => errors.push(request.url() + ' ' + request.failure()?.errorText));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(response.status() + ' ' + response.url());
    });
    page.on('requestfinished', request => {
      if (/\.(jpg|glb)$/.test(request.url())) {
        pending.push(request.sizes().then(s => bytes.set(new URL(request.url()).pathname, s.responseBodySize)));
      }
    });
    await page.goto(`${origin}/${dir}/`);
    await page.waitForFunction(() => window.ready === true);
    await page.locator('#ui').evaluate(node => { node.style.visibility = 'hidden'; });
    const shots = dir === 'r34'
      ? [...views, ['guardrail-close', 'rail', false, 33], ['shoulder-transition', 'shoulder', false, 25]]
      : views;
    for (const [name, view, sunLow, at] of shots) {
      const stats = await page.evaluate(options => window.setScene(options), {view, sunLow, at, move:false});
      assert.equal(stats.glError, 0);
      assert.match(stats.version, /WebGL 2/);
      results.push({dir, name, ...stats});
      await page.screenshot({path: `${out}/${dir}-${name}.png`});
    }
    await Promise.all(pending);
    assert.ok(bytes.size >= (dir === 'r34' ? 10 : 3));
    if (dir === 'r34') {
      assert.ok([...bytes].some(([url, size]) => url.endsWith('/guardrail.glb') && size > 0));
      assert.ok([...bytes].some(([url, size]) => url.endsWith('/jersey-barrier.glb') && size > 0));
    }
    results.push({dir, assetTransfer: Object.fromEntries(bytes), assetBytes: [...bytes.values()].reduce((a,b) => a+b, 0)});
    await page.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await fs.writeFile(out + '/stats.json', JSON.stringify({results, errors}, null, 2));
  await browser?.close();
  server.kill();
}
