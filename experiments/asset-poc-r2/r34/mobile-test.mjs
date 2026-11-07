import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const root=process.argv[2] || 'demo';
const server=spawn('python3',['-m','http.server','8767','--directory',root]);
let browser;
try {
 for(let i=0;i<100;i++){if(await fetch('http://127.0.0.1:8767/').then(r=>r.ok,()=>false))break;await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const scenario of ['success','texture','glb','rejection','timeout','clipboard']) {
  const page=await browser.newPage({viewport:{width:500,height:700}});
  if(scenario==='texture') await page.route('**/asphalt_02_diff_1k.jpg',r=>r.abort());
  if(scenario==='glb') await page.route('**/guardrail-mobile.glb',r=>r.abort());
  if(scenario==='rejection') await page.route('**/jersey-barrier-mobile.glb',r=>r.fulfill({status:200,body:'invalid glb'}));
  if(scenario==='timeout') await page.route('**/guardrail-mobile.glb',async r=>{await new Promise(resolve=>setTimeout(resolve,32000));await r.abort().catch(()=>{});});
  if(scenario==='clipboard') await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:undefined,configurable:true}));
  await page.goto('http://127.0.0.1:8767/');
  await page.waitForFunction(()=>window.loadingDiagnostics?.finished,null,{timeout:65000});
  const d=await page.evaluate(()=>window.loadingDiagnostics), text=await page.locator('#info').textContent();
  if(['success','clipboard'].includes(scenario)){assert.equal(d.complete,true,JSON.stringify(d));assert.equal(d.loaded,11);assert.equal(await page.evaluate(()=>window.sceneStats().glError),0)}
  else {assert.equal(d.complete,false);assert.ok(d.failed.length,JSON.stringify(d));assert.match(text,/fail/i);if(scenario==='timeout')assert.equal(d.failed[0].category,'timeout');if(scenario==='glb'||scenario==='rejection'||scenario==='timeout')assert.ok(await page.locator('canvas').count());}
  if(scenario==='clipboard'){await page.locator('#copy').click();assert.equal(await page.locator('#diagnostics').isVisible(),true);assert.match(await page.locator('#diagnostics').inputValue(),/renderer/)}
  console.log(scenario,JSON.stringify({text,loaded:d.loaded,failed:d.failed,webgl:d.webgl}));
  await page.close();
 }
} finally {await browser?.close();server.kill()}
