import assert from 'node:assert/strict';
import * as THREE from '../dist/three.module.js';
import {buildCar} from '../dist/world.js';
import fs from 'node:fs';
const car=buildCar();car.cockpit.visible=true;car.glass.opacity=0;for(const p of car.cabinParts)p.visible=false;
const camera=new THREE.PerspectiveCamera(60,1112/512,.025,600),eye=car.eye.clone();
for(const yaw of [0,.8,-1.1]){
 car.root.position.set(3,.7,-5);car.root.rotation.y=yaw;car.body.rotation.set(.02,0,-.025);car.root.updateMatrixWorld(true);
 camera.position.copy(eye).applyMatrix4(car.body.matrixWorld);const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.02*.75,yaw,-.025*.45,'YXZ')),forward=new THREE.Vector3(0,-.018,1).applyQuaternion(q);camera.up.set(0,1,0).applyQuaternion(q);camera.lookAt(camera.position.clone().addScaledVector(forward,25));camera.updateMatrixWorld();
 const hits=new THREE.Raycaster(camera.position,forward.normalize(),.025,3).intersectObject(car.root,true).filter(h=>h.object.visible&&h.object.material.opacity!==0);
 assert.equal(hits.length,0,'Opaque car geometry must not block central forward view');
 const wheelCenter=new THREE.Vector3();car.steeringWheel.getWorldPosition(wheelCenter);wheelCenter.project(camera);assert.ok(wheelCenter.y<-.5,'Wheel belongs below driving horizon');
}
const manifest=JSON.parse(fs.readFileSync('dist/manifest.webmanifest','utf8'));assert.equal(manifest.display,'standalone');for(const icon of manifest.icons)assert.ok(fs.existsSync('dist/'+icon.src));
console.log('Cockpit: seated forward view, unobstructed center, steering wheel position, standalone manifest and icons verified.');
