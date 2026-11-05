import assert from 'node:assert/strict';
import * as THREE from '../dist/three.module.js';
import {buildCar} from '../dist/world.js';
import {GR86} from '../dist/vehicle-spec.js';
// Exercise the actual screen drawing path, including simulation clock resets.
const text=[],ctx={fillRect(){},beginPath(){},arc(){},stroke(){},fillText(s){text.push(String(s));}};
globalThis.document={createElement(){return {width:0,height:0,getContext(){return ctx;}};}};
const car=buildCar();delete globalThis.document;
car.updateInstruments(72,3500,3,20);assert.ok(text.includes('72'));
car.updateInstruments(10,1000,1,0);assert.ok(text.includes('10'),'Instrument updates immediately after reset');
assert.equal(car.dimensions.length,4.265);assert.equal(car.dimensions.width,1.775);assert.equal(car.dimensions.height,1.310);
assert.equal(car.wheels[1].pivot.position.x-car.wheels[0].pivot.position.x,GR86.frontTrack);
assert.equal(car.wheels[3].pivot.position.x-car.wheels[2].pivot.position.x,GR86.rearTrack);
assert.ok(Math.abs(car.wheels[0].pivot.position.z-car.wheels[2].pivot.position.z-GR86.wheelbase)<1e-10);
let meshes=0,triangles=0;car.root.updateMatrixWorld(true);car.root.traverse(o=>{if(!o.isMesh)return;meshes++;const g=o.geometry;triangles+=(g.index?.count||g.attributes.position.count)/3;assert.ok([...g.attributes.normal.array].every(Number.isFinite));});
assert.ok(meshes<80&&triangles<26000,'Bounded mobile model cost');
const paint=car.deformables.find(p=>p.mesh.material.color.getHex()===0xb0182c).mesh.material;
// All body paint surfaces must clear the wheel opening at each axle.
for(const w of car.wheels){const ray=new THREE.Raycaster(new THREE.Vector3(1.1,.40-.681,w.pivot.position.z),new THREE.Vector3(-1,0,0),0,2.2);const hits=ray.intersectObject(car.body,true).filter(h=>h.object.material===paint);assert.equal(hits.length,0,'Body does not fill wheel opening');}
assert.ok(car.deformables.every(p=>p.base.length===p.mesh.geometry.attributes.position.array.length),'Skin buffers survive mesh consolidation');
console.log(JSON.stringify({carMeshes:meshes,carTriangles:triangles,checks:'reference dimensions, wheel placement, open arches, screen reset, bounded render cost, deformation buffers'}));
