import assert from 'node:assert/strict';
import {PerspectiveCamera} from '../dist/three.module.js';
import {TrafficDiagnostics} from '../dist/traffic-diagnostics.js';

const d=new TrafficDiagnostics();
const camera=new PerspectiveCamera(60,2,.1,400);
camera.updateMatrixWorld();
function add(id,x,y,z,roadS=100,reason='slower_leader'){
 const car={id,generation:0,x,y,z,s:roadS,changing:1};
 d.startManeuver(car,0,reason);
 return car;
}
const center=add(1,0,0,-40,100,'cruising_lane');
add(2,60,0,-40); // Within the road window, outside horizontal FOV.
add(3,0,30,-40); // Outside vertical FOV.
add(4,0,0,40); // Behind the active camera.
add(5,0,0,-450); // Beyond the far plane.
const brief=add(6,0,0,-40,260);
for(let i=0;i<=6;i++){
 if(i===2)brief.x=100;
 d.sampleView(i/10,camera);
}
assert.equal(d.counts.LANE_CHANGE_STARTED,6);
assert.equal(d.counts.START_AHEAD_250,5);
assert.equal(d.counts.FRUSTUM_SEEN,2);
assert.equal(d.counts.FRUSTUM_SUSTAINED,1);
assert.equal(d.counts.FRUSTUM_RETURN_SUSTAINED,1);
assert.equal(d.counts.FRUSTUM_NEAR_SUSTAINED,1);
center.generation++;
d.sampleView(.7,camera);
assert.equal(d.maneuvers.has(center.id),false);
const interrupted=add(7,0,0,-40);
d.sampleView(.8,camera);d.sampleView(2,camera);d.sampleView(2.1,camera);
assert.equal(d.counts.FRUSTUM_SUSTAINED,1,'Sampling gaps cannot count as sustained exposure');
d.endManeuver(interrupted);
const wide=add(8,35,0,-40);
camera.aspect=1;camera.updateProjectionMatrix();d.sampleView(2.2,camera);
assert.equal(d.maneuvers.get(wide.id).seen,false);
camera.aspect=2;camera.updateProjectionMatrix();d.sampleView(2.3,camera);
assert.equal(d.maneuvers.get(wide.id).seen,true);
const behind=add(9,0,0,40);
camera.rotation.y=Math.PI;camera.updateMatrixWorld();d.sampleView(2.4,camera);
assert.equal(d.maneuvers.get(behind.id).seen,true);
console.log('Frustum vs road-space, horizontal/vertical FOV, camera orientation, dwell and recycling verified.');

const far=new TrafficDiagnostics();
const straight=new PerspectiveCamera(60,2,.1,400);straight.updateMatrixWorld();
far.startManeuver({id:10,generation:0,x:0,y:0,z:-350,s:350,changing:1},0,'slower_leader');
for(let i=0;i<=6;i++)far.sampleView(i/10,straight);
assert.equal(far.counts.FRUSTUM_SUSTAINED,1);
assert.equal(far.counts.FRUSTUM_NEAR_SUSTAINED??0,0);
