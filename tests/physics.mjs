import assert from 'node:assert/strict';
import {Vehicle,DT} from '../dist/physics.js';
const flat=()=>({height:0,grip:1,surface:'asphalt'});
function run(v,seconds,input){for(let i=0;i<seconds/DT;i++)v.step(DT,input);assert.ok([v.x,v.z,v.y,v.yaw,v.vx,v.vz,v.roll,v.pitch,...v.wheels.map(w=>w.omega)].every(Number.isFinite));return v.state();}
const result={};
let v=new Vehicle(flat);result.rest=run(v,8,{});assert.ok(result.rest.speed<.1,'Stationary car must not accelerate');assert.ok(Math.abs(v.y-.70)<.06,'Suspension equilibrium');
v=new Vehicle(flat);result.accel=run(v,10,{gas:1});assert.ok(result.accel.speed>20,'Acceleration');assert.ok(Math.abs(v.x)<.3,'Straight-line symmetry');assert.ok(Math.abs(v.roll)<.01,'No roll in straight acceleration');
result.brake=run(v,4,{brake:1});assert.ok(result.brake.speed<1,'Braking must stop car');
v=new Vehicle(flat);run(v,4,{gas:1});result.steer=run(v,2,{gas:.35,steer:.3});assert.ok(v.x< -1,'Right input turns toward chase-camera screen-right');assert.ok(Math.abs(v.roll)>.008,'Lateral acceleration creates roll');
v=new Vehicle(flat);result.reverse=run(v,4,{gas:.5,reverse:true});assert.ok(v.z< -2,'Reverse drives backwards');
const circle=(wet)=>{const a=new Vehicle(flat);a.config.wet=wet;run(a,4,{gas:1});return run(a,3,{gas:.3,steer:.5});};result.dry=circle(false);result.wet=circle(true);assert.notDeepEqual(result.dry,result.wet,'Surface grip changes trajectory');
v=new Vehicle(flat);v.reset(0,0,0,20);v.collideCircle(0,2.6,.7);result.impact=v.state();assert.ok(v.deformation.damage>.01,'Collision creates residual deformation');assert.ok(v.vz<20,'Collision impulse reduces closing speed');
v.reset();assert.equal(v.deformation.damage,0,'Reset repairs structure');
const bumpy=(x,z)=>({height:z>10&&z<18?.08*Math.sin((z-10)*Math.PI/2):0,grip:1,surface:'asphalt'});v=new Vehicle(bumpy);result.bumps=run(v,10,{gas:.4});
console.log(JSON.stringify(result,null,2));
