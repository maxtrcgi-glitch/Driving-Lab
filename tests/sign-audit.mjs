import assert from 'node:assert/strict';
import {Vehicle,DT,tireForce} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
const report=[];
for(const sign of [-1,1]){
 const v=new Vehicle();v.reset(0,0,0,50/3.6);for(let i=0;i<96;i++)v.step(DT,{});
 const e=new DrivingExperience();for(let i=0;i<120;i++){v.step(DT,{steer:e.value(sign*.15,v.speed,DT,'touch')});e.observe(v,DT);}
 assert.equal(Math.sign(v.steer),-sign);assert.equal(Math.sign(v.yawRate),-sign);assert.equal(Math.sign(v.yaw),-sign);assert.equal(Math.sign(v.x),-sign);
 assert.ok(v.wheels.slice(0,2).every(w=>Math.sign(w.steerAngle)===-sign));
 const f=tireForce(3000,3000,1,0,sign*.1,true);assert.ok(f.fy*sign<0,'Lateral tire force opposes positive geometric slip');
 report.push({input:sign*.15,rackRad:v.steer,yawRate:v.yawRate,yaw:v.yaw,x:v.x,COMbeta:e.state.beta,alpha:e.state.wheels[0].alphaGeom});
}
assert.ok(Math.abs(report[0].yawRate+report[1].yawRate)<1e-9,'Mirror symmetry');
console.log(JSON.stringify({positiveInput:'negative physical rack/yaw/world x; screen convention differs',positivePhysicalRack:'positive yaw/world x',tireSign:'alpha*Fy < 0',report}));
