const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.argv[2] || 'http://127.0.0.1:8194/';
const out = process.argv[3] || 'local/evidence';

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    fs.mkdirSync(out, {recursive: true});
    const page = await browser.newPage({viewport: {width: 1176, height: 920}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      await page.goto(base);
      await page.waitForFunction(() => window.r44Diagnostics?.shader.B === 'ready' && document.querySelector('#loading').hidden, undefined, {timeout: 90000});
    } catch (error) {
      console.error(await page.locator('body').innerText(), errors);
      throw error;
    }
    const canvas = page.locator('#road');
    for (const camera of ['driver', 'roadside', 'overview']) {
      await page.locator('#camera').selectOption(camera);
      for (const mode of ['A', 'B']) {
        await page.locator(`[data-mode="${mode}"]`).click();
        await page.waitForTimeout(500);
        await canvas.screenshot({path: `${out}/webgl-${camera}-${mode}.png`, timeout: 30000});
        // Retain portable evidence in the job log if artifact storage is full.
        const jpeg = await canvas.screenshot({type: 'jpeg', quality: 62, timeout: 30000});
        const encoded = jpeg.toString('base64');
        for (let offset = 0; offset < encoded.length; offset += 4096) {
          console.log(`R44_IMAGE ${camera} ${mode} ${offset} ${encoded.slice(offset, offset + 4096)}`);
        }
      }
    }
    await page.locator('#camera').selectOption('driver');
    await page.locator('#benchmark').click();
    await page.waitForFunction(() => window.r44Diagnostics?.benchmark, undefined, {timeout: 65000});
    let diagnostics = await page.evaluate(() => window.r44Diagnostics);
    assert.deepEqual(errors, []);
    assert.deepEqual(diagnostics.shader, {A:'ready',B:'ready'});
    assert.deepEqual(diagnostics.shaderErrors, []);
    assert.deepEqual(diagnostics.webglErrors, []);
    assert.equal(diagnostics.drawCalls, 2);
    assert.equal(diagnostics.triangles, 74448);
    assert.deepEqual(diagnostics.maps.resolution, [2048, 2048]);
    assert.deepEqual(diagnostics.benchmark.passes.map(pass => pass.mode), ['A', 'B', 'B', 'A']);
    assert.ok(diagnostics.benchmark.passes.every(pass => pass.samples > 5));
    fs.writeFileSync(`${out}/webgl-diagnostics.json`, JSON.stringify(diagnostics, null, 2) + '\n');
    console.log(JSON.stringify(diagnostics));
    const mobile = await browser.newPage({viewport: {width: 440, height: 796}, deviceScaleFactor: 3, isMobile: true, hasTouch: true});
    let interrupted = false;
    await mobile.route('**/scan-data-0.webp?*', route => {
      if (interrupted) return route.continue();
      interrupted = true;
      return route.abort();
    });
    await mobile.goto(base);
    await mobile.locator('#retry').waitFor({state:'visible',timeout:60000});
    await mobile.locator('#retry').click();
    await mobile.waitForFunction(() => window.r44Diagnostics?.shader.B === 'ready' && document.querySelector('#loading').hidden, undefined, {timeout: 60000});
    await mobile.locator('[data-mode="B"]').click();
    await mobile.locator('#motion').click();
    await mobile.waitForTimeout(4200);
    await mobile.locator('#motion').click();
    diagnostics = await mobile.evaluate(() => window.r44Diagnostics);
    assert.deepEqual(diagnostics.webglErrors, []);
    await mobile.locator('#copy').click();
    await mobile.waitForFunction(() => document.querySelector('#feedback').textContent.length > 0);
    assert.ok((await mobile.locator('#diagnostics-output').inputValue()).includes('"material": "B"'));
    console.log('Mobile-sized Chromium load, injected network failure, Retry, dolly and Copy Diagnostics passed.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
