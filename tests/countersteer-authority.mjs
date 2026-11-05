// Additional bench: same requested physical road-wheel command, compensating
// each input curve in the TEST DRIVER. This is not hidden game assistance.
// node tests/countersteer-authority.mjs BASELINE_014A OUTPUT_DIRECTORY
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {Vehicle,DT,clamp} from '../dist/physics.js';
import {SteeringResponse as Current} from '../dist/controls.js';
const [base,out]=process.argv.slice(2);assert.ok(base&&out);
const {SteeringResponse:Previous}=await import(pathToFileURL(path.resolve(base,'dist/controls.js')));
const beta=v=>Math.atan2(v.vx*Math.cos(v.yaw)-v.vz*Math.sin(v.yaw),v.vx*Math.sin(v.yaw)+v.vz*Math.cos(v.yaw));
const results=[],csv=['version,initial_kmh,initial_beta_deg,t_s,requested_command,finger,raw,command,rack_deg,beta_deg,yaw_rate_rad_s,speed_kmh'];
for(const kmh of [100,150,200])for(const angle of [10,20,35])for(const sign of [-1,1])for(const [version,C]of [['0.14A',Previous],['0.14A.1',Current]]){
 const v=new Vehicle(),c=new C(),probe=new C();v.reset(0,0,0,kmh/3.6);for(let i=0;i<.4/DT;i++)v.step(DT,{});
 const b=angle*sign*Math.PI/180,s=v.speed;v.setVelocity(s*Math.sin(b),0,s*Math.cos(b));for(const n of v.nodes){n.vx+=(-.45*sign)*(n.z-v.z);n.vz-=(-.45*sign)*(n.x-v.x);}v.syncPose();let time=null,stable=0,peak=Math.abs(beta(v)),saturation=0;
 for(let i=0;i<5/DT;i++){
  const desired=clamp(-beta(v)/.57+v.yawRate*.3,-1,1);let low=0,high=1;
  probe.value(1,v.speed,0);if(Math.abs(desired)>probe.target)saturation+=DT;
  for(let j=0;j<18;j++){const m=(low+high)/2;probe.value(m,v.speed,0);if(probe.target<Math.abs(desired))low=m;else high=m;}
  const raw=Math.sign(desired)*high,command=c.value(raw,v.speed,DT);v.step(DT,{gas:.1,steer:command});
  assert.ok([v.x,v.z,v.yaw,v.yawRate,beta(v)].every(Number.isFinite));assert.equal(v.brokenBeams,0);peak=Math.max(peak,Math.abs(beta(v)));
  if(v.speed>3&&Math.abs(beta(v))<3*Math.PI/180&&Math.abs(v.yawRate)<.07)stable+=DT;else stable=0;
  if(time===null&&stable>.5)time=i*DT-.5;
  if(i%12===0)csv.push([version,kmh,angle*sign,i*DT,desired,Math.sign(raw)*Math.abs(raw)**(1/1.45),raw,command,v.steer*180/Math.PI,beta(v)*180/Math.PI,v.yawRate,v.speed*3.6].join(','));
 }
 const r={version,kmh,initialBetaDeg:angle*sign,initialYawRate:-.45*sign,peakBetaDeg:peak*180/Math.PI,finalBetaDeg:beta(v)*180/Math.PI,finalYawRate:v.yawRate,recoveredAtS:time,finalSpeedKmh:v.speed*3.6,rangeSaturationS:saturation};results.push(r);
 if(version==='0.14A.1')assert.ok(time!==null,'Within these chosen initial states, requested physical countersteer recovers');
}
for(const sign of [-1,1]){const a=results.find(r=>r.version==='0.14A'&&r.kmh===200&&r.initialBetaDeg===20*sign),b=results.find(r=>r.version==='0.14A.1'&&r.kmh===200&&r.initialBetaDeg===20*sign);assert.equal(a.recoveredAtS,null);assert.ok(b.recoveredAtS<2);}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'countersteer-authority.json'),JSON.stringify({conditions:'Same real Vehicle/dry/default, initial beta and node angular velocity, 5s, gas.1. Test-only driver requests normalized rack -beta/.57+yawRate*.3, inverts each static controller target by 18-step bisection; previous profile saturates. Same PHYSICAL request policy, NOT same finger travel. Never deployed. Recovery beta<3deg/yaw<.07 for .5s, speed>3m/s. Demonstrates available authority, not human ergonomics.',results},null,2));fs.writeFileSync(path.join(out,'countersteer-authority.csv'),csv.join('\n')+'\n');
console.table(results.filter(r=>r.initialBetaDeg>0).map(({version,kmh,initialBetaDeg,recoveredAtS,rangeSaturationS})=>({version,kmh,initialBetaDeg,recoveredAtS,rangeSaturationS})));
console.log('36 same-physical-demand recovery runs, all chosen states recover with A.1; former 200/20deg state still unrecovered after 5s under A. Human device validation pending.');
