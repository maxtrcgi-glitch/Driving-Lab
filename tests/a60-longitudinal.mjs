import assert from 'node:assert/strict';
import {Highway} from '../dist/highway.js';
const h=new Highway(86);h.density=120;h.reset(86,917);
const c=h.cars.find(c=>!c.truck),v=c.speed,desired=c.desired;
assert.ok(h.accelerationFor(c,Infinity,v)>-2);
assert.ok(h.accelerationFor(c,25,c.speed)<h.accelerationFor(c,100,c.speed));
assert.ok(h.accelerationFor(c,15,0)<=-7);
const free=h.targetSpeed(c);h.density=28;assert.ok(h.targetSpeed(c)>=free);
const same=new Highway(86);same.density=120;same.reset(86,917);h.density=120;assert.deepEqual(h.cars,same.cars);
const id=c.id,profile=c.driverProfile;for(let i=0;i<1200;i++){const p=h.point(0,-7.4);h.step(1/240,{...p,vx:0,vz:0,speed:0});}
assert.equal(c.desired,desired);assert.equal(c.driverProfile,profile);assert.equal(c.id,id);
assert.ok(h.cars.every(x=>Number.isFinite(x.speed+x.acceleration+x.s+x.offset)));
const q=new Highway(86);q.reset();const ego=q.cars.find(x=>x.dir>0),lead=q.cars.find(x=>x!==ego&&x.dir>0);
q.cars=[ego,lead];Object.assign(ego,{s:0,lane:1,targetLane:1,offset:-7.4,speed:30,desired:35,changing:0,cooldown:100,acceleration:0});
Object.assign(lead,{s:9,lane:1,targetLane:1,offset:-7.4,speed:0});
q.decide(ego,null);assert.ok(ego.emergencyBraking);assert.ok(ego.acceleration<=-7);
Object.assign(ego,{targetLane:0,changing:2,changeDuration:4,acceleration:0,lastDecisionAt:-1});q.decide(ego,null);assert.ok(ego.emergencyBraking);assert.ok(ego.acceleration<=-7,'Emergency lead in the source lane must bypass comfort smoothing');
console.log({passed:true,seed:917,stableProfiles:true,frames:1200,emergencyAcceleration:ego.acceleration});

