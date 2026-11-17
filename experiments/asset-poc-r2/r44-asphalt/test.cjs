const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function run() {
  const browser = await chromium.launch({args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage({viewport: {width: 1152, height: 900}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = new URL(process.argv[2]);
    await page.goto(new URL('smoke.html', base).href);
    await page.waitForFunction(() => Boolean(window.result));
    const smoke = await page.evaluate(() => window.result);
    console.log(JSON.stringify(smoke));
    assert.deepEqual(errors.concat(smoke.errors), []);
    assert.equal(smoke.glError, 0);
    assert.match(smoke.gl, /WebGL 2\.0/);
    assert.equal(smoke.programs, 2);
    assert.equal(smoke.triangles, 2);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
