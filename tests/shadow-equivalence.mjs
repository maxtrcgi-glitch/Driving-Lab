// Frozen Stage B physics/input baseline, including complete dynamic state.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Vehicle,DT} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
const [base,out]=process.argv.slice(2);assert.ok(base&&out,'Pass frozen Stage B source and output JSON');
const {DrivingExperience:Baseline}=await import(pathToFileURL(path.resolve(base,'dist/driving-experience.js')));
for(const name of ['controls.js','physics.js','vehicle-spec.js','highway.js','world.js'])assert.deepEqual(fs.readFileSync(`dist/${name}`),fs.readFileSync(path.join(base,'dist',name)));
const snapshot=v=>({vehicle:structuredClone(Object.fromEntries(Object.entries(v).filter(([k,x])=>typeof x!=='function'&&k!=='deformation'))),skin:{damage:v.deformation.damage,revision:v.deformation.revision}});
const restore=(v,s)=>{Object.assign(v,structuredClone(s.vehicle));Object.assign(v.deformation,{vehicle:v,nodes:v.nodes,beams:v.beams,...s.skin});};
const results=[];let samples=0;
for(const kmh of [50,150,200])for(const side of [-1,1])for(const scenario of ['neutral','lane','slide-neutral','slide-positive-input','slide-negative-input']){
 const donor=new Vehicle();donor.reset(0,0,0,kmh/3.6);for(let i=0;i<96;i++)donor.step(DT,{});
 if(scenario.startsWith('slide')){const speed=donor.speed,beta=side*.1745329252;donor.setVelocity(speed*Math.sin(beta),0,speed*Math.cos(beta));for(const n of donor.nodes){n.vx+=-.45*side*(n.z-donor.z);n.vz-= -.45*side*(n.x-donor.x);}donor.syncPose();}
 const saved=snapshot(donor);
 for(const strength of [0,50,100]){
  const a=new Vehicle(),b=new Vehicle(),old=new Baseline(),shadow=new DrivingExperience();restore(a,saved);restore(b,saved);shadow.configureAssist(true,strength);
  let valid=0,reference=0,maxResidual=0;
  for(let i=0;i<240;i++){
   const t=i*DT,raw=scenario==='lane'?(t<.4?.2:t<.8?-.2:0):scenario==='slide-positive-input'?(t<.5?.7*side:0):scenario==='slide-negative-input'?(t<.5?-.7*side:0):0;
   const previous=old.value(raw,a.speed,DT,'touch'),command=shadow.value(raw,b.speed,DT,'touch');assert.equal(command,previous);assert.equal(shadow.correction,0);
   a.step(DT,{steer:previous});b.step(DT,{steer:command});shadow.observe(b,DT);samples++;
   valid+=+shadow.state.valid;reference+=+shadow.reference.valid;maxResidual=Math.max(maxResidual,Math.abs(shadow.state.yawResidual));
   if(i===120)shadow.configureAssist(false,100); // Live request changes must not alter command/history.
  }
  assert.deepEqual(snapshot(a),snapshot(b),'Entire vehicle state unchanged by shadow observers');
  shadow.reset();assert.equal(shadow.command,0);assert.equal(shadow.state.age,0);assert.equal(shadow.reference.valid,false);
  results.push({kmh,side,scenario,strength,validSamples:valid,referenceSamples:reference,maxYawResidualRadS:maxResidual,equivalent:true});
 }
}
const report={baseline:'1e94744114961b13fe085120b432fff17de258c0',pairs:results.length,fixedStepSamples:samples,fullStateEquivalent:true,correction:0,results};
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:undefined}));
