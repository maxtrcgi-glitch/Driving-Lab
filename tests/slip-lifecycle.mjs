import assert from 'node:assert/strict';
import {Vehicle,DT} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
// Genuine road drop and obstacle impulse; no scripted beta/yaw changes.
const terrain=(x,z)=>({height:z>18&&z<32?-.7:0,grip:1,surface:'asphalt'});
const v=new Vehicle(terrain),e=new DrivingExperience();v.reset(0,0,0,20);let airborneUnknown=0,damageUnknown=0;
for(let i=0;i<480;i++){v.step(DT,{});e.observe(v,DT);if(v.wheels.some(w=>!w.contact)){assert.equal(e.slip.phase,'UNKNOWN');airborneUnknown++;}}
assert.ok(airborneUnknown>0);
v.reset(0,0,0,20);e.resetShadow();for(let i=0;i<96;i++){v.step(DT,{});e.observe(v,DT);}assert.equal(v.collideCircle(0,v.z+2.6,.7),true);e.observe(v,DT);assert.equal(e.slip.phase,'UNKNOWN');
for(let i=0;i<120;i++){v.step(DT,{});e.observe(v,DT);if(v.damage>.03||v.collisionPulse>.05){assert.equal(e.slip.phase,'UNKNOWN');damageUnknown++;}}
assert.ok(damageUnknown>0);v.reset();e.resetShadow();assert.equal(e.slip.phase,'UNKNOWN');assert.equal(e.slip.eventId,0);
v.reset(0,0,0,-10);for(let i=0;i<96;i++){v.step(DT,{});e.observe(v,DT);assert.equal(e.slip.phase,'UNKNOWN');}
console.log(JSON.stringify({airborneUnknownTicks:airborneUnknown,damageOrCollisionUnknownTicks:damageUnknown,reverseUnknown:true,resetClearsEpisode:true}));
