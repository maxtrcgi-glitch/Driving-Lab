import assert from 'node:assert/strict';
import {VehicleStateEstimator,stateReasons} from '../dist/vehicle-state.js';
import {SteeringReferenceEstimator} from '../dist/steering-reference.js';
import {GR86} from '../dist/vehicle-spec.js';
const close=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
function fixture(yaw=0,U=20,V=2){
 const s=Math.sin(yaw),c=Math.cos(yaw),nodes=Array.from({length:4},(_,i)=>({mass:100+i*10,x:i,y:0,z:0,vx:U*s+V*c,vy:0,vz:U*c-V*s}));
 return {yaw,yawRate:0,steer:0,roll:0,pitch:0,damage:0,brokenBeams:0,collisionPulse:0,vx:nodes[0].vx,vz:nodes[0].vz,nodes,
 basis:{forward:[s,0,c],right:[c,0,-s],up:[0,1,0]},wheels:nodes.map((_,i)=>({hub:i,front:i<2,x:i%2?-.75:.75,z:i<2?1.3:-1.3,load:3000,contact:true,plane:{normal:[0,1,0]},steerAngle:0,toe:0,alpha:0,slip:0,fx:0,fy:-100,forceLimit:3000,grip:1,damage:0}))};
}
function warm(s,v,hz=240){for(let i=0;i<hz;i++)s.update(v,1/hz);return s;}
for(const yaw of [0,1,-2])for(const sign of [-1,1]){
 const v=fixture(yaw,20,sign*2),before=JSON.stringify(v),s=warm(new VehicleStateEstimator(),v),r=new SteeringReferenceEstimator();
 assert.equal(s.valid,true);close(s.U,20);close(s.V,sign*2);close(s.beta,Math.atan2(sign*2,20));
 close(s.wheels[0].alphaGeom,s.beta);assert.equal(s.wheels[0].alphaRelaxed,0);close(s.wheels[0].bodyLateralForce,-100);
 r.update(s,v);assert.equal(r.valid,true);assert.equal(Math.sign(r.alignmentRack),sign);assert.equal(Math.sign(r.alignmentInput),-sign);
 assert.equal(JSON.stringify(v),before,'Observers must be read-only');
 // Inverse of actual Ackermann geometry for both front-wheel x signs.
 const rack=sign*.3;
 for(let i=0;i<2;i++){const w=s.wheels[i];w.phi=Math.atan(GR86.wheelbase/(GR86.wheelbase/Math.tan(rack)-w.x))+w.toe;}
 r.update(s,v);close(r.alignmentRack,rack);
}
// World velocity remains straight while body rotates through the yaw wrap.
{
 const v=fixture(0,20,0),s=new VehicleStateEstimator();v.nodes[0].vx=10;
 warm(s,v);close(s.V,1000/460);close(s.chassisV,0);assert.notEqual(s.V,s.chassisV,'True COM includes every mass and differs from chassis');
}
for(const hz of [30,60,120,240]){
 const s=new VehicleStateEstimator();let v;
 for(let i=0;i<hz;i++){v=fixture(3.13+i/hz*.2);v.yaw=Math.atan2(Math.sin(v.yaw),Math.cos(v.yaw));v.yawRate=.2;
  for(const n of v.nodes){n.vx=0;n.vz=-20;}s.update(v,1/hz);}
 close(s.poseRate,.2,1e-8);close(s.betaDot,-.2,1e-8);close(s.betaDotKinematic,-.2,1e-8);close(s.rDot,0);close(s.yawResidual,0,1e-8);
}
for(const [reason,mutate] of [
 [stateReasons.speed,v=>{for(const n of v.nodes)n.vz=-20;}],
 [stateReasons.contact,v=>{v.wheels[0].contact=false;}],
 [stateReasons.damage,v=>{v.damage=.1;}],
 [stateReasons.collision,v=>{v.collisionPulse=.2;}],
 [stateReasons.splitGrip,v=>{v.wheels[0].grip=.5;}],
 [stateReasons.pose,v=>{v.roll=.5;}],
 [stateReasons.nonfinite,v=>{v.nodes[0].vx=NaN;}],
 [stateReasons.nonfinite,v=>{v.vx=NaN;}]
]){const v=fixture(),s=new VehicleStateEstimator(),r=new SteeringReferenceEstimator();warm(s,v);mutate(v);s.update(v,1/240);assert.equal(s.valid,false);assert.ok(s.reasons&reason);r.update(s,v);assert.equal(r.valid,false);assert.equal(r.alignmentRack,null);}
const s=new VehicleStateEstimator(),v=fixture(),r=new SteeringReferenceEstimator();warm(s,v);s.update(v,1);assert.equal(s.reasons,stateReasons.dt);assert.equal(s.previous,false);
warm(s,v);v.basis.forward[0]=NaN;s.update(v,1/240);assert.ok(s.wheels.every(w=>!w.valid));
const slope=fixture();slope.roll=.1;warm(s,slope);assert.equal(s.valid,true);r.update(s,slope);assert.equal(r.valid,false);assert.ok(r.reasons&512);
s.reset();assert.equal(s.age,0);assert.equal(s.previous,false);r.reset();assert.equal(r.alignmentRack,null);
console.log('Shadow estimators: COM frames, mirrored signs, Ackermann inverse, yaw wrap, 30/60/120/240Hz derivatives, read-only state, invalid-state abstention and resets passed.');
