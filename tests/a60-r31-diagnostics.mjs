import assert from 'node:assert/strict';
import {Highway,LANES} from '../dist/highway.js';
import {TrafficDiagnostics} from '../dist/traffic-diagnostics.js';
const h=new Highway(86);h.reset(86,917);h.setDiagnostics(true);
const ego=h.cars.find(c=>c.dir>0&&!c.truck),lead=h.cars.find(c=>c.dir>0&&c!==ego);
h.cars=[ego,lead];
function place(c,s,lane,speed,desired){const p=h.point(s,LANES[lane]);Object.assign(c,{...p,s,lane,targetLane:lane,offset:LANES[lane],speed,desired,dir:1,changing:0,cooldown:0,acceleration:0,crashed:false,vx:Math.sin(p.yaw)*speed,vz:Math.cos(p.yaw)*speed});}
place(ego,0,1,30,40);place(lead,55,1,18,18);ego.cruiseLane=1;lead.cooldown=1000;
for(let i=0;i<12*240;i++){const p=h.point(ego.s-200,16);h.step(1/240,{...p,vx:0,vz:0,speed:0});}
assert.ok(h.diagnostics.counts.PASS_ACCEPTED>0);assert.ok(h.diagnostics.counts.LANE_CHANGE_STARTED>0);assert.ok(h.diagnostics.counts.LANE_CHANGE_COMPLETED>0);
const blocker={...lead,id:999};h.cars=[ego,lead,blocker];place(ego,0,1,30,40);place(lead,55,1,18,18);place(blocker,10,2,28,28);h.decide(ego,{s:-80,offset:LANES[0],forwardSpeed:250/3.6});assert.ok(h.diagnostics.events.some(e=>e.id===ego.id&&e.reason==='player_closing'));assert.ok(h.diagnostics.counts.PASS_REJECTED);
place(ego,0,1,30,40);h.cars=[ego];ego.targetLane=0;ego.changeDuration=4;ego.changing=3.8;ego.aborting=false;h.decide(ego,{s:5,offset:LANES[0],forwardSpeed:0});assert.equal(ego.aborting,true);assert.ok(h.diagnostics.events.some(e=>e.type==='LANE_CHANGE_ABORTED'&&e.reason==='target_threatened'));
const state=h.diagnostics.state(ego);state.lastRejectionReason='old';ego.generation++;assert.equal(h.diagnostics.state(ego).lastRejectionReason,'none');
const d=new TrafficDiagnostics(8);for(let i=0;i<1000;i++)d.event({id:i,generation:0},'PASS_REJECTED','insufficient_front_gap');assert.equal(d.events.length,8);assert.ok(d.states.size<=256);
for(const density of [28,72,120]){const a=new Highway(86),b=new Highway(86);a.density=b.density=density;const start=a.reset(86,917);b.reset(86,917);b.setDiagnostics(true);let pos=start;for(let i=0;i<600;i++){a.step(1/30,{...pos,vx:0,vz:0,speed:0});b.step(1/30,{...pos,vx:0,vz:0,speed:0});}assert.deepEqual(a.cars,b.cars,`determinism ${density}`);assert.ok(b.diagnostics.events.length<=128);assert.equal(b.cars.length,density);}
console.log('R3.1 diagnostics: accepted/completed, actual player rejection, generation reset, bounded buffers and deterministic 28/72/120 PASS');
