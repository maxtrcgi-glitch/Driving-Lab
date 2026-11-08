import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const root='experiments/asset-poc-r2', out=root+'/r40-blender-pipeline';
const server=spawn('python3',['-m','http.server','8769','--directory',root]);let browser;
try{
 for(let i=0;i<100;i++){if(await fetch('http://127.0.0.1:8769/').then(r=>r.ok,()=>false))break;await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1000,height:650}});const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:8769/r40-blender-pipeline/');await page.waitForFunction(()=>window.result||window.failure,null,{timeout:120000});
 const result=await page.evaluate(()=>({result:window.result,failure:window.failure}));assert.ok(!result.failure,JSON.stringify(result));let s=JSON.parse(await fs.readFile(out+'/blender-stats.json'));
 assert.ok(result.result.meshes>0&&result.result.uv===result.result.meshes&&result.result.normals===result.result.meshes);assert.ok(result.result.materials>0&&result.result.textures>0);assert.equal(result.result.glError,0);assert.equal(result.result.triangles,s.triangles);for(let i=0;i<3;i++)assert.ok(Math.abs(result.result.size[i]-s.dimensions_m[i])<.01,JSON.stringify({result,s}));assert.deepEqual(errors,[]);
 await page.locator('#status').evaluate(e=>e.style.display='none');await page.screenshot({path:out+'/webgl-export.png'});await fs.writeFile(out+'/webgl-stats.json',JSON.stringify({result:result.result,errors},null,2));console.log(JSON.stringify(result.result));
}finally{await browser?.close();server.kill()}
