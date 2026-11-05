import assert from 'node:assert/strict';
import {TiltSteering,DigitalSteering,steeringDemand,bindHold,bindTap} from '../dist/controls.js';
import * as THREE from '../dist/three.module.js';
import {Vehicle,DT} from '../dist/physics.js';
// Exercise actual event handlers, including release outside the button (capture),
// cancellation and two simultaneous pedal / steering pointers.
class Button extends EventTarget{click(){this.dispatchEvent(new Event('click'));}setPointerCapture(id){this.captured=id;}fire(type,id){const e=new Event(type,{cancelable:true});e.pointerId=id;this.dispatchEvent(e);}}
const actions=new Map(),keys=new Set();let input=0;const update=()=>input=steeringDemand(keys,actions);
const right=new Button(),gas=new Button();bindHold(right,'right',actions,update);bindHold(gas,'gas',actions,update);
for(const release of ['pointerup','pointercancel','lostpointercapture']){right.fire('pointerdown',1);gas.fire('pointerdown',2);assert.equal(input,1);assert.equal(right.captured,1);right.fire(release,1);assert.equal(input,0);assert.equal(actions.get(2),'gas');gas.fire('pointerup',2);}
keys.add('KeyA');assert.equal(steeringDemand(keys,actions),-1);keys.clear();
function touch(button,type,id){const e=new Event(type,{cancelable:true});e.changedTouches=[{identifier:id,clientX:0,clientY:0}];button.dispatchEvent(e);return e;}
assert.ok(touch(right,'touchstart',3).defaultPrevented,'Touchstart must suppress native Safari selection');touch(gas,'touchstart',4);assert.equal(input,1);right.fire('pointercancel',1);assert.equal(input,1,'Touch fallback survives pointer cancellation');touch(right,'touchcancel',3);assert.equal(input,0);assert.equal(actions.get('touch-4'),'gas');touch(gas,'touchend',4);assert.equal(actions.size,0);
const tapButton=new Button();let taps=0;tapButton.addEventListener('click',()=>taps++);bindTap(tapButton);assert.ok(touch(tapButton,'touchstart',5).defaultPrevented);touch(tapButton,'touchend',5);assert.equal(taps,1);touch(tapButton,'touchstart',6);touch(tapButton,'touchcancel',6);touch(tapButton,'touchend',6);assert.equal(taps,1,'Cancelled touch must not activate action button');
const digital=new DigitalSteering();let high=0;for(let i=0;i<60;i++)high=digital.value(1,25,1/60);assert.ok(high>.05&&high<.25,'Digital steering should remain controllable at speed');for(let i=0;i<30;i++)high=digital.value(0,25,1/60);assert.equal(high,0,'Digital release recenters');
const camera=new THREE.PerspectiveCamera(59,1,.1,100);camera.position.set(0,3,-7);camera.lookAt(0,0,4);camera.updateMatrixWorld();
for(const direction of [-1,1]){const v=new Vehicle();v.reset(0,0,0,12);for(let i=0;i<240;i++)v.step(DT,{steer:direction*.2});const projected=new THREE.Vector3(v.x,0,v.z).project(camera);assert.equal(Math.sign(projected.x),direction,'Control direction must match visible screen direction');}
const tilt=new TiltSteering();assert.equal(tilt.sample({x:null,y:9.81,z:0},0,0),false);assert.equal(tilt.calibrate(),false);
// Transform synthetic gravity for identical screen-relative positions in all orientations.
for(const angle of [0,90,180,270,-90]){
 const a=angle*Math.PI/180;
 const sample=(degrees,now)=>{const r=degrees*Math.PI/180,sx=-9.81*Math.sin(r),sy=9.81*Math.cos(r);return tilt.sample({x:sx*Math.cos(a)+sy*Math.sin(a),y:-sx*Math.sin(a)+sy*Math.cos(a),z:0},angle,now);};
 tilt.suspend();sample(4,0);assert.ok(tilt.calibrate());assert.equal(tilt.value(0),0);
 for(let t=16;t<=800;t+=16)sample(24,t);assert.ok(tilt.value(800)>.45,'Right tilt turns right in each screen orientation');
 tilt.invert=true;assert.ok(tilt.value(800)<-.45);tilt.invert=false;
 for(let t=816;t<=1600;t+=16)sample(4,t);assert.equal(tilt.value(1600),0,'Returning phone to neutral recenters steering');assert.equal(tilt.value(2200),0,'Stale sensor data must not hold steering');
 tilt.suspend();assert.equal(tilt.value(1600),0);
}
console.log('Controls: pointer release, multi-touch, visible direction, sensor axes, calibration, neutral, inversion and stale-data checks passed.');
