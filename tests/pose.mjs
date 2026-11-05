import assert from 'node:assert/strict';
import * as THREE from '../dist/three.module.js';
import {Vehicle,DT} from '../dist/physics.js';
import {buildCar} from '../dist/world.js';
const v=new Vehicle(),car=buildCar();v.reset(0,0,.8,15);for(let i=0;i<240;i++)v.step(DT,{gas:.15,steer:.1});
const b=v.basis,m=new THREE.Matrix4().makeBasis(new THREE.Vector3(...b.right),new THREE.Vector3(...b.up),new THREE.Vector3(...b.forward));car.root.position.set(v.x,v.y,v.z);car.root.quaternion.setFromRotationMatrix(m);car.body.rotation.set(0,0,0);
for(let i=0;i<4;i++)car.wheels[i].pivot.position.fromArray(v.wheels[i].local);car.root.updateMatrixWorld(true);
for(let i=0;i<4;i++){const position=new THREE.Vector3();car.wheels[i].pivot.getWorldPosition(position);const n=v.nodes[v.wheels[i].hub];assert.ok(position.distanceTo(new THREE.Vector3(n.x,n.y,n.z))<1e-9,'Rendered hub equals physical node');}
car.cockpit.visible=true;for(const p of car.cabinParts)p.visible=false;car.glass.opacity=0;
const camera=new THREE.PerspectiveCamera(60,1112/512,.025,600),eye=car.eye.clone(),forward=new THREE.Vector3(0,-.018,1).applyQuaternion(car.root.quaternion);camera.position.copy(eye).applyMatrix4(car.body.matrixWorld);camera.up.set(0,1,0).applyQuaternion(car.root.quaternion);camera.lookAt(camera.position.clone().addScaledVector(forward,25));camera.updateMatrixWorld();
assert.equal(new THREE.Raycaster(camera.position,forward.normalize(),.025,3).intersectObject(car.root,true).filter(h=>h.object.visible&&h.object.material.opacity!==0).length,0,'Node-driven cockpit remains unobstructed');
console.log('Node-driven pose: physical hubs, full chassis orientation and cockpit view verified.');
