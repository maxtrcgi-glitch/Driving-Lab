// Same complete physical state, then freely moving identical open-loop inputs.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Vehicle,DT} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
import {SteeringResponse as CurrentProcessor} from '../dist/controls.js';
const [base,out]=process.argv.slice(2);assert.ok(base&&out,'Pass immutable A.1 checkout and output JSON');
const {SteeringResponse}=await import(pathToFileURL(path.resolve(base,'dist/controls.js')));
assert.equal(CurrentProcessor.toString(),SteeringResponse.toString(),'Processor implementation identical to A.1; Stage A added pad diagnostics only');
for(const name of ['physics.js','vehicle-spec.js','highway.js','highway-world.js','world.js'])assert.deepEqual(fs.readFileSync(`dist/${name}`),fs.readFileSync(path.join(base,'dist',name)),`${name} byte-identical`);
// StructuralSkin contains a back-reference to Vehicle/terrain; snapshot its
// scalar cache separately and rebind it to the restored nodes/beams.
const state=v=>({vehicle:structuredClone(Object.fromEntries(Object.entries(v).filter(([k,x])=>typeof x!=='function'&&k!=='deformation'))),skin:{damage:v.deformation.damage,revision:v.deformation.revision}});
const restore=(v,s)=>{Object.assign(v,s.vehicle);Object.assign(v.deformation,{vehicle:v,nodes:v.nodes,beams:v.beams,...s.skin});};
const beta=v=>Math.atan2(v.vx*Math.cos(v.yaw)-v.vz*Math.sin(v.yaw),v.vx*Math.sin(v.yaw)+v.vz*Math.cos(v.yaw));
const results=[];let samples=0;
for(const kmh of [50,150,200])for(const sign of [-1,1])for(const scenario of ['correction','lane','sharp','skid-neutral','skid-counter','skid-late','skid-excess','skid-wrong']){
 const donor=new Vehicle();donor.reset(0,0,0,kmh/3.6);for(let i=0;i<96;i++)donor.step(DT,{});
 if(scenario.startsWith('skid')){const speed=donor.speed,b=sign*10*Math.PI/180;donor.setVelocity(speed*Math.sin(b),0,speed*Math.cos(b));for(const n of donor.nodes){n.vx+=(-.45*sign)*(n.z-donor.z);n.vz-=(-.45*sign)*(n.x-donor.x);}donor.syncPose();}
 const a=new Vehicle(),b=new Vehicle();restore(a,state(donor));restore(b,state(donor));assert.deepEqual(state(a),state(b));
 const old=new SteeringResponse(),sim=new DrivingExperience();let peakBeta=0,peakYaw=0,recovery=null,dwell=0,raw=0;
 for(let i=0;i<720;i++){
  const t=i*DT;
  // Sample input at 60Hz, not per node integration; identical driver timing.
  if(i%4===0){const finger=scenario==='correction'?(t<1?.12:0):scenario==='lane'?(t<.2?0:t<.75?.55:t<1.3?-.55:0):scenario==='sharp'?(t<.5?1:0):scenario==='skid-neutral'?0:scenario==='skid-excess'?(t<1.2?1:0):scenario==='skid-late'?(t<.3?0:t<.9?.7:0):scenario==='skid-wrong'?(t<.6?-.7:0):(t<.6?.7:0);raw=sign*Math.sign(finger)*Math.abs(finger)**1.45;}
  const previous=old.value(raw,a.speed,DT,'touch'),command=sim.value(raw,b.speed,DT,'touch',b);assert.equal(command,previous);assert.equal(sim.correction,0);
  if(scenario==='skid-neutral')assert.equal(command,0);
  if(i===100){const before=sim.command;sim.setMode('simulation');assert.equal(sim.command,before);assert.throws(()=>sim.setMode('balanced'),RangeError);assert.throws(()=>sim.setMode('assisted'),RangeError);}
  a.step(DT,{steer:previous,gas:.1});b.step(DT,{steer:command,gas:.1});samples++;
  assert.ok([b.x,b.y,b.z,b.yaw,b.yawRate,b.steer,b.speed,beta(b),...b.nodes.flatMap(n=>[n.x,n.y,n.z,n.vx,n.vy,n.vz])].every(Number.isFinite),'Free dynamics remain finite');
  assert.equal(b.x,a.x);assert.equal(b.yawRate,a.yawRate);assert.equal(b.steer,a.steer);
  peakBeta=Math.max(peakBeta,Math.abs(beta(b)));peakYaw=Math.max(peakYaw,Math.abs(b.yawRate));
  if(Math.abs(beta(b))<3*Math.PI/180&&Math.abs(b.yawRate)<.07&&b.speed>3)dwell+=DT;else dwell=0;
  if(recovery===null&&dwell>=.5)recovery=t-.5;
 }
 assert.deepEqual(state(a),state(b),'All nodes/wheels/drivetrain/rack/config match, not just centroid');
 results.push({kmh,side:sign,scenario,peakBetaDeg:peakBeta*180/Math.PI,peakYawRadS:peakYaw,recoveredAtS:recovery,lateralOffsetM:b.x,correction:0,equivalent:true});
}
// Verify wrapper equivalence and no event-count-dependent filter advancement.
for(const hz of [30,60,120])for(const source of ['touch','digital','tilt']){
 const a=new SteeringResponse(),b=new DrivingExperience();for(let frame=0;frame<hz*3;frame++){
  const raw=frame<hz?.3:frame<hz*2?-1:0;a.value(raw,200/3.6,0,source);b.value(raw,200/3.6,0,source);
  for(let i=0;i<240/hz;i++){assert.equal(a.value(raw,200/3.6,DT,source),b.value(raw,200/3.6,DT,source));samples++;}
 }
}
const report={baseline:'0ef5b8db80c325e23a11827fe370e8b031bf5c24',pairs:results.length,fixedStepSamples:samples,fullStateEquivalent:true,inputCadencesHz:[30,60,120],results};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:undefined}));
