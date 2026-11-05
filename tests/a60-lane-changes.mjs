import assert from 'node:assert/strict';
import {Highway,LANES} from '../dist/highway.js';
let queries=0;
for(const seed of [37,917,8123]){const h=new Highway(86);h.density=120;h.reset(86,seed);
 for(const c of h.cars)for(let lane=0;lane<6;lane++){h._useLaneIndex=false;const linear={...h.laneInfo(c,lane,null,{})};h.buildLaneIndex();const indexed={...h.laneInfo(c,lane,null,{})};assert.deepEqual(indexed,linear);queries++;}
}
const h=new Highway(86);h.reset();const c=h.cars.find(x=>x.lane===1);h.cars=[c];Object.assign(c,{s:0,lane:1,targetLane:0,offset:-7.38,startOffset:-7.4,changing:3.6,changeDuration:4,lateralV:.25,lateralA:.2,speed:30,cooldown:0});
const before=c.offset;h.decide(c,{s:-20,offset:LANES[0],forwardSpeed:70});assert.equal(c.aborting,true);assert.equal(c.targetLane,1);assert.equal(c.offset,before);assert.equal(c.startLateralV,.25);assert.equal(c.startLateralA,.2);
let maxStep=0;for(let i=0;i<1200;i++){const p=h.point(c.s-200,16),prev=c.offset;h.step(1/240,{...p,vx:0,vz:0,speed:0});maxStep=Math.max(maxStep,Math.abs(c.offset-prev));assert.ok(Number.isFinite(c.offset+c.speed));}assert.equal(c.lane,1);assert.ok(maxStep<.01);
const far=new Highway(86);far.reset();const ego=far.cars.find(x=>x.lane===1);far.cars=[ego];assert.equal(far.laneInfo(ego,0,{s:ego.s-1000,offset:LANES[0],forwardSpeed:70},{}).rearGap,Infinity);
console.log({passed:true,neighborQueries:queries,earlyAbortC2Boundary:true,maxLateralStep:maxStep,finitePlayerPerceptionM:220});

