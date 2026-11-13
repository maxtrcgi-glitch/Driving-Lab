const { chromium } = require(process.env.R43_PLAYWRIGHT || 'playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');

(async () => {
  const [url, out, stage] = process.argv.slice(2);
  const browser = await chromium.launch({
    executablePath: process.env.R43_CHROMIUM || undefined,
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 992, height: 760 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(url + '?capture');
    await page.waitForFunction(() => window.ready || window.loadFailure, null, { timeout: 45000 });
    assert.equal(await page.evaluate(() => window.loadFailure), undefined);
    const records = {};
    for (const name of (stage === 'a' ? ['driver'] : ['driver','roadside','overview'])) {
      const data = await page.evaluate(name => {
        window.setCamera(name);
        return { diagnostics: window.diagnostics, png: document.querySelector('canvas').toDataURL() };
      }, name);
      assert.ok(data.diagnostics.drawCalls > 0 && data.diagnostics.triangles > 0);
      assert.deepEqual(data.diagnostics.webglErrors, []);
      records[name] = data.diagnostics;
      await fs.writeFile(`${out}/webgl-${name}.png`, Buffer.from(data.png.split(',')[1], 'base64'));
    }
    assert.deepEqual(errors, []);
    await page.route('**/highway.glb', route => route.fulfill({ status: 404 }));
    await page.reload();
    await page.waitForFunction(() => window.loadFailure);
    assert.match(await page.locator('#status').innerText(), /404/);
    await fs.writeFile(`${out}/webgl-stats.json`, JSON.stringify({ records, errors, assetFailure: 404 }, null, 2));
    console.log(JSON.stringify(records));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
