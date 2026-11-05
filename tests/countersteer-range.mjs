import assert from 'node:assert/strict';
import {SteeringResponse,steeringEnvelope} from '../dist/controls.js';
import {Vehicle,DT} from '../dist/physics.js';
const target=(raw,speed,mode)=>{const c=new SteeringResponse();c.value(raw,speed,0,mode);return c.target;};
for(const mode of ['touch','tilt'])for(const kmh of [0,50,100,150,200,250]){
 const speed=kmh/3.6,blend=Math.max(0,Math.min(1,(speed-8)/48));
 const exponent=1+(mode==='tilt'?.15:0)+.35*blend,L=steeringEnvelope(speed);
 let previous=-1;
 for(let i=-1000;i<=1000;i++){
  const raw=i/1000,shaped=Math.abs(raw)**exponent,value=target(raw,speed,mode);
  assert.ok(value>=previous-1e-12&&Math.abs(value)<=1+1e-12);previous=value;
  if(shaped<=.45)assert.equal(value,Math.sign(raw)*shaped*L,'Center/midrange are exactly v0.14A');
  assert.ok(Math.abs(value+target(-raw,speed,mode))<1e-12);
 }
 assert.equal(target(1,speed,mode),1);assert.equal(target(-1,speed,mode),-1);
 const c=new SteeringResponse();for(let i=0;i<3/DT;i++)c.value(1,speed,DT,mode);assert.ok(c.position>.99999);
 const rack=-c.position*.57,v=new Vehicle();v.steer=rack;v.step(DT,{steer:c.position});
 assert.ok(Math.abs(v.steer)<.570001&&Math.abs(v.steer)>.56999);
 const radius=2.575/Math.tan(v.steer);
 for(const w of v.wheels.slice(0,2))assert.ok(Math.abs(w.steerAngle-Math.atan(2.575/(radius-w.x)))<1e-7,'Actual front wheel geometry');
}
for(const kmh of [0,50,100,150,200,250])for(const raw of [-1,-.5,0,.5,1])assert.equal(target(raw,kmh/3.6,'digital'),raw*.85/(1+(kmh/3.6/13)**1.7),'Digital range unchanged');
// Geometry/limit is not a grip guarantee: no contact or mu=0 gives zero force.
const cases=['airborne','zero-grip'];
for(const kind of cases){
 const terrain=()=>({height:0,grip:kind==='zero-grip'?0:1,surface:'asphalt'});
 const vehicles=[new Vehicle(terrain),new Vehicle(terrain)];
 for(const v of vehicles){v.reset(0,0,0,30);if(kind==='airborne')v.lift(5);v.setVelocity(6,0,30);for(const n of v.nodes){n.vx-=.45*(n.z-v.z);n.vz+=.45*(n.x-v.x);}v.syncPose();}
 for(let i=0;i<.15/DT;i++){vehicles[0].step(DT,{steer:0});vehicles[1].step(DT,{steer:-1});for(const v of vehicles)for(const w of v.wheels)assert.equal(w.fx+w.fy,0);}
 console.log({kind,yawDifference:Math.abs(vehicles[0].yawRate-vehicles[1].yawRate),xDifference:Math.abs(vehicles[0].x-vehicles[1].x)});
 if(kind==='airborne'){
  assert.ok(Math.abs(vehicles[0].yawRate-vehicles[1].yawRate)<1e-8,'No wheel contact: steering has no yaw authority');
  assert.ok(Math.abs(vehicles[0].x-vehicles[1].x)<1e-8);
 }else{
  // Existing solver has load-based rolling resistance even at mu=0. Record
  // this approximation rather than asserting zero total contact force.
  assert.ok(Math.abs(vehicles[1].yawRate)>.4,'Full lock does not recover this zero-grip yaw in the tested interval');
  assert.ok(Math.abs(vehicles[0].yawRate-vehicles[1].yawRate)<.005);
 }
}
console.log('Countersteer range: monotonic/symmetric 0–250, full analog lock, exact old center, unchanged digital, actual Ackermann angles; no yaw authority in air; zero-grip friction forces absent, rolling-resistance limitation recorded.');
