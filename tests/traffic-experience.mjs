import assert from 'node:assert/strict';
import {Highway,LANES} from '../dist/highway.js';
import {performance} from 'node:perf_hooks';
let minGap=Infinity,recycled=0;const recycledNearSameS=[];
function gaps(h){for(let i=0;i<h.cars.length;i++)for(let j=i+1;j<h.cars.length;j++){const a=h.cars[i],b=h.cars[j];if(Math.abs(a.offset-b.offset)>(a.width+b.width)/2+.05)continue;const gap=Math.abs(a.s-b.s)-(a.length+b.length)/2;minGap=Math.min(minGap,gap);assert.ok(gap>0,`NPC overlap ${a.id}/${b.id}: ${gap}`);}}
for(const density of [0,18,28,42,72,120])for(const seed of [1,2,86,917,12345]){
 const h=new Highway(seed);h.density=density;const p=h.reset();assert.equal(h.cars.length,density);
 if(density){const front=h.cars.filter(c=>c.lane===1&&c.s>0).sort((a,b)=>a.s-b.s)[0];const rear=h.cars.filter(c=>c.lane===1&&c.s<0).sort((a,b)=>b.s-a.s)[0];assert.ok(front&&rear);assert.equal(p.speed,front.speed);assert.ok(front.s<=70&&rear.s>=-70);assert.ok(h.cars.some(c=>c.dir===1&&c.lane!==1&&Math.abs(c.s)<25));}
 gaps(h);assert.equal(h.spawnFailures,0);
}
// Variable-speed road-space player isolates traffic from the car's numerical
// test driver. Continuous acceleration, hard deceleration, stop, then 250 km/h.
const timings=[];
for(const density of [28,42,72,120]){
 const h=new Highway(86);h.density=density;h.reset();let s=0,stepMs=0;
 for(let i=0;i<120*30;i++){
  const t=i/30,speed=t<10?28+t*2:t<17?Math.max(0,48-(t-10)*7):t<40?0:t<65?Math.min(70,(t-40)*3):70;
  s+=speed/30/Math.hypot(1,h.gradient(s));const p=h.point(s,LANES[1]);const old=new Map(h.cars.map(c=>[c.id,{s:c.s,x:c.x,z:c.z,generation:c.generation,desired:c.desired,profile:c.profile}]));
  const start=performance.now();h.step(1/30,{...p,vx:Math.sin(p.yaw)*speed,vz:Math.cos(p.yaw)*speed,speed});stepMs+=performance.now()-start;
  assert.equal(h.cars.length,density);assert.ok(h.cars.every(c=>Number.isFinite(c.x+c.z+c.speed+c.yaw)));
  for(const c of h.cars){const before=old.get(c.id);if(c.generation!==before.generation){
   assert.equal(c.generation,before.generation+1);assert.ok(before.s<s-260||before.s>s+1200,'Only out-of-window cars recycled');
   for(const q of [before,c])assert.ok(Math.exp(-((.0017*Math.hypot(q.x-p.x,q.z-p.z))**2))<=.01,'Both ends of recycling must be outside visibility');
   if(Math.abs(c.s-before.s)<=5&&Math.hypot(c.x-before.x,c.z-before.z)>=3&&recycledNearSameS.length<3)recycledNearSameS.push({id:c.id,fromGeneration:before.generation,toGeneration:c.generation,longitudinalDelta:c.s-before.s,worldDelta:Math.hypot(c.x-before.x,c.z-before.z)});
   recycled++;
  }else{assert.equal(c.desired,before.desired);assert.equal(c.profile,before.profile);assert.ok(Math.hypot(c.x-before.x,c.z-before.z)<3,'Continuous NPC motion: '+JSON.stringify({id:c.id,generation:c.generation,before,after:{s:c.s,x:c.x,z:c.z}}));}}
  if(i%10===0)gaps(h);
 }
 assert.equal(h.spawnFailures,0);
 const q=h.point(s,LANES[1]);for(const n of [0,120,18,72,42,120]){h.setDensity(n,s,LANES[1]);assert.equal(h.cars.length,n);gaps(h);}
 timings.push({density,trafficStepMeanMs:stepMs/(120*30)});
}
// Probe the preferred lane rather than assuming the old id-to-lane rule.
const probe=new Highway();probe.cars=[];probe.serial=600;const preferred=probe.spawn(0,true).lane,group=Math.floor(preferred/3)*3;
const partial=new Highway();partial.reset();const blocker=partial.cars[0];partial.cars=Array.from({length:300},(_,i)=>({...blocker,id:i,lane:preferred,targetLane:preferred,offset:LANES[preferred],s:-2300+i*16}));partial.serial=600;
const alternative=partial.spawn(0,true);assert.ok(alternative,'Use another safe lane when one is full');assert.notEqual(alternative.lane,preferred);assert.equal(Math.floor(alternative.lane/3),Math.floor(preferred/3));assert.equal(partial.spawnFailures,0);gaps(partial);
// Fully occupy all three lanes: allocation must fail without inserting overlap.
const full=new Highway();full.reset();full.cars=Array.from({length:900},(_,i)=>{const lane=group+Math.floor(i/300);return {...blocker,id:i,lane,targetLane:lane,offset:LANES[lane],s:-2300+(i%300)*16};});full.serial=600;
assert.equal(full.spawn(0,true),null);assert.equal(full.spawnFailures,1);assert.equal(full.cars.length,900);
console.log({checks:'all density starts / 5 seeds; same-lane front and rear; variable speed / hard brake / stop / 250 kmh; bounded counts; recycling; no body overlap; live density changes; failed allocation',minGapM:minGap,recycled,recycledNearSameS,timings,nodeCPUOnly:true});
