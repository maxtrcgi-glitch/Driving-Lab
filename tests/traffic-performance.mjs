import {baselineFile} from './support/baselines.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';

import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {Highway} from '../dist/highway.js';
const text=baselineFile('gameplay-baseline/v0.14A.3.1:dist/highway.js',{encoding:'utf8'}).replace("'./physics.js'",JSON.stringify(pathToFileURL(path.resolve('dist/physics.js')).href));const {Highway:Old}=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
const out=process.argv[2]||'/tmp/driving-lab-traffic-ai2';fs.mkdirSync(out,{recursive:true});
const quantile=(a,q)=>a.sort((a,b)=>a-b)[Math.floor((a.length-1)*q)];
function sim(H,density,frames,profile=false,crashes=0){const h=new H(86);h.density=density;h.reset(86,391);let s=0,totalDecision=0,totalContact=0,totalBarrier=0,decisionCalls=0,contactCalls=0,barrierCalls=0;
 if(crashes)for(let i=0;i<crashes;i++){const c=h.cars[i];c.crashed=true;c.vx*=.3;c.vz*=.3;}
 if(profile){for(const [name,type] of [['decide',0],['crashContacts',1],['barrierContact',2]]){const orig=h[name];h[name]=function(...args){const t=performance.now(),r=orig.apply(this,args),ms=performance.now()-t;if(type===0){totalDecision+=ms;decisionCalls++;}if(type===1){totalContact+=ms;contactCalls++;}if(type===2){totalBarrier+=ms;barrierCalls++;}return r;};}}
 const samples=[];let decisionTicks=0;
 for(let i=0;i<frames+120;i++){s+=28/60/Math.hypot(1,h.gradient(s));const p=h.point(s,-7.4),v={...p,vx:Math.sin(p.yaw)*28,vz:Math.cos(p.yaw)*28,speed:28};const prev=h.decisions,t=performance.now();for(let j=0;j<4;j++)h.step(1/240,v);const ms=performance.now()-t;if(i>=120){samples.push(ms);if(h.decisions>prev)decisionTicks++;}}
 return {meanMs:samples.reduce((a,b)=>a+b)/samples.length,p50Ms:quantile(samples,.5),p95Ms:quantile(samples,.95),p99Ms:quantile(samples,.99),decisionTicks,active:h.cars.length,decisionMsPerSimSecond:totalDecision/((frames+120)/60),contactMsPerSimSecond:totalContact/((frames+120)/60),barrierMsPerSimSecond:totalBarrier/((frames+120)/60),decisionCalls,contactCalls,barrierCalls,profiled:profile};}
// Alternate order to reduce a single warmup/order bias. Identical player path,
// density, road and seed request; AI itself intentionally produces new traffic.
const bench=[];for(const density of [28,72,120]){sim(Old,density,600);sim(Highway,density,600);const a=[],b=[];for(let repeat=0;repeat<3;repeat++){if(repeat%2){b.push(sim(Highway,density,1800));a.push(sim(Old,density,1800));}else{a.push(sim(Old,density,1800));b.push(sim(Highway,density,1800));}}bench.push({density,baselineRuns:a,currentRuns:b,baselineMeanFrameTrafficMs:a.reduce((s,r)=>s+r.meanMs,0)/3,currentMeanFrameTrafficMs:b.reduce((s,r)=>s+r.meanMs,0)/3,componentProfile:sim(Highway,density,600,true)});}
const crashCosts=[0,1,12,120].map(crashes=>({initialCrashes:crashes,...sim(Highway,120,600,true,crashes)}));
let memory=null;if(global.gc){const h=new Highway(86);h.density=120;h.reset(86,719);const refs=new Set(h.cars);global.gc();const before=process.memoryUsage().heapUsed;for(let i=0;i<60000;i++){const s=i/240*32,p=h.point(s,-7.4);h.step(1/240,{...p,vx:Math.sin(p.yaw)*32,vz:Math.cos(p.yaw)*32,speed:32});assert.equal(h.cars.length,120);}global.gc();const after=process.memoryUsage().heapUsed;assert.ok(h.cars.every(c=>refs.has(c)));memory={physicsSteps:60000,simSeconds:250,heapBeforeBytes:before,heapAfterBytes:after,retainedDeltaBytes:after-before,carObjectsReused:true,active:120};assert.ok(after-before<1024*1024,'Unbounded retained heap in traffic run');}
const result={nodeCPUOnly:true,notPhoneFPS:true,frameDefinition:'4 traffic steps of 1/240 = 1 simulated 60Hz frame; no rendering or player physics',decisionTargetHz:30,bench,crashCosts,memory};fs.writeFileSync(out+'/traffic-performance.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
