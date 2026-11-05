// node tests/countersteer-comparison.mjs BASELINE_014A_CHECKOUT OUTPUT_DIR
// Synthetic driver exists only here, never in the shipped game.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {Vehicle,DT,clamp} from '../dist/physics.js';
import {SteeringResponse as Current} from '../dist/controls.js';
const [base,out]=process.argv.slice(2);assert.ok(base&&out);
const {SteeringResponse:Previous}=await import(pathToFileURL(path.resolve(base,'dist/controls.js')));
assert.equal(fs.readFileSync('dist/physics.js','utf8'),fs.readFileSync(path.join(base,'dist/physics.js'),'utf8'));
const beta=v=>Math.atan2(v.vx*Math.cos(v.yaw)-v.vz*Math.sin(v.yaw),v.vx*Math.sin(v.yaw)+v.vz*Math.cos(v.yaw));
const maxima=[],rates=[],recovery=[],traces=['version,initial_kmh,initial_beta_deg,sign,t_s,finger,raw,target,command,rack_deg,FR_deg,FL_deg,beta_deg,yaw_rate_rad_s,ay_m_s2,x_m,z_m,speed_kmh'];
for(const kmh of [0,50,100,150,200,250]){
 for(const [version,C]of [['0.14A',Previous],['0.14A.1',Current]]){
  const c=new C();for(let i=0;i<3/DT;i++)c.value(1,kmh/3.6,DT,'touch');const v=new Vehicle();v.steer=-c.position*.57;v.step(DT,{steer:c.position});
  maxima.push({version,kmh,command:c.position,rackDeg:Math.abs(v.steer)*180/Math.PI,frontMinDeg:Math.min(...v.wheels.slice(0,2).map(w=>Math.abs(w.steerAngle)*180/Math.PI)),frontMaxDeg:Math.max(...v.wheels.slice(0,2).map(w=>Math.abs(w.steerAngle)*180/Math.PI))});
  const r=new C();let time=null,peakRate=0;for(let i=0;i<3/DT;i++)r.value(-1,kmh/3.6,DT,'touch');
  for(let i=0;i<3/DT;i++){const previous=r.position;r.value(1,kmh/3.6,DT,'touch');peakRate=Math.max(peakRate,Math.abs(r.position-previous)/DT);if(time===null&&r.position>=r.target*.9)time=i*DT;}
  rates.push({version,kmh,oppositeLock90s:time,peakCommandRate:peakRate,centerStep90s:null});
 }
 // Matching center demand: identical commands over the entire waveform.
 const a=new Previous(),b=new Current();for(let i=0;i<3/DT;i++){const raw=.55**1.45*Math.sin(i*DT*6);assert.equal(a.value(raw,kmh/3.6,DT,'touch'),b.value(raw,kmh/3.6,DT,'touch'));}
}
for(const kmh of [100,150,200])for(const angle of [10,20,35])for(const sign of [-1,1])for(const [version,C]of [['0.14A',Previous],['0.14A.1',Current]]){
 const v=new Vehicle(),c=new C();v.reset(0,0,0,kmh/3.6);for(let i=0;i<.4/DT;i++)v.step(DT,{});
 const b=angle*sign*Math.PI/180,s=v.speed;v.setVelocity(s*Math.sin(b),0,s*Math.cos(b));for(const n of v.nodes){n.vx+=(-.45*sign)*(n.z-v.z);n.vz-=(-.45*sign)*(n.x-v.x);}v.syncPose();
 let peakBeta=Math.abs(beta(v)),maxYaw=Math.abs(v.yawRate),recoveredAt=null,stable=0,fullDemandFrames=0;
 for(let i=0;i<5/DT;i++){
  const t=i*DT,finger=clamp(2*(-beta(v)/.57+v.yawRate*.3),-1,1),raw=Math.sign(finger)*Math.abs(finger)**1.45;
  if(Math.abs(finger)===1)fullDemandFrames++;
  const steer=c.value(raw,v.speed,DT,'touch');v.step(DT,{gas:.1,steer});
  assert.ok([v.x,v.z,v.yaw,v.yawRate,beta(v)].every(Number.isFinite));assert.equal(v.brokenBeams,0);
  peakBeta=Math.max(peakBeta,Math.abs(beta(v)));maxYaw=Math.max(maxYaw,Math.abs(v.yawRate));
  if(v.speed>3&&Math.abs(beta(v))<3*Math.PI/180&&Math.abs(v.yawRate)<.07)stable+=DT;else stable=0;
  if(recoveredAt===null&&stable>.5)recoveredAt=t-.5;
  if(i%12===0)traces.push([version,kmh,angle,sign,t,finger,raw,c.target,steer,v.steer*180/Math.PI,...v.wheels.slice(0,2).map(w=>w.steerAngle*180/Math.PI),beta(v)*180/Math.PI,v.yawRate,v.ay,v.x,v.z,v.speed*3.6].join(','));
 }
 const result={version,kmh,initialBetaDeg:angle*sign,initialYawRate:-.45*sign,peakBetaDeg:peakBeta*180/Math.PI,peakYawRadS:maxYaw,finalBetaDeg:beta(v)*180/Math.PI,finalYawRate:v.yawRate,finalSpeedKmh:v.speed*3.6,recoveredAtS:recoveredAt,fullDemandSeconds:fullDemandFrames*DT};recovery.push(result);
 if(angle===10)assert.ok(recoveredAt!==null,'Moderate tested perturbation recovers with this test driver');
}
for(const kmh of [150,200])for(const sign of [-1,1]){const a=recovery.find(r=>r.version==='0.14A'&&r.kmh===kmh&&r.initialBetaDeg===10*sign),b=recovery.find(r=>r.version==='0.14A.1'&&r.kmh===kmh&&r.initialBetaDeg===10*sign);assert.ok(b.recoveredAtS<a.recoveredAtS,'Moderate recovery improved');}
fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'countersteer-comparison.json'),JSON.stringify({baselineCommit:'4b88fe85b9dfa81f9252c80923f66ff5ce90ab8e',conditions:'Same real Vehicle (byte-identical physics), dry flat, default config, settle .4s, imposed beta/angular node velocities; 5s simulation at DT1/240, gas.1; gain2 test driver finger=clamp(2*(-beta/.57+yawRate*.3)); pad exponent1.45. Driver is test-only, not runtime assist. Recovery requires beta<3deg/yawRate<.07 for .5s, speed>3m/s. Failure is NOT proof of physical impossibility.',maxima,rates,recovery},null,2));fs.writeFileSync(path.join(out,'countersteer-traces.csv'),traces.join('\n')+'\n');
console.table(maxima);console.table(recovery.filter(r=>r.initialBetaDeg===10).map(({version,kmh,recoveredAtS,peakBetaDeg})=>({version,kmh,recoveredAtS,peakBetaDeg})));
console.log('36 recovery runs, including documented non-recovery/overcorrection cases; exact midrange waveform equality; max lock and opposite-lock timings.');
