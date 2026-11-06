import assert from 'node:assert/strict';
import {Highway,LANES} from '../dist/highway.js';
import {createIntent,updateIntent} from '../dist/traffic-intent.js';
const actor={id:1,generation:0,dir:1,s:0,length:4.55,desired:35,changing:0,traits:{patience:.2},intent:createIntent()};
const target={id:2,generation:0,dir:1,s:55,length:4.55,speed:18};const lookup=new Map([[2,target]]);
updateIntent(actor,target,true,0,lookup);assert.equal(actor.intent.state,'CONSIDER_PASS');updateIntent(actor,target,true,2,lookup);assert.equal(actor.intent.state,'WAIT_FOR_GAP');assert.equal(actor.intent.targetId,2);assert.equal(actor.intent.waiting,2);
target.generation++;updateIntent(actor,target,true,3,lookup);assert.equal(actor.intent.abandonReason,'target_unavailable');assert.equal(actor.intent.targetId,null);
for(const patience of [.2,.8]){actor.intent=createIntent();actor.traits.patience=patience;target.generation=0;updateIntent(actor,target,true,0,lookup);updateIntent(actor,target,true,20,lookup);assert.equal(actor.intent.state,patience===.2?'CRUISE':'WAIT_FOR_GAP');}
const h=new Highway(86);h.reset(86,917);h.setDiagnostics(true);const ego=h.cars.find(c=>c.dir>0&&!c.truck),lead=h.cars.find(c=>c.dir>0&&c!==ego);
function place(c,s,lane,speed,desired){const p=h.point(s,LANES[lane]);Object.assign(c,{...p,intent:createIntent(),s,lane,targetLane:lane,offset:LANES[lane],speed,desired,dir:1,changing:0,cooldown:0,acceleration:0,crashed:false,vx:Math.sin(p.yaw)*speed,vz:Math.cos(p.yaw)*speed});}
place(ego,0,1,30,40);place(lead,55,1,18,18);ego.cruiseLane=1;lead.cooldown=1000;h.cars=[ego,lead];
const left={...ego,id:900,intent:createIntent(),s:10,lane:0,targetLane:0,offset:LANES[0]},right={...ego,id:901,intent:createIntent(),s:10,lane:2,targetLane:2,offset:LANES[2]};h.cars.push(left,right);h.decide(ego,null);h.clock=2;h.decide(ego,null);assert.equal(ego.intent.state,'WAIT_FOR_GAP');assert.equal(ego.intent.targetId,lead.id);assert.equal(ego.changing,0);h.cars=[ego,lead];h.decide(ego,null);assert.equal(ego.intent.state,'EXECUTE_PASS');assert.ok(ego.changing>0);
for(let i=0;i<30*240;i++){const p=h.point(ego.s-200,16);h.step(1/240,{...p,vx:0,vz:0,speed:0});}
assert.ok(h.diagnostics.counts.LANE_CHANGE_COMPLETED>0);assert.ok(h.diagnostics.counts.ACTUAL_PASS_COMPLETED>0);assert.equal(h.npcContacts,0);
const old=ego.intent;h.spawn(ego.s,false,ego);assert.notEqual(ego.intent,old);assert.equal(ego.intent.state,'CRUISE');assert.equal(ego.intent.targetId,null);
console.log({passed:true,targetGenerationInvalidation:true,patienceTimeouts:[15.6,26.4],actualPassEvents:h.diagnostics.counts.ACTUAL_PASS_COMPLETED});
place(ego,0,1,30,40);ego.targetLane=0;ego.changing=4;const competitor={...ego,id:999,intent:createIntent(),s:-10,lane:1,targetLane:1,changing:0};competitor.intent.state='WAIT_FOR_GAP';competitor.intent.targetLane=0;h.cars=[ego,competitor];h.buildLaneIndex();assert.equal(h.safeLane(competitor,0,null),false,'Conflicting intent cannot override an existing lane reservation');
