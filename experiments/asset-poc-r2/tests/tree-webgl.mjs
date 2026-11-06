import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
const dir='experiments/asset-poc-r2',out='reports/tree-webgl';await fs.mkdir(out,{recursive:true});
const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1','--directory',dir],{stdio:'inherit'});
let browser,page,errors=[],results=[];const delay=ms=>new Promise(r=>setTimeout(r,ms));
try {
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:8765/viewer/')).ok)break;}catch{}await delay(100)}
 browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});page=await context.newPage();
 page.on('pageerror',e=>errors.push('pageerror: '+e.stack));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});page.on('requestfailed',r=>errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()}: ${r.url()}`)});
 await page.goto('http://127.0.0.1:8765/viewer/',{waitUntil:'load'});await page.waitForFunction(()=>window.viewerReady===true,{timeout:60000});await page.waitForFunction(()=>window.viewerStats?.calls>0,{timeout:30000});
 const meta=await page.evaluate(()=>window.viewerTest.environment());meta.browser=browser.version();meta.platform='GitHub Actions ubuntu-24.04';meta.head=process.env.GITHUB_SHA;meta.run=process.env.GITHUB_RUN_ID;await fs.writeFile(`${out}/environment.json`,JSON.stringify(meta,null,2));
 async function setup(lod,count,pos){await page.selectOption('#lod',{label:`LOD${lod}`});await page.selectOption('#count',String(count));await page.evaluate(p=>window.viewerTest.setCamera(...p),pos);await delay(4000);}
 async function snap(name,lod,count,pos){await setup(lod,count,pos);await page.screenshot({path:`${out}/${name}.png`});}
 await snap('lod0-close',0,1,[4,3,5]);await snap('lod1-medium',1,1,[9,5,12]);await snap('lod2-far',2,1,[17,8,24]);
 for(let i=0;i<3;i++)await snap(`comparison-lod${i}`,i,1,[7,4,10]);
 await snap('10-trees',0,10,[32,25,44]);await snap('30-trees',0,30,[35,28,52]);
 for(const count of [1,10,30])for(const lod of [0,1,2]){const pos=count===1?[8,5,10]:count===10?[32,25,44]:[35,28,52];await setup(lod,count,pos);const sample=await page.evaluate(()=>({stats:window.viewerStats,environment:window.viewerTest.environment()}));results.push({trees:count,lod,...sample});}
 await fs.writeFile(`${out}/measurements.json`,JSON.stringify(results,null,2));
 if(errors.length)throw Error('Browser errors: '+errors.join('\n'));if(results.some(x=>!x.stats||!x.stats.calls||!x.stats.renderTriangles||!Number.isFinite(x.stats.fps)))throw Error('Invalid renderer stats');
 console.log(JSON.stringify({environment:meta,measurements:results,errors},null,2));
} catch(e) {errors.push(String(e.stack||e));console.error(e);process.exitCode=1;try{if(page)await page.screenshot({path:`${out}/failure.png`})}catch{}} finally {await fs.writeFile(`${out}/browser-errors.json`,JSON.stringify(errors,null,2));await fs.writeFile(`${out}/measurements-partial.json`,JSON.stringify(results,null,2));await browser?.close();server.kill()}
