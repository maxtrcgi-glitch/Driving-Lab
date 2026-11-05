import assert from 'node:assert/strict';
import {Vehicle,DT} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
import {driverInput} from './slip-scenarios.mjs';
const runs=[];
for(const side of [-1,1]){
 const v=new Vehicle(),e=new DrivingExperience();v.reset(0,0,0,120/3.6);const phases=[];
 for(let i=0;i<720;i++){
  const c=driverInput('rear-brake',i*DT,side);v.step(DT,{steer:e.value(c.raw,v.speed,DT,'touch'),gas:c.gas,handbrake:c.handbrake});
  const before=JSON.stringify([v.nodes,v.wheels,v.yaw,v.yawRate,v.config]);e.observe(v,DT);assert.equal(JSON.stringify([v.nodes,v.wheels,v.yaw,v.yawRate,v.config]),before);
  phases.push(e.slip.phase);assert.equal(e.correction,0);if(!e.state.valid)assert.equal(e.slip.phase,'UNKNOWN');
 }
 assert.ok(phases.includes('UNSTABLE_SLIDE'));assert.ok(phases.includes('NORMAL'));runs.push(phases);
 for(const failure of ['contact','damage','nonfinite','reset']){
  v.reset(0,0,0,20);e.resetShadow();for(let i=0;i<96;i++){v.step(DT,{});e.observe(v,DT);}
  if(failure==='contact')v.wheels[2].contact=false;
  if(failure==='damage')v.damage=.1;
  if(failure==='nonfinite')v.nodes[0].vx=NaN;
  if(failure==='reset')e.resetShadow();else e.observe(v,DT);
  assert.equal(e.slip.phase,'UNKNOWN');assert.equal(e.slip.warning,false);assert.equal(e.slip.eventSide,0);
 }
}
assert.deepEqual(runs[0],runs[1]);
// A large yaw on a healthy gentle turn is not itself a slide.
const v=new Vehicle(),e=new DrivingExperience();v.reset(0,0,0,60/3.6);for(let i=0;i<720;i++){v.step(DT,{steer:e.value(.1,v.speed,DT,'touch'),gas:.12});e.observe(v,DT);assert.notEqual(e.slip.phase,'UNSTABLE_SLIDE');}
assert.equal(e.slip.phase,'NORMAL');
console.log('Slip detector contract: real mirrored trajectories, sustained turn, zero intervention/read-only vehicle, rear contact/damage/nonfinite/reset UNKNOWN passed.');
