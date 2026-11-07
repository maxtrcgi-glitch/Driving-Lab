// Run from repository root with an independent checkout of the R3.3 runtime.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {Highway,LANES} from '../dist/highway.js';
import {PerspectiveCamera} from '../dist/three.module.js';
const baseline=process.argv[2];
assert.ok(baseline,'Pass the R3.3 checkout directory');
const {Highway:Old}=await import(pathToFileURL(path.resolve(baseline,'dist/highway.js')).href);
const rows=[];
for(const density of [28,72,120])for(const enabled of [false,true]){
 const measured={r33:[],r34:[]};
 for(let rep=0;rep<3;rep++){
  const states={};
  const order=rep%2?[['r34',Highway],['r33',Old]]:[['r33',Old],['r34',Highway]];
  for(const [label,Type] of order){
   const road=new Type(86);road.density=density;road.reset(86,917);road.setDiagnostics(enabled);
   const camera=new PerspectiveCamera(60,844/390,.025,1500);
   const dt=1/30,speed=150/3.6;
   let s=0,stepMs=0,projectionMs=0;
   for(let i=0;i<2100;i++){
    s+=speed*dt/road.metric(s,LANES[1]);
    const p=road.point(s,LANES[1]);
    const player={...p,speed,vx:Math.sin(p.yaw)*speed,vz:Math.cos(p.yaw)*speed};
    const t=performance.now();road.step(dt,player);if(i>=300)stepMs+=performance.now()-t;
    if(enabled&&label==='r34'&&i%3===0){
     camera.position.set(p.x,p.y+1.3,p.z);
     camera.lookAt(p.x+Math.sin(p.yaw),p.y+1.3,p.z+Math.cos(p.yaw));camera.updateMatrixWorld();
     const u=performance.now();road.diagnostics.sampleView(road.clock,camera);if(i>=300)projectionMs+=performance.now()-u;
    }
   }
   states[label]={cars:road.cars,starts:road.laneChanges,rejected:road.rejectedChanges,recycled:road.retired,contacts:road.npcContacts,spawnFailures:road.spawnFailures};
   measured[label].push({stepMs:stepMs/1800,projectionMsPerStep:projectionMs/1800});
  }
  assert.deepEqual(states.r34,states.r33,'Audit instrumentation must preserve seeded traffic');
 }
 rows.push({density,enabled,measured});
}
console.log(JSON.stringify({scope:'Node CPU only. 3 alternating paired runs, 60 measured seconds after 10 seconds warmup, no rendering. Projection time excludes camera setup.',rows},null,2));
