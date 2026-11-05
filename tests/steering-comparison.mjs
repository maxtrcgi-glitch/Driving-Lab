// Reproducible A/B: same finger travel, same flat-road Vehicle dynamics.
// Usage: node tests/steering-comparison.mjs BASELINE_CHECKOUT OUTPUT_DIRECTORY
// Baseline is an immutable checkout of published 0.13, not rewritten logic.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Vehicle,DT} from '../dist/physics.js';
import {SteeringResponse,bindSteeringPad} from '../dist/controls.js';
const [baseline,out]=process.argv.slice(2);assert.ok(baseline&&out,'Provide 0.13 checkout and output directory');
const currentVersion=/version:'([^']+)'/.exec(fs.readFileSync('dist/app.js','utf8'))[1];
const oldPhysics=await import(pathToFileURL(path.resolve(baseline,'dist/physics.js')));
const oldControls=await import(pathToFileURL(path.resolve(baseline,'dist/controls.js')));
assert.equal(fs.readFileSync(path.resolve(baseline,'dist/physics.js'),'utf8'),fs.readFileSync('dist/physics.js','utf8'),'Physics must be unchanged for this comparison');
class Pad extends EventTarget{getBoundingClientRect(){return {width:250};}setPointerCapture(){}fire(type,x){const e=new Event(type,{cancelable:true});e.pointerId=1;e.clientX=x;this.dispatchEvent(e);}}
const scenarios={
 correction:t=>t>=.2&&t<.6?.08:0,
 laneChange:t=>t>=.2&&t<.6?.25:t>=.6&&t<1?-.25:0,
 sharp:t=>t>=.2&&t<.5?.8:0,
 countersteer:t=>t>=.2&&t<.55?.6:t>=.55&&t<.9?-.6:0,
 release:t=>t>=.2&&t<.55?.3:0,
 oscillation:t=>t>=.2&&t<1.4?.12*Math.sin((t-.2)*Math.PI*4):0,
};
const flat=()=>({height:0,grip:1,surface:'asphalt'}),summaries=[],csv=['version,speed_initial_kmh,scenario,t_s,finger_fraction,raw_pad,steering_command,steering_rack_deg,FR_steer_deg,FL_steer_deg,yaw_rate_rad_s,ay_m_s2,sideslip_deg,x_m,z_m,speed_kmh'];
for(const kmh of [50,100,150,200,250])for(const [scenario,fn]of Object.entries(scenarios))for(const version of ['0.13',currentVersion]){
 const v=new (version==='0.13'?oldPhysics.Vehicle:Vehicle)(flat),controller=new SteeringResponse(),pad=new Pad();let raw=0;
 (version==='0.13'?oldControls.bindSteeringPad:bindSteeringPad)(pad,x=>raw=x);pad.fire('pointerdown',0);v.reset(0,0,0,kmh/3.6);
 for(let i=0;i<Math.round(.4/DT);i++)v.step(DT,{});
 const startX=v.x,startZ=v.z,startYaw=v.yaw,startSpeed=v.speed;let peakYaw=0,peakAy=0,peakSlip=0,peakAngle=0,peakCommand=0,response90=null,lastFraction=0,firstTarget=0;
 for(let i=0;i<Math.round(3/DT);i++){
  const t=i*DT,finger=fn(t);pad.fire('pointermove',finger*100);
  const steer=version==='0.13'?raw:controller.value(raw,v.speed,DT,'touch');v.step(DT,{steer});
  const forward=v.vx*Math.sin(v.yaw)+v.vz*Math.cos(v.yaw),side=v.vx*Math.cos(v.yaw)-v.vz*Math.sin(v.yaw),slip=Math.atan2(side,Math.max(.01,forward))*180/Math.PI;
  assert.ok([v.x,v.z,v.yaw,v.yawRate,v.ay,slip,steer].every(Number.isFinite));assert.equal(v.brokenBeams,0,'No spontaneous structural breakage');
  peakYaw=Math.max(peakYaw,Math.abs(v.yawRate));peakAy=Math.max(peakAy,Math.abs(v.ay));peakSlip=Math.max(peakSlip,Math.abs(slip));peakAngle=Math.max(peakAngle,Math.abs(v.steer)*180/Math.PI);peakCommand=Math.max(peakCommand,Math.abs(steer));
  if(finger!==0&&lastFraction===0&&firstTarget===0){firstTarget=version==='0.13'?raw:controller.target;}
  if(response90===null&&firstTarget!==0&&Math.abs(v.steer)>=Math.abs(firstTarget)*.57*.9)response90=Math.max(0,t-.2);
  lastFraction=finger;
  if(i%12===0)csv.push([version,kmh,scenario,t,finger,raw,steer,v.steer*180/Math.PI,v.wheels[0].steerAngle*180/Math.PI,v.wheels[1].steerAngle*180/Math.PI,v.yawRate,v.ay,slip,v.x-startX,v.z-startZ,v.speed*3.6].join(','));
 }
 assert.ok(Math.abs(v.steer)<1e-5,'Rack returned; body is not artificially stabilized');
 summaries.push({version,kmh,scenario,actualStartKmh:startSpeed*3.6,actualEndKmh:v.speed*3.6,peakCommand,peakWheelDeg:peakAngle,peakYawRadS:peakYaw,peakLateralMS2:peakAy,peakSideslipDeg:peakSlip,finalX:v.x-startX,finalZ:v.z-startZ,finalYawDeg:(v.yaw-startYaw)*180/Math.PI,response90_s:response90});
}
for(const kmh of [150,200,250]){const pair=summaries.filter(s=>s.kmh===kmh&&s.scenario==='correction');assert.ok(pair[1].peakWheelDeg<pair[0].peakWheelDeg*.4,'Fine correction angle reduced at high speed');assert.ok(pair[1].peakYawRadS<pair[0].peakYawRadS,'Fine correction yaw reduced');}
const low=summaries.filter(s=>s.kmh===50&&s.scenario==='correction');assert.ok(low[1].peakWheelDeg>low[0].peakWheelDeg*.8,'Low speed remains responsive');
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'steering-comparison.json'),JSON.stringify({baselineCommit:'097aac99685f7a7a3e2846a74b595931daebc500',environment:process.version+' '+process.platform+' '+process.arch,conditions:'flat asphalt, default config, coast, imposed initial speed (250 is numerical robustness, not top-speed claim), 0.4 s settling then 3 s maneuver, dt=1/240; same pad fraction; no artificial speed/yaw forcing',summaries},null,2));fs.writeFileSync(path.join(out,'steering-comparison.csv'),csv.join('\n')+'\n');
console.table(summaries.filter(s=>s.scenario==='correction').map(({version,kmh,peakWheelDeg,peakYawRadS,peakLateralMS2,finalX,response90_s})=>({version,kmh,peakWheelDeg,peakYawRadS,peakLateralMS2,finalX,response90_s})));
console.log('A/B: 60 real Vehicle runs; all finite, no spontaneous broken beams, returned rack; small corrections reduced 150–250 km/h, retained >80% at 50 km/h. Device ergonomics pending.');
