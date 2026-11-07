import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Highway,LANES} from '../dist/highway.js';
const out=process.argv[2]||'/tmp/driving-lab-traffic-ai2';fs.mkdirSync(out,{recursive:true});
function player(h,s=0,speed=28,offset=LANES[1]){const p=h.point(s,offset);return {...p,vx:Math.sin(p.yaw)*speed,vz:Math.cos(p.yaw)*speed,speed};}
function at(h,c,s,lane,speed){const p=h.point(s,LANES[lane]);Object.assign(c,{s,lane,targetLane:lane,offset:LANES[lane],x:p.x,z:p.z,y:p.y,yaw:p.yaw+(c.dir<0?Math.PI:0),speed,desired:32,vx:Math.sin(p.yaw)*speed*c.dir,vz:Math.cos(p.yaw)*speed*c.dir,changing:0,cooldown:0});}
function fixture(){const h=new Highway(86);h.reset();const ego=h.cars.find(c=>c.lane===1),lead=h.cars.find(c=>c.lane===1&&c!==ego),rear=h.cars.find(c=>c.lane===0);h.cars=[ego,lead,rear];at(h,ego,0,1,30);at(h,lead,50,1,17);at(h,rear,-500,0,30);return {h,ego,lead,rear};}
const safety=fixture();safety.h.decide(safety.ego,{s:2000,offset:-7.4,forwardSpeed:30});assert.equal(safety.ego.targetLane,0,'Overtake slower lead');
let maxSideStep=0,minSideAcceleration=Infinity,lastVX=0,maxSideAcceleration=0;
for(let i=0;i<1200;i++){const old=safety.ego.offset;safety.h.step(1/240,player(safety.h,-100,0,16));const vx=(safety.ego.offset-old)*240;maxSideStep=Math.max(maxSideStep,Math.abs(safety.ego.offset-old));maxSideAcceleration=Math.max(maxSideAcceleration,Math.abs(vx-lastVX)*240);lastVX=vx;}
assert.equal(safety.ego.lane,0);assert.ok(maxSideStep<.009);assert.ok(maxSideAcceleration<1.6);
const unsafe=fixture();at(unsafe.h,unsafe.rear,-45,0,48);unsafe.h.decide(unsafe.ego,{s:2000,offset:-7.4,forwardSpeed:30});assert.notEqual(unsafe.ego.targetLane,0,'Reject fast rear catch-up during merge');
// Block both candidate lanes, including a player's faster rear approach.
const u=fixture();at(u.h,u.rear,14,0,28);u.h.decide(u.ego,{s:-30,offset:LANES[2],forwardSpeed:48});assert.equal(u.ego.targetLane,1,'Both adjacent lanes unsafe');
// Current and target reservations prevent reciprocal crossing decisions.
const pair=fixture();at(pair.h,pair.rear,1,0,30);assert.equal(pair.h.safeLane(pair.ego,0,{s:2000,offset:1,forwardSpeed:0}),false);
// Fresh seeds change profiles, speed, intervals and vehicle classes; road fixed.
const conditions=new Set();for(let seed=1;seed<=32;seed++){const a=new Highway(86),b=new Highway(86);a.density=b.density=120;a.reset(86,seed);b.reset(86,seed);assert.deepEqual(a.cars,b.cars);assert.equal(a.center(1300),b.center(1300));conditions.add(JSON.stringify(a.cars.map(c=>[c.s,c.desired,c.truck,c.profile])));}
assert.equal(conditions.size,32);
// 24 held-out combinations, 90s each: stop, accelerate, brake, high speed.
let minGap=Infinity,changes=0,jamSamples=0,samples=0,spawns=0,maxCars=0,minMedianSpeed=Infinity;const fingerprints=new Set(),flows=[];
for(const density of [28,72,120])for(const seed of [37,101,391,719,2027,4099,8123,19261]){
 const h=new Highway(86);h.density=density;h.reset(86,seed);let s=0,stops=0,changeFrames=0;const lastChanges=new Map();
 for(let i=0;i<90*30;i++){
  const t=i/30,v=t<12?28:t<18?Math.max(0,28-(t-12)*5):t<28?0:t<50?Math.min(70,(t-28)*3.5):t<64?70:30;
  s+=v/30/Math.hypot(1,h.gradient(s));h.step(1/30,player(h,s,v));assert.equal(h.cars.length,density);maxCars=Math.max(maxCars,h.cars.length);
  for(const c of h.cars){assert.ok(Number.isFinite(c.x+c.z+c.speed+c.yaw));assert.equal(c.crashed,false,'Normal AI must not hit NPC/barriers');if(c.changing&&!c.aborting){changeFrames++;const last=lastChanges.get(c.id);if(!last||last.generation!==c.generation||last.target!==c.targetLane){if(last&&last.generation===c.generation)assert.ok(h.clock-last.time>=11.9,"No rapid ping-pong lane changes");lastChanges.set(c.id,{generation:c.generation,target:c.targetLane,time:h.clock});}}}
  if(i%10===0){let stopped=0;const speeds=[];for(let a=0;a<h.cars.length;a++){const c=h.cars[a];speeds.push(c.speed);if(c.speed<3)stopped++;for(let b=a+1;b<h.cars.length;b++){const d=h.cars[b];if(Math.abs(c.offset-d.offset)<(c.width+d.width)/2+.03){const gap=Math.abs(c.s-d.s)-(c.length+d.length)/2;minGap=Math.min(minGap,gap);assert.ok(gap>0,`Lane-selection overlap seed=${seed} density=${density} IDs=${c.id}/${d.id}`);}}}
   speeds.sort((a,b)=>a-b);minMedianSpeed=Math.min(minMedianSpeed,speeds[Math.floor(speeds.length/2)]);if(stopped>density*.4)jamSamples++;samples++;stops+=stopped;
  }
 }
 assert.equal(h.spawnFailures,0);assert.equal(h.barrierContacts,0);assert.equal(h.npcContacts,0);changes+=h.laneChanges;spawns+=h.serial;
 fingerprints.add(JSON.stringify(h.cars.map(c=>[c.id,c.s,c.speed])));flows.push({density,seed,laneChanges:h.laneChanges,rejectedChanges:h.rejectedChanges,decisions:h.decisions,stoppedSamples:stops,changingFrames:changeFrames});
}
assert.equal(fingerprints.size,24);assert.ok(changes>0);assert.equal(jamSamples,0,'No persistent global artificial jam in held-out runs');
// Mirror barrier containment including high-speed swept-end tests and trucks.
let wallTrials=0;
for(const dir of [-1,1])for(const truck of [false,true])for(const inner of [false,true])for(const dt of [1/240,1/60,1/30]){
 const h=new Highway(86);h.reset();const c=h.cars.find(c=>c.dir===dir&&c.truck===truck)||h.cars.find(c=>c.dir===dir);h.cars=[c];const side=dir>0?-1:1,p=h.point(500,side*(inner?3.4:11.8)),roadYaw=p.yaw,normalX=Math.cos(roadYaw)*side,normalZ=-Math.sin(roadYaw)*side,sign=inner?-1:1;
 Object.assign(c,{truck,length:truck?6.8:4.55,width:truck?2.3:1.82,mass:truck?4200:1500,inertia:truck?19000:2600,x:p.x,z:p.z,y:p.y,s:500,offset:side*(inner?3.4:11.8),yaw:roadYaw+(dir<0?Math.PI:0)+.25,crashed:true,vx:normalX*sign*65,vz:normalZ*sign*65,yawRate:.8});
 for(let i=0;i<120;i++){h.step(dt,player(h,500,0));const q=h.project(c.x,c.z),extent=Math.abs(Math.cos(c.yaw-Math.atan(h.gradient(q.s))))*c.width*.5+Math.abs(Math.sin(c.yaw-Math.atan(h.gradient(q.s))))*c.length*.5;assert.ok(q.offset*side>=1.85+extent-1e-5);assert.ok(q.offset*side<=13.65-extent+1e-5);assert.ok(Number.isFinite(c.x+c.z+c.speed));}
 assert.ok(h.barrierContacts>0);wallTrials++;
}
// Crash capsules exchange bounded momentum, prevent driving through stopped NPC.
const crash=fixture();crash.h.cars=[crash.ego,crash.lead];at(crash.h,crash.ego,0,1,25);at(crash.h,crash.lead,4,1,0);crash.lead.crashed=true;crash.h.crashContacts();assert.equal(crash.ego.crashed,true);assert.ok(crash.h.npcContacts>0);
// Decision clock <=30Hz independent of physics frequency; stable object count.
for(const dt of [1/30,1/60,1/120,1/240]){const h=new Highway(86);h.density=72;h.reset(86,918);for(let i=0;i<10/dt;i++)h.step(dt,player(h,i*dt*28));assert.ok(h.decisions/72>=299&&h.decisions/72<=301);assert.equal(h.cars.length,72);}
const result={version:'0.14A.3.3',heldoutCombinations:24,secondsEach:90,fixedSeedsMatch:true,distinctStartupSeeds:32,minBodyGapM:minGap,maxSideStepM:maxSideStep,maxSideAccelerationMps2:maxSideAcceleration,laneChanges:changes,globalJamSamples:jamSamples,samples,minMedianSpeedMps:minMedianSpeed,wallTrials,maxCars,normalNPCContacts:0,normalBarrierContacts:0,frameRatesHz:[30,60,120,240],flows,nodeOnly:true,iPhoneQA:false};
fs.writeFileSync(out+'/traffic-validation.json',JSON.stringify(result,null,2));console.log(result);

