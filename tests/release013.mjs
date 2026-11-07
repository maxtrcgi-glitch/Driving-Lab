import assert from 'node:assert/strict';
import {Highway,MAX_TRAFFIC,LANES} from '../dist/highway.js';
import {Vehicle,DT,tireForce} from '../dist/physics.js';
import {GR86} from '../dist/vehicle-spec.js';
import {buildHighwayWorld} from '../dist/highway-world.js';
let minGap=Infinity,maxInitialRoll=0;
for(const seed of [1,86,917]){
 const h=new Highway(seed);h.density=MAX_TRAFFIC;const p=h.reset();assert.equal(h.cars.length,120);
 assert.ok(h.cars.some(c=>c.dir===1&&c.s<0));assert.ok(h.cars.some(c=>c.dir===1&&c.s>0&&c.s<70));assert.ok(h.cars.some(c=>c.dir===1&&Math.abs(c.s)<25));
 const front=h.cars.filter(c=>c.lane===1&&c.s>0).sort((a,b)=>a.s-b.s)[0],rear=h.cars.filter(c=>c.lane===1&&c.s<0).sort((a,b)=>b.s-a.s)[0];
 assert.ok(Number.isFinite(p.speed)&&p.speed>20&&p.speed<=44,'A60 rolling speed within current driver range');assert.equal(p.speed,front.speed,'Rolling spawn matches its lead');assert.ok(!rear||rear.speed<=p.speed,'No initial fast rear closing');const v=new Vehicle((x,z)=>h.terrain(x,z));v.reset(p.x,p.z,p.yaw,p.speed);
 for(const c of h.cars)assert.ok(Math.abs(c.offset+7.4)>2.8||Math.abs(c.s)>55,'Spawn clearance');
 for(const w of v.wheels)assert.ok(Math.abs(w.omega*GR86.tireRadius-p.speed)<1e-9);
 assert.ok(Math.abs(v.engineOmega-v.wheels[2].omega*GR86.gears[v.gear-1]*GR86.finalDrive)<1e-6);
 for(let i=0;i<240;i++){v.step(DT,{gas:.2,steer:0});maxInitialRoll=Math.max(maxInitialRoll,Math.abs(v.roll));assert.equal(v.brokenBeams,0);}
 assert.ok(maxInitialRoll<.1);
 // A steady road-space driver isolates traffic following and lane changes.
 for(let i=0;i<900;i++){const s=i/30*28,q=h.point(s,LANES[1]);h.step(1/30,{...q,vx:Math.sin(q.yaw)*28,vz:Math.cos(q.yaw)*28,speed:28});
  if(i===0)assert.equal(h.passes,0,'No free overtakes from cars initially behind');
  for(const c of h.cars)for(const d of h.cars){if(d.id<=c.id||Math.abs(c.offset-d.offset)>1.82)continue;const gap=Math.abs(c.s-d.s)-(c.length+d.length)/2;minGap=Math.min(minGap,gap);assert.ok(gap>0,`NPC overlap seed ${seed}`);}
 }
 const graphics=buildHighwayWorld(h);graphics.update(900);graphics.root.traverse(m=>{if(m.isInstancedMesh){assert.ok(m.count<=m.instanceMatrix.count,'Instance capacity');for(let i=0;i<m.count*16;i++)assert.ok(Number.isFinite(m.instanceMatrix.array[i]));}});
}
// Tire bench: zero load, sign symmetry, combined force budget and load sensitivity.
for(const load of [0,500,1500,3500,6500])for(const k of [-.6,-.1,0,.1,.6])for(const a of [-.5,-.1,0,.1,.5]){
 const f=tireForce(load,3300,1,k,a),mirror=tireForce(load,3300,1,-k,-a);
 assert.ok(Number.isFinite(f.fx+f.fy));assert.ok(Math.hypot(f.fx,f.fy)<=f.limit+1e-8);assert.ok(Math.abs(f.fx+mirror.fx)<1e-8&&Math.abs(f.fy+mirror.fy)<1e-8);
}
assert.ok(tireForce(1000,3300,1,1,0).limit/1000>tireForce(6000,3300,1,1,0).limit/6000);
// Split surface is sampled across tire width; straight slope is preserved.
const v=new Vehicle((x,z)=>({height:.03*x+.02*z,grip:x<0?.55:1,surface:x<0?'grass':'asphalt'}));
const n=v.nodes[v.wheels[0].hub];n.x=0;n.z=0;v.refreshContactPlanes();const plane=v.wheels[0].plane;
assert.ok(plane.grip>.55&&plane.grip<1);assert.ok(Math.abs(plane.gx-.03)<1e-9&&Math.abs(plane.gz-.02)<1e-9);assert.ok(Math.abs(plane.height)<1e-9);
console.log({release:'0.13',traffic:120,seeds:3,minBodyGapM:minGap,maxRollingSpawnRollDeg:maxInitialRoll*180/Math.PI,checks:'rolling drivetrain state, nearby traffic, no false passes, dense merges, instance capacity, combined tire sweeps, mixed surfaces, slope preservation'});
