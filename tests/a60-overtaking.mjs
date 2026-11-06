import assert from 'node:assert/strict';
import {Highway,LANES} from '../dist/highway.js';
const h=new Highway(86);h.reset(86,917);
const ego=h.cars.find(c=>c.dir>0&&!c.truck),lead=h.cars.find(c=>c.dir>0&&c!==ego);
h.cars=[ego,lead];
function place(c,s,lane,speed,desired){const p=h.point(s,LANES[lane]);Object.assign(c,{...p,s,lane,targetLane:lane,offset:LANES[lane],speed,desired,dir:1,changing:0,cooldown:0,acceleration:0,crashed:false,vx:Math.sin(p.yaw)*speed,vz:Math.cos(p.yaw)*speed});}
place(ego,0,1,30,40);place(lead,55,1,18,18);ego.cruiseLane=1;lead.cooldown=1000;
let completedLaneChangeAt=null,passedAt=null,maxLateralStep=0;
for(let i=0;i<30*240;i++){
 const p=h.point(ego.s-200,16),offset=ego.offset;
 h.step(1/240,{...p,vx:0,vz:0,speed:0});
 maxLateralStep=Math.max(maxLateralStep,Math.abs(ego.offset-offset));
 assert.ok(Number.isFinite(ego.s+ego.offset+ego.speed+lead.s));
 if(Math.abs(ego.offset-lead.offset)<(ego.width+lead.width)/2+.03)assert.ok(Math.abs(ego.s-lead.s)>(ego.length+lead.length)/2);
 if(!ego.changing&&ego.lane===0&&completedLaneChangeAt===null)completedLaneChangeAt=h.clock;
 if(completedLaneChangeAt!==null&&ego.s>lead.s+(ego.length+lead.length)/2+5&&passedAt===null)passedAt=h.clock;
}
assert.notEqual(completedLaneChangeAt,null,'Must finish a lateral maneuver');
assert.notEqual(passedAt,null,'Must actually pass the slower NPC, not only start changing lane');
assert.ok(maxLateralStep<.012);assert.equal(h.npcContacts,0);assert.equal(h.barrierContacts,0);
// A 250km/h rear approach blocks the passing lane; right lane is also occupied.
const blocker={...lead,id:999};h.cars=[ego,lead,blocker];place(ego,0,1,30,40);place(lead,55,1,18,18);place(blocker,10,2,28,28);
h.decide(ego,{s:-80,offset:LANES[0],forwardSpeed:250/3.6});assert.equal(ego.targetLane,1);

// Adjacent rear NPC must be able to accept a merge without more than comfortable braking.
const rear={...ego,id:1001,speed:35,desired:40,maxAccel:1.5,headway:1.45,comfortableBrake:3};
const info={gap:Infinity,leadSpeed:30,rearGap:75,rearSpeed:35,rear};
assert.ok(h.accelerationFor(rear,75,30)>-2.5);assert.ok(h.laneSafe(ego,info));
assert.equal(h.laneSafe(ego,{...info,rearGap:35}),false);
// Imminent source-lane stopping distance also bypasses comfort during a pass.
place(ego,0,1,40,43);place(lead,70,1,20,20);h.cars=[ego,lead];ego.targetLane=0;ego.changing=2;ego.changeDuration=4;h.decide(ego,null);assert.ok(ego.emergencyBraking);assert.ok(ego.acceleration<=-7);
// A pooled object represents a new logical driver only when generation changes.
const a=new Highway(86),b=new Highway(86);a.reset(86,917);b.reset(86,917);
const first=a.cars.find(c=>c.dir>0),other=b.cars.find(c=>c.id===first.id),oldDesired=first.desired,oldGeneration=first.generation;
a.spawn(0,false,first);b.spawn(0,false,other);
assert.equal(a.cars.find(c=>c.id===first.id),first,'Reuse the existing object');assert.equal(first.generation,oldGeneration+1);assert.notEqual(first.desired,oldDesired);assert.deepEqual(first,other,'Same seed/generation must reproduce the new driver');
console.log({passed:true,completedLaneChangeAt,passedAt,maxLateralStep,fastPlayerKmh:250,recycledDriverRefresh:true});
