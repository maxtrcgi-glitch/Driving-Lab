import assert from 'node:assert/strict';
import {Vehicle,DT} from '../dist/physics.js';
import {terrain} from '../dist/course.js';
let peakRoll=0,peakLoad=0;
for(const ground of [undefined,terrain])for(const speed of [5,15,20]){
 const v=new Vehicle(ground);v.reset(-290,-310,-949*Math.PI/180,speed);
 for(let i=0;i<240*12;i++){
  v.step(DT,{gas:1,steer:.9*Math.sin(i*DT*3)});
  peakRoll=Math.max(peakRoll,Math.abs(v.roll)*180/Math.PI);
  peakLoad=Math.max(peakLoad,...v.wheels.map(w=>w.load));
  assert.ok(Math.abs(v.roll)<15*Math.PI/180,'Rapid steering must not excite the old free carrier mode');
  assert.ok(v.nodes.every(n=>[n.x,n.y,n.z,n.vx,n.vy,n.vz].every(Number.isFinite)));
 }
 assert.equal(v.damage,0);assert.equal(v.brokenBeams,0);
}
// The roof must support a fully inverted car and dissipate sliding energy.
// No constraint holds the body upright: tumbling and recovery remain possible.
const roof=new Vehicle();roof.lift(-.05);const cy=roof.y;
for(const n of roof.nodes){n.x=-n.x;n.y=2*cy-n.y;}roof.syncPose();roof.setVelocity(10,0,0);
let roofContacts=0;
for(let i=0;i<240*6;i++){roof.step(DT,{});roofContacts=Math.max(roofContacts,roof.bodyContactCount);assert.ok(Math.min(...roof.nodes.slice(0,roof.chassisCount).map(n=>n.y))>=.04);}
assert.ok(roofContacts>0,'Roof nodes produce actual chassis-ground contact');
assert.ok(roof.speed<.5,'Body friction must stop the overturned sliding car');
// Pure rigid rotation must produce no artificial carrier damping velocity.
const rigid=new Vehicle();for(const n of rigid.nodes){n.vx=-n.y;n.vy=n.x;}rigid.syncPose();
for(const w of rigid.wheels){const n=rigid.nodes[w.hub],a=rigid.nodes[w.lower],r=rigid.basis.right;const rate=(n.vx-a.vx)*r[0]+(n.vy-a.vy)*r[1]+(n.vz-a.vz)*r[2]+[n.x-a.x,n.y-a.y,n.z-a.z].reduce((s,d,i)=>s+d*rigid.rightRate[i],0);assert.ok(Math.abs(rate)<1e-8,'Carrier damper cannot oppose rigid-body rotation');}
console.log(JSON.stringify({peakRollDeg:peakRoll,peakLoadN:peakLoad,roofContacts,roofFinalSpeedKmh:roof.speed*3.6,checks:'flat/course steering reversals, roof contact, sliding dissipation, rigid rotation invariance'}));
