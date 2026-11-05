import assert from 'node:assert/strict';
import {Vehicle,DT,tireForce,defaults} from '../dist/physics.js';
const flat=()=>({height:0,grip:1,surface:'asphalt'});
function run(v,seconds,input={},dt=DT){for(let i=0;i<Math.round(seconds/dt);i++){v.step(dt,input);for(const w of v.wheels)assert.ok(Math.hypot(w.fx,w.fy)<=w.forceLimit+1e-6,'Friction budget under combined load');}assert.ok([v.x,v.z,v.y,v.yaw,v.vx,v.vz,v.roll,v.pitch,v.rpm,...v.wheels.map(w=>w.omega)].every(Number.isFinite));return v;}
const sum=(v,front)=>v.wheels.filter(w=>w.front===front).reduce((s,w)=>s+w.load,0);
const steady=new Vehicle(flat);run(steady,10);assert.ok(steady.speed<.01,'No idle creep with clutch open');assert.ok(Math.abs(sum(steady,true)+sum(steady,false)-defaults.mass*9.81)<2);
const staticFront=sum(steady,true),staticRear=sum(steady,false);run(steady,2,{gas:.7});assert.ok(sum(steady,false)>staticRear&&sum(steady,true)<staticFront,'Acceleration loads rear axle');run(steady,.4,{brake:1});assert.ok(sum(steady,true)>staticFront,'Braking loads front axle');
const equivalent=(load)=>tireForce(load,3200,1,.5,0).fx;
assert.ok(equivalent(1600)+equivalent(4800)<equivalent(3200)*2,'Uneven loads reduce total available tire force');assert.ok(tireForce(3200,3200,1,1.5,0).fx<tireForce(3200,3200,1,.13,0).fx,'Deep sliding loses force relative to peak');
const modes={};for(const drive of ['rwd','fwd','awd']){
 const v=new Vehicle(flat);v.config.drive=drive;v.config.tcs=false;v.reset(0,0,0,15);
 let frontTorque=0,rearTorque=0;
 for(let i=0;i<3/DT;i++){v.step(DT,{gas:1,steer:.18});frontTorque+=Math.abs(v.wheels[0].driveTorque+v.wheels[1].driveTorque)*DT;rearTorque+=Math.abs(v.wheels[2].driveTorque+v.wheels[3].driveTorque)*DT;for(const w of v.wheels)assert.ok(Math.hypot(w.fx,w.fy)<=w.forceLimit+1e-6);}
 modes[drive]={yaw:v.yaw,frontTorque,rearTorque,frontSlip:(v.wheels[0].slip+v.wheels[1].slip)/2,rearSlip:(v.wheels[2].slip+v.wheels[3].slip)/2};
}
// Slip at a single endpoint can coincide with an open-clutch shift. Test the
// transmitted torque over the maneuver instead of treating slip as drive torque.
assert.ok(modes.rwd.frontTorque===0&&modes.rwd.rearTorque>500,'RWD drives only the rear axle');
assert.ok(modes.fwd.rearTorque===0&&modes.fwd.frontTorque>500,'FWD drives only the steering axle');
assert.ok(Math.abs(modes.awd.frontTorque-modes.awd.rearTorque)<1e-6&&modes.awd.frontTorque>250,'AWD sends equal total axle torque');
const masses={};for(const mass of [950,1800]){const v=new Vehicle(flat);v.config.mass=mass;v.reset(0,0,0,25);run(v,3,{gas:.7});masses[mass]=v.speed;assert.ok(v.yawInertia>mass,'Yaw inertia derives from distributed node masses');}assert.ok(masses[950]>masses[1800]+1,'Engine-limited acceleration responds to mass');
const convergence=[];for(const dt of [1/120,1/240,1/480,1/960]){const v=new Vehicle(flat);v.reset(0,0,0,12);run(v,3,{gas:.5,steer:.1},dt);convergence.push({x:v.x,z:v.z,speed:v.speed,yaw:v.yaw});}assert.ok(convergence.every(s=>Math.abs(s.yaw-convergence[0].yaw)<.005&&Math.abs(s.speed-convergence[0].speed)<.05),'Substep convergence');
const slopes={};for(const grade of [-.06,0,.06]){const v=new Vehicle((x,z)=>({height:z*grade,grip:1,surface:'asphalt'}));v.reset(0,0,0,15);for(const w of v.wheels)w.groundPrev=w.z*grade;run(v,2,{});slopes[grade]=v.speed;}assert.ok(slopes['-0.06']>slopes[0]+.5&&slopes[0]>slopes['0.06']+.5,'Gravity opposes uphill and assists downhill');
const coast=new Vehicle(flat);coast.reset(0,0,0,20);run(coast,2,{});assert.ok(coast.clutchTorque<0&&coast.wheels[2].driveTorque<0,'Wheels feed engine braking through clutch');
const circle=new Vehicle(flat);circle.reset(0,0,0,12);run(circle,5,{gas:.13,steer:.08});assert.ok(Math.abs(circle.ay-circle.speed*circle.yawRate)<.7,'Steady corner approximately follows a = speed * yaw rate');
console.log(JSON.stringify({modes,engineLimitedSpeedAfter3s:masses,slopes,convergence},null,2));
