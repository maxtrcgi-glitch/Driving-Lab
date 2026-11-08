import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
const root='experiments/asset-poc-r2',out=root+'/r42-fidelity';
const server=spawn('python3',['-m','http.server','8769','--directory',root]);
let browser;
try {
 for(let i=0;i<100;i++){if(await fetch('http://127.0.0.1:8769/').then(r=>r.ok,()=>false))break;await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],timeout:60000});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:8769/r42-fidelity/',{timeout:120000});
 await page.waitForFunction(()=>window.result||window.failure,null,{timeout:600000});
 const result=await page.evaluate(()=>({result:window.result,failure:window.failure}));
 if(result.failure)throw Error(result.failure);
 await page.screenshot({path:out+'/webgl-driver.png',timeout:120000});
 result.errors=errors;
 result.glbBytes=(await fs.stat(out+'/highway-r42.glb')).size;
 await fs.writeFile(out+'/webgl-stats.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
 if(result.result.glError||errors.length)throw Error('WebGL or browser errors detected');
}finally{await browser?.close();server.kill()}
