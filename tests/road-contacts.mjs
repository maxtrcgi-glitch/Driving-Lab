// Autonomous numerical driver is offline only; no new in-game assistance.
import assert from 'node:assert/strict';import fs from 'node:fs';
import {Highway,LANES} from '../dist/highway.js';import {Vehicle,DT,clamp} from '../dist/physics.js';
import {CameraRig} from '../dist/camera-rig.js';import {CameraRoad} from '../dist/camera-road.js';import {cameraDefaults} from '../dist/camera-settings.js';import * as T from '../dist/three.module.js';
const rows=[];
for(const [seed,startS,direction,kmh] of [[86,0,1,100],[86,950,1,200],[86,2600,1,250],[917,3700,1,160],[2027,2700,-1,120],[99881,4600,1,200]]){
 const h=new Highway(seed);h.density=0;h.reset(seed);h.origin=Math.floor(startS/2000)*2000;const offset=direction>0?LANES[1]:LANES[4],p=h.point(startS,offset),v=new Vehicle((x,z)=>h.terrain(x,z));v.reset(p.x,p.z,p.yaw+(direction<0?Math.PI:0),kmh/3.6);
 const camera=new T.PerspectiveCamera(60,844/390,.025,1500),rig=new CameraRig(camera,new T.Vector3(.37,.439,-.13),cameraDefaults),preview=new CameraRoad(h);rig.reset(v);
 let maxOffset=0,maxNormalError=0,minContact=4,maxPitch=0,rebases=0,maxHeightError=0;
 for(let i=0;i<15/DT;i++){const q=h.project(v.x,v.z),look=10+v.speed*.55,target=h.point(q.s+direction*look,offset),error=Math.atan2(Math.sin(Math.atan2(target.x-v.x,target.z-v.z)-v.yaw),Math.cos(Math.atan2(target.x-v.x,target.z-v.z)-v.yaw));
  const curvature=h.frame(q.s,offset).curvature*direction,feedForward=-curvature*v.speed*v.speed*1300*(.53/92000-.47/120000)/.57;const steer=clamp(-Math.atan(2*2.575*Math.sin(error)/look)/.57+feedForward,-1,1),gas=clamp(.3+(kmh/3.6-v.speed)*.22,0,.8),brake=clamp((v.speed-kmh/3.6)*.25,0,1);v.step(DT,{steer,gas:brake>.1?0:gas,brake});h.step(DT,v);const shift=h.rebase(v);if(shift){rebases++;preview.rebase(shift);rig.rebase(shift);}preview.step(v,'highway',DT);rig.step(v,DT,preview.out);if(i%4===0){rig.apply(v,4*DT);assert.ok([...camera.position.toArray(),...camera.quaternion.toArray()].every(Number.isFinite));}
  maxOffset=Math.max(maxOffset,Math.abs(q.offset-offset));maxPitch=Math.max(maxPitch,Math.abs(v.pitch));if(i>240)minContact=Math.min(minContact,v.wheels.filter(w=>w.contact).length);
  for(const w of v.wheels){const node=v.nodes[w.hub],wp=h.project(w.plane.x,w.plane.z-shift),f=h.frame(wp.s,wp.offset);maxNormalError=Math.max(maxNormalError,Math.hypot(...w.plane.normal.map((x,j)=>x-f.up[j])));maxHeightError=Math.max(maxHeightError,Math.abs(w.plane.height-h.terrain(w.plane.x,w.plane.z-shift).height));assert.ok(node.y>h.terrain(node.x,node.z).height-.02);}
 }
 console.log({seed,startS,direction,kmh,maxOffset,maxNormalError,maxHeightError,minContact,damage:v.damage,endKmh:v.speed*3.6});// Contact test safety envelope, not an assertion of perfect lane following.
 assert.ok(maxOffset<3,'offline driver leaves safe road envelope');assert.ok(maxNormalError<1e-5);assert.ok(maxHeightError<.00002);assert.equal(minContact,4);assert.equal(v.damage,0);assert.equal(v.brokenBeams,0);
 const endKmh=v.speed*3.6;const start=h.point(startS,offset);v.reset(start.x,start.z,start.yaw,20);preview.reset();rig.reset(v);rig.apply(v,0);assert.ok(camera.position.toArray().every(Number.isFinite));rows.push({seed,startS,direction,startKmh:kmh,endKmh,seconds:15,maxOffsetM:maxOffset,maxPitchDeg:maxPitch*180/Math.PI,minContactsAfter1s:minContact,maxNormalError,maxFootprintHeightErrorM:maxHeightError,rebases,damage:0});
}
fs.writeFileSync('reports/A51/contacts-camera.json',JSON.stringify({rows,offlineDriver:true,realVehicle:true,renderStub:false,GPU:false,iPhone:false},null,2));console.log(rows);
