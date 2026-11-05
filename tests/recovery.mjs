import assert from 'node:assert/strict';
import {Vehicle,DT,clamp} from '../dist/physics.js';
import {GR86} from '../dist/vehicle-spec.js';
const beta=v=>Math.atan2(v.vx*Math.cos(v.yaw)-v.vz*Math.sin(v.yaw),v.vx*Math.sin(v.yaw)+v.vz*Math.cos(v.yaw));
// TCS limits driven-wheel spin; it is not a yaw stability controller.
// Keep these maneuvers below ~0.7g requested lateral acceleration. Previous
// cases demanded >3g at 25 m/s, and their old pass relied on a rear grip bonus.
let worst=0;for(const speed of [10,15,20,25])for(const demand of [.1,.18,.3]){const steer=Math.min(demand,7*GR86.wheelbase/(speed*speed*.57)),v=new Vehicle();v.config.tcs=true;v.reset(0,0,0,speed);let maximum=0;for(let i=0;i<720;i++){v.step(DT,{gas:1,steer});maximum=Math.max(maximum,Math.abs(beta(v)));}assert.ok(maximum<.15,'Within-budget TCS maneuvers remain stable');worst=Math.max(worst,maximum);}
const spin={};for(const tcs of [true,false]){const v=new Vehicle();v.config.tcs=tcs;v.config.wet=true;v.reset(0,0,0,10);let maximum=0;for(let i=0;i<720;i++){v.step(DT,{gas:1,steer:.08});maximum=Math.max(maximum,...v.wheels.slice(2).map(w=>w.slip));}spin[tcs]=maximum;}assert.ok(spin.true<.2&&spin.false>spin.true*3,'TCS physically arrests rear wheel spin on wet surface');
const v=new Vehicle();v.config.tcs=false;v.reset(0,0,0,15);v.setVelocity(4,0,15);for(const n of v.nodes){n.vx+=-.45*(n.z-v.z);n.vz-= -.45*(n.x-v.x);}v.syncPose();const initial=beta(v);for(let i=0;i<720;i++){
 // Test driver only: countersteer and reduced throttle, not game assistance.
 v.step(DT,{gas:.1,steer:clamp(-beta(v)/.57+v.yawRate*.3,-1,1)});
}
assert.ok(Math.abs(beta(v))<.02&&Math.abs(v.yawRate)<.05,'Node vehicle recovers with countersteer and reduced throttle');
console.log(JSON.stringify({maximumSideslipDegrees:worst*180/Math.PI,spin,recoveryInitialDegrees:initial*180/Math.PI,recoveryEndDegrees:beta(v)*180/Math.PI}));
