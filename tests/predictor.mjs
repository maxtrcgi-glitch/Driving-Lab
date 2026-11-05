import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {Vehicle,DT,tireForce} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
import {brushInto} from '../dist/steering-predictor.js';
import {vehicleSnapshot,experienceSnapshot} from './full-state.mjs';
const force={};let probes=0;
for(const load of [0,100,3000,6000])for(const mu of [0,.6,1])for(const alpha of [-.7,-.03,0,.03,.7])for(const k of [-.5,0,.2])for(const front of [true,false]){const actual=tireForce(load,3500,mu,k,alpha,front);brushInto(force,load,3500,mu,k,alpha,front);assert.equal(force.fx,actual.fx);assert.equal(force.fy,actual.fy);assert.equal(force.limit,actual.limit);probes++;}
const v=new Vehicle(),e=new DrivingExperience();v.reset(0,0,0,35);for(let i=0;i<240;i++){e.value(.3,v.speed,DT,'touch');v.step(DT,{steer:e.command,gas:.1});e.observe(v,DT);}
assert.equal(e.predictorEnabled,false);assert.equal(e.predictor.valid,false);
const saved=vehicleSnapshot(v),history=experienceSnapshot(e);e.configurePredictor(true);
for(let i=0;i<30;i++)e.predictor.predict(v,e.state,e.processor);
assert.deepEqual(vehicleSnapshot(v),saved);assert.deepEqual(experienceSnapshot(e),history);assert.equal(e.correction,0);
assert.equal(e.predictor.valid,true);const timings=[];for(let i=0;i<100;i++){const t=performance.now();e.predictor.predict(v,e.state,e.processor);timings.push(performance.now()-t);}timings.sort((a,b)=>a-b);
e.resetShadow();assert.equal(e.predictor.valid,false);assert.equal(e.predictor.decision,0);assert.equal(e.predictorClock,0);
e.predictor.predict(v,e.state,e.processor);assert.equal(e.predictor.valid,false);
e.configurePredictor(false);assert.equal(e.predictor.valid,false);
for(const speed of [0,-10]){v.reset(0,0,0,speed);for(let i=0;i<100;i++){v.step(DT,{});e.observe(v,DT);}e.predictor.predict(v,e.state,e.processor);assert.equal(e.predictor.valid,false);}
v.reset(0,0,0,30);e.reset();for(let i=0;i<96;i++){v.step(DT,{});e.observe(v,DT);}v.damage=.1;e.state.update(v,DT);e.predictor.predict(v,e.state,e.processor);assert.equal(e.predictor.valid,false);
console.log(JSON.stringify({brushProbes:probes,readOnly:true,guards:true,reset:true,nodeWarmCallMs:{median:timings[50],p95:timings[95]},notIPhoneFPS:true}));
// Genuine loss of contact and collision; no injected beta/yaw.
const road=(x,z)=>({height:z>18&&z<32?-.7:0,grip:1,surface:'asphalt'});
const damaged=new Vehicle(road),shadow=new DrivingExperience();shadow.configurePredictor(true);damaged.reset(0,0,0,20);let airborne=0,collided=0;
for(let i=0;i<480;i++){damaged.step(DT,{});shadow.observe(damaged,DT);if(damaged.wheels.some(w=>!w.contact)){assert.equal(shadow.predictor.valid,false);airborne++;}}
damaged.reset(0,0,0,20);shadow.resetShadow();for(let i=0;i<96;i++){damaged.step(DT,{});shadow.observe(damaged,DT);}assert.equal(damaged.collideCircle(0,damaged.z+2.6,.7),true);
for(let i=0;i<120;i++){damaged.step(DT,{});shadow.observe(damaged,DT);if(damaged.damage>.03||damaged.collisionPulse>.05){assert.equal(shadow.predictor.valid,false);collided++;}}
assert.ok(airborne>0&&collided>0);console.log(JSON.stringify({genuineAirborneInvalidTicks:airborne,genuineCollisionInvalidTicks:collided}));
