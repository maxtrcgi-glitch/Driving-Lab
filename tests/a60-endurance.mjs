import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Highway,LANES} from '../dist/highway.js';
const h=new Highway(86);h.density=120;h.reset(86,917);
const refs=new Set(h.cars),dt=1/30,seconds=1800;let s=0,minGap=Infinity,recycles=0,maxEmpty=0,empty=0;
for(let tick=0;tick<seconds/dt;tick++){
 s+=55.56*dt/h.metric(s,LANES[1]);const p=h.point(s,LANES[1]);
 h.step(dt,{...p,vx:Math.sin(p.yaw)*55.56,vz:Math.cos(p.yaw)*55.56,speed:55.56});
 assert.equal(h.cars.length,120);let ahead=false;
 for(const c of h.cars){assert.ok(refs.has(c));assert.ok(Number.isFinite(c.s+c.x+c.y+c.z+c.offset+c.speed+c.yaw+c.acceleration));assert.equal(c.crashed,false);if(c.dir>0&&c.s>s&&c.s<s+1000)ahead=true;}
 empty=ahead?0:empty+dt;maxEmpty=Math.max(maxEmpty,empty);
 if(tick%30===0)for(let a=0;a<h.cars.length;a++)for(let b=a+1;b<h.cars.length;b++){const c=h.cars[a],d=h.cars[b];if(Math.abs(c.offset-d.offset)<(c.width+d.width)/2+.03){const gap=Math.abs(c.s-d.s)-(c.length+d.length)/2;minGap=Math.min(minGap,gap);assert.ok(gap>0,'Endurance NPC body overlap');}}
}
assert.equal(h.spawnFailures,0);assert.equal(h.npcContacts,0);assert.equal(h.barrierContacts,0);assert.ok(maxEmpty<10);assert.ok(h.retired>1000);
recycles=h.retired;const distanceM=s;h.reset(86,917);const fresh=new Highway(86);fresh.density=120;fresh.reset(86,917);assert.deepEqual(h.cars,fresh.cars,'Respawn with the same seed must restore the same startup state');
const result={passed:true,simulatedSeconds:seconds,trafficHz:30,density:120,seed:917,distanceM,recycles,minBodyGapM:minGap,maxEmptyAhead1000S:maxEmpty,objectsReused:true,finite:true,respawnSeedMatch:true,scope:'Headless traffic/road model; player collisions, rendering, actual FPS and iPhone not measured'};
fs.mkdirSync('reports/A60',{recursive:true});fs.writeFileSync('reports/A60/endurance.json',JSON.stringify(result,null,2)+'\n');console.log(result);
