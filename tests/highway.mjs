import assert from 'node:assert/strict';
import {Highway,LANES} from '../dist/highway.js';
import {buildHighwayWorld} from '../dist/highway-world.js';
import {Vehicle,DT} from '../dist/physics.js';
const h=new Highway(86);h.reset();
for(let s=-500;s<100000;s+=127)for(const o of LANES){const p=h.point(s,o),q=h.project(p.x,p.z);assert.ok(Math.abs(s-q.s)<1e-6);assert.ok(Math.abs(o-q.offset)<1e-6);assert.equal(h.terrain(p.x,p.z).surface,'asphalt');}
const h2=new Highway(86);h2.reset();assert.deepEqual(h.cars,h2.cars);
const graphics=buildHighwayWorld(h);let meshes=0;graphics.update(0);graphics.root.traverse(o=>{if(o.isMesh){meshes++;assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));}});assert.ok(meshes<150);
for(let s=0;s<100000;s+=500){h.origin=Math.floor(s/2000)*2000;graphics.update(s);assert.equal(graphics.chunks.size,8);assert.equal(graphics.models.size,28);}
// Dense AI runs independently of rendering, no interpenetration during merges.
h.reset();h.setDensity(42,0);let laneChanges=0,minGap=Infinity;
for(let i=0;i<1800;i++){const s=i/30*32,p=h.point(s,-7.4);h.step(1/30,{...p,vx:Math.sin(p.yaw)*32,vz:Math.cos(p.yaw)*32,speed:32});for(const c of h.cars){if(c.changing)laneChanges++;assert.ok(Number.isFinite(c.x+c.z+c.speed));for(const d of h.cars){if(d.id<=c.id||Math.abs(c.offset-d.offset)>1.8)continue;const gap=Math.abs(c.s-d.s)-(c.length+d.length)/2;minGap=Math.min(minGap,gap);assert.ok(gap>0,'Traffic overlap');}}}
assert.ok(laneChanges>0);assert.ok(h.passes>0);
// Dynamic collisions exchange momentum, rather than injecting static-wall impulses.
const v=new Vehicle();v.reset(0,0,0,20);const npc={x:0,z:3,mass:1500,inertia:2600,vx:0,vz:10,yawRate:0};
const momentum=()=>v.nodes.reduce((s,n)=>s+n.mass*n.vz,0)+npc.mass*npc.vz;
const energy=()=>v.nodes.reduce((s,n)=>s+.5*n.mass*(n.vx*n.vx+n.vz*n.vz),0)+.5*npc.mass*(npc.vx*npc.vx+npc.vz*npc.vz)+.5*npc.inertia*npc.yawRate**2;
const before=momentum(),ke=energy();assert.ok(v.collideCircle(0,2.4,1,1.5,npc));assert.ok(Math.abs(momentum()-before)<1e-6);assert.ok(energy()<=ke+1e-5);assert.ok(npc.vz>10);
const r=new Highway();const rv=new Vehicle((x,z)=>r.terrain(x,z));const start=r.point(2200,-7.4);rv.reset(start.x,start.z,start.yaw,20);const oldS=r.project(rv.x,rv.z).s,oldY=r.terrain(rv.x,rv.z).height;r.rebase(rv);assert.ok(Math.abs(r.project(rv.x,rv.z).s-oldS)<1e-6);assert.ok(Math.abs(r.terrain(rv.x,rv.z).height-oldY)<1e-6);
console.log({checks:'100 km projection/streaming, deterministic road, dense merges, dynamic momentum/energy, floating origin',meshes,minGap,passes:h.passes,laneChanges});
