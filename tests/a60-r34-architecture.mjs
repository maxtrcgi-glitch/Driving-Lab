// Audit probes document existing architecture. They do not substitute for safety gates.
import assert from 'node:assert/strict';
import {Highway,LANES} from '../dist/highway.js';

const geometry=new Highway(86);
let worstOverestimate={percent:0},worstUnderestimate={percent:0};
const gaps={};
let maxGradeContributionPct=0;
for(const delta of [12,30,120,250]){
 const errors=[];
 for(const lane of [0,1,2])for(let s=0;s<30000;s+=100){
  let arc=0,planar=0,previous=geometry.point(s,LANES[lane]);
  for(let i=1;i<=delta;i++){
   const point=geometry.point(s+i,LANES[lane]);
   planar+=Math.hypot(point.x-previous.x,point.z-previous.z);
   arc+=Math.hypot(point.x-previous.x,point.y-previous.y,point.z-previous.z);
   previous=point;
  }
  maxGradeContributionPct=Math.max(maxGradeContributionPct,100*(arc-planar)/arc);
  const percent=100*(delta-arc)/arc;
  if(percent>worstOverestimate.percent)worstOverestimate={percent,s,lane,delta,arc};
  if(percent<worstUnderestimate.percent)worstUnderestimate={percent,s,lane,delta,arc};
  errors.push(Math.abs(percent));
 }
 errors.sort((a,b)=>a-b);
 gaps[delta]={p95AbsoluteErrorPct:errors[Math.floor(.95*errors.length)],maxAbsoluteErrorPct:errors.at(-1)};
}

function orderRun(density,seed,reverse){
 const road=new Highway(86);
 road.density=density;
 road.reset(86,seed);
 if(reverse)road.cars.reverse();
 const decisions=[];
 let s=0;
 for(let i=0;i<1800;i++){
  const speed=150/3.6;s+=speed/30/road.metric(s,LANES[1]);
  const p=road.point(s,LANES[1]);
  const before=new Map(road.cars.map(c=>[c.id,[c.generation,c.changing]]));
  road.step(1/30,{...p,speed,vx:Math.sin(p.yaw)*speed,vz:Math.cos(p.yaw)*speed});
  const starts=road.cars.filter(c=>{
   const old=before.get(c.id);
   return old&&old[0]===c.generation&&!old[1]&&c.changing;
  }).map(c=>[c.id,c.generation,c.targetLane]).sort((a,b)=>a[0]-b[0]);
  decisions.push(starts);
 }
 assert.equal(decisions.reduce((n,row)=>n+row.length,0),road.laneChanges,'All lane starts must be captured independently of the event ring');
 return {decisions,starts:road.laneChanges,contacts:road.npcContacts,failures:road.spawnFailures};
}
const order=[];
for(const density of [28,72,120]){
 const a=orderRun(density,917,false),same=orderRun(density,917,false),reverse=orderRun(density,917,true);
 assert.deepEqual(a,same,'Same order and seed must remain deterministic');
 const tick=a.decisions.findIndex((x,i)=>JSON.stringify(x)!==JSON.stringify(reverse.decisions[i]));
 order.push({density,firstDifferentDecisionAtS:tick<0?null:(tick+1)/30,firstNormal:tick<0?null:a.decisions[tick],firstReversed:tick<0?null:reverse.decisions[tick],normalStarts:a.starts,reversedStarts:reverse.starts,normalContacts:a.contacts,reversedContacts:reverse.contacts,normalSpawnFailures:a.failures,reversedSpawnFailures:reverse.failures});
}

const h=new Highway(86);h.reset(86,917);
const [a,b]=h.cars.filter(c=>c.dir>0);h.cars=[a,b];
function place(c,s,speed){Object.assign(c,h.point(s,LANES[1]),{s,lane:1,targetLane:1,offset:LANES[1],speed,vx:0,vz:speed,yaw:0,yawRate:0,crashed:false});}
place(a,10,30);place(b,11,5);b.x+=.4;a.vx=2;
assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<(a.length+b.length)/2);
h.crashContacts();
const ordinary={pairChecks:h.pairChecks,npcContacts:h.npcContacts,bothUncrashed:!a.crashed&&!b.crashed};
a.crashed=true;h.crashContacts();
const seededCrash={pairChecks:h.pairChecks,npcContacts:h.npcContacts,bothCrashed:a.crashed&&b.crashed};
assert.ok(seededCrash.pairChecks>ordinary.pairChecks&&seededCrash.npcContacts>ordinary.npcContacts,'Positive-control overlap must register when a participant is already crashed');
console.log(JSON.stringify({roadSvsLaneArc:{gaps,worstOverestimate,worstUnderestimate,maxGradeContributionPct},iterationOrder:order,overlap:{ordinary,seededCrash}},null,2));
