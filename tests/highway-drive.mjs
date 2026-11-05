// Independent numerical driver, never imported by the game.
import assert from 'node:assert/strict';
import {Highway} from '../dist/highway.js';
import {Vehicle,DT,clamp} from '../dist/physics.js';
const h=new Highway(86);h.density=0;h.reset();const v=new Vehicle((x,z)=>h.terrain(x,z)),start=h.point(0,-7.4);v.reset(start.x,start.z,start.yaw,25);v.gear=3;v.engineOmega=4500*Math.PI/30;v.rpm=4500;
let maxOffset=0,maxRoll=0,rebases=0;
for(let i=0;i<100/DT;i++){
 const q=h.project(v.x,v.z),look=10+v.speed*.55,target=h.point(q.s+look,-7.4),error=Math.atan2(Math.sin(Math.atan2(target.x-v.x,target.z-v.z)-v.yaw),Math.cos(Math.atan2(target.x-v.x,target.z-v.z)-v.yaw));
 const steer=clamp(-Math.atan(2*2.575*Math.sin(error)/look)/.57,-1,1),gas=clamp(.3+(32-v.speed)*.22,0,.8),brake=clamp((v.speed-32)*.25,0,1);
 v.step(DT,{gas:brake>.1?0:gas,brake,steer});h.step(DT,v);h.collide(v);if(h.rebase(v))rebases++;maxOffset=Math.max(maxOffset,Math.abs(q.offset+7.4));maxRoll=Math.max(maxRoll,Math.abs(v.roll));assert.ok(Number.isFinite(v.x+v.y+v.z));
}
assert.ok(maxOffset<1);assert.ok(maxRoll<.08);assert.ok(rebases>=1);assert.equal(v.brokenBeams,0);assert.equal(v.damage,0);
console.log({highwayDistanceM:h.distance,maxLaneOffsetM:maxOffset,maxRollDeg:maxRoll*180/Math.PI,rebases,damage:v.damage});
