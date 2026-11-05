import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {assertA52Integrity, projectRoot} from './support/integrity.mjs';

assertA52Integrity();
const root = path.resolve(fileURLToPath(new URL('dist/', projectRoot)));
const out = fileURLToPath(new URL('reports/browser/', projectRoot));
await fs.mkdir(out, {recursive: true});
const mime = {'.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain'};
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
    const data = await fs.readFile(file);
    response.writeHead(200, {'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'}).end(data);
  } catch { response.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const baseURL = `http://127.0.0.1:${server.address().port}`;
const result = {status: 'BROWSER NOT VERIFIED', stub: false, pageErrors: [], consoleErrors: [], failedRequests: [], httpErrors: [], resources: [], warnings: []};
let browser, page;
const stage = name => { result.stage = name; console.log(`Browser stage: ${name}`); };
const timeout = setTimeout(async () => {
  result.error = 'Browser smoke exceeded 180s';
  await fs.writeFile(path.join(out, 'smoke.json'), JSON.stringify(result, null, 2));
  console.error(result.error);
  process.exit(1);
}, 180000);
try {
  const extraArgs = JSON.parse(process.env.CHROMIUM_EXTRA_ARGS || '[]');
  assert.ok(Array.isArray(extraArgs) && extraArgs.every(value => typeof value === 'string'));
  result.executableOverride = process.env.CHROMIUM_EXECUTABLE_PATH || null;
  stage('launch');
  browser = await chromium.launch({headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || undefined, args: [...extraArgs, '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
  result.browser = browser.version();
  page = await browser.newPage({viewport: {width: 844, height: 390}, deviceScaleFactor: 1});
  page.setDefaultTimeout(30000);
  page.on('pageerror', error => result.pageErrors.push(String(error)));
  page.on('console', message => {
    if (message.type() === 'error') result.consoleErrors.push(message.text());
    if (message.type() === 'warning') result.warnings.push(message.text());
  });
  page.on('requestfailed', request => result.failedRequests.push({url: request.url(), error: request.failure()?.errorText}));
  page.on('response', response => {
    result.resources.push({url: response.url().replace(baseURL, ''), status: response.status()});
    if (response.status() >= 400) result.httpErrors.push({url: response.url(), status: response.status()});
  });
  stage('load');
  assert.equal((await page.goto(baseURL, {waitUntil: 'domcontentloaded'})).status(), 200);
  await page.waitForFunction(() => window.drivingLab?.version === '0.14A.6.0');
  assert.match(await page.title(), /v0\.14A\.6\.0.*Traffic AI 3.0/);
  assert.equal(await page.locator('#fatal').isVisible(), false);
  stage('webgl');
  result.webgl = await page.evaluate(() => {
    const canvas = document.querySelector('canvas'), gl = canvas?.getContext('webgl2');
    if (!gl) throw new Error('Actual WebGL2 context is unavailable');
    if (gl.isContextLost()) throw new Error('WebGL context is lost');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return {version: gl.getParameter(gl.VERSION), renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), width: canvas.width, height: canvas.height};
  });
  assert.ok(result.webgl.width > 0 && result.webgl.height > 0);
  stage('start-highway');
  await page.locator('#start-highway').click();
  await page.waitForFunction(() => window.drivingLab.log.rows.length > 3);
  result.drivingFramesObserved = await page.evaluate(() => window.drivingLab.log.rows.length);
  // Screenshots are diagnostic artifacts; the required checks are real context/state/network assertions.
  await page.screenshot({path: path.join(out, 'highway.png'), timeout: 5000}).catch(error => {
    (result.screenshotWarnings ||= []).push(String(error));
  });
  stage('camera-settings');
  await page.locator('#pause-btn').click();
  await page.locator('#settings-btn').click();
  await page.getByText('Camera settings', {exact: true}).click();
  await page.locator('#camera-select').selectOption('1');
  await page.locator('#seat-preview').click();
  stage('seat-adjustment');
  const before = await page.evaluate(() => window.drivingLab.camera.position.toArray());
  await page.locator('#seat-height').press('Home');
  for (let i = 0; i < 5; i++) await page.locator('#seat-height').press('ArrowRight');
  await page.locator('#seat-forward').press('Home');
  for (let i = 0; i < 5; i++) await page.locator('#seat-forward').press('ArrowRight');
  await page.waitForFunction(() => window.drivingLab.cameraRig.settings.seatHeight === -.10 && window.drivingLab.cameraRig.settings.seatForward === -.15);
  assert.equal(await page.locator('#seat-height-out').textContent(), '-10 cm');
  assert.equal(await page.locator('#seat-forward-out').textContent(), '-15 cm');
  // input events persist synchronously; the real render loop applies the transform on its next frame.
  await page.waitForFunction(previous => Math.hypot(...previous.map((value, index) => value - window.drivingLab.camera.position.toArray()[index])) > .1, before);
  result.seat = await page.evaluate(() => ({settings: {...window.drivingLab.cameraRig.settings}, position: window.drivingLab.camera.position.toArray(), stored: JSON.parse(localStorage.getItem('driving-lab-camera-v014a4'))}));
  assert.ok(Math.hypot(...before.map((value, index) => value - result.seat.position[index])) > .1, 'Seat moves the actual camera');
  assert.equal(result.seat.stored.seatHeight, -.10);
  assert.equal(result.seat.stored.seatForward, -.15);
  await page.screenshot({path: path.join(out, 'seat-preview.png'), timeout: 5000}).catch(error => {
    (result.screenshotWarnings ||= []).push(String(error));
  });
  stage('reload');
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => window.drivingLab?.version === '0.14A.6.0');
  const restored = await page.evaluate(() => ({height: window.drivingLab.cameraRig.settings.seatHeight, forward: window.drivingLab.cameraRig.settings.seatForward}));
  assert.deepEqual(restored, {height: -.10, forward: -.15});
  // Reopen the real controls and exercise Reset Position without rewriting state in evaluate().
  stage('reset-position');
  await page.locator('#welcome-settings').click();
  await page.getByText('Camera settings', {exact: true}).click();
  assert.equal(await page.locator('#seat-height').inputValue(), '-10');
  await page.locator('#reset-seat').click();
  assert.equal(await page.locator('#seat-height-out').textContent(), '0 cm');
  const reset = await page.evaluate(() => JSON.parse(localStorage.getItem('driving-lab-camera-v014a4')));
  assert.equal(reset.seatHeight, 0); assert.equal(reset.seatForward, 0);
  for (const key of Object.keys(result.seat.stored).filter(key => !key.startsWith('seat'))) assert.deepEqual(reset[key], result.seat.stored[key], `Reset preserves ${key}`);
  for (const resource of ['/app.js', '/three.module.js', '/three.core.js', '/camera-rig.js', '/camera-settings.js', '/style.css'])
    assert.ok(result.resources.some(item => item.url === resource && item.status === 200), `Browser loaded ${resource}`);
  for (const key of ['pageErrors', 'consoleErrors', 'failedRequests', 'httpErrors']) assert.deepEqual(result[key], [], key);
  result.status = 'PASS'; result.reloadPersistence = true; result.resetPosition = true;
} catch (error) {
  result.error = error.stack; process.exitCode = 1;
  if (page) await page.screenshot({path: path.join(out, 'failure.png'), timeout: 5000}).catch(() => {});
} finally {
  clearTimeout(timeout);
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  await fs.writeFile(path.join(out, 'smoke.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

