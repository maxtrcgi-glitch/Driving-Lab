import assert from 'node:assert/strict';
import {Highway,LANES} from '../dist/highway.js';
for(const density of [28,72,120]){
 const a=new Highway(86),b=new Highway(86);a.density=b.density=density;const p=a.reset(86,917);b.reset(86,917);b.setDiagnostics(true);
 assert.deepEqual(a.cars,b.cars);assert.ok(new Set(a.cars.map(c=>c.traits.speedTendency)).size>density*.9);
 const originals=new Map(a.cars.map(c=>[c.id,{generation:c.generation,traits:JSON.stringify(c.traits)}]));
 for(let i=0;i<600;i++){a.step(1/30,{...p,vx:0,vz:0,speed:0});b.step(1/30,{...p,vx:0,vz:0,speed:0});}
 assert.deepEqual(a.cars,b.cars);for(const c of a.cars){let old=originals.get(c.id);if(c.generation===old.generation)assert.equal(JSON.stringify(c.traits),old.traits);assert.ok(c.headway>=1.05&&c.headway<=1.95);assert.ok(c.maxAccel>=1.1&&c.maxAccel<=2.1);}
 const c=a.cars[0],old=JSON.stringify(c.traits),gen=c.generation;a.spawn(p.s??0,false,c);assert.equal(c.generation,gen+1);assert.notEqual(JSON.stringify(c.traits),old);
 const snap=b.diagnostics.snapshot(b.cars[0]);assert.deepEqual(snap.traits.speedTendency,b.cars[0].traits.speedTendency);assert.equal(snap.traits.headway,b.cars[0].headway);
}
const h=new Highway(86);h.density=120;h.reset(86,917);const drivers=h.cars.filter(c=>c.profile==='regular'&&!c.truck).sort((a,b)=>a.traits.patience-b.traits.patience),fast=drivers[0],patient=drivers.at(-1);
assert.ok(fast.maxAccel>patient.maxAccel);assert.ok(fast.headway<patient.headway);assert.ok(fast.traits.cooperation<patient.traits.cooperation);
const common={speed:25,desired:35};const f={...fast,...common},p={...patient,...common};assert.ok(h.accelerationFor(f,50,20)>h.accelerationFor(p,50,20));
let choices=[];for(const driver of [fast,patient]){const c={...driver,s:0,lane:1,targetLane:1,offset:LANES[1],speed:20,desired:36,changing:0,cooldown:0,acceleration:0,cruiseLane:1},lead={...c,id:500,s:120,lane:1,targetLane:1,speed:19,offset:LANES[1]},rear={...c,id:501,s:-40,lane:0,targetLane:0,speed:21,offset:LANES[0]},right={...c,id:502,s:5,lane:2,targetLane:2,speed:19,offset:LANES[2]};h.cars=[c,lead,rear,right];h._useLaneIndex=false;h.decide(c,null);choices.push(c.targetLane);}
assert.notEqual(choices[0],choices[1]);console.log({passed:true,seed:917,densities:[28,72,120],headways:[fast.headway,patient.headway],accelerations:[h.accelerationFor(f,50,20),h.accelerationFor(p,50,20)],choices,scope:'controlled fixture, not population calibration'});
