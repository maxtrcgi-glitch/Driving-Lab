import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Vehicle,DT} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
import {scenarioNames,driverInput} from './slip-scenarios.mjs';
const [base,out]=process.argv.slice(2);assert.ok(base&&out,'Pass frozen C0.1 source and output JSON');
const {DrivingExperience:Baseline}=await import(pathToFileURL(path.resolve(base,'dist/driving-experience.js')));
for(const name of ['controls.js','physics.js','vehicle-spec.js','highway.js','world.js','highway-world.js','gr86-model.js'])assert.deepEqual(fs.readFileSync(`dist/${name}`),fs.readFileSync(path.join(base,'dist',name)),`${name} unchanged`);
const snapshot=v=>({vehicle:structuredClone(Object.fromEntries(Object.entries(v).filter(([k,x])=>typeof x!=='function'&&k!=='deformation'))),skin:{damage:v.deformation.damage,revision:v.deformation.revision}});
const restore=(v,s)=>{Object.assign(v,structuredClone(s.vehicle));Object.assign(v.deformation,{vehicle:v,nodes:v.nodes,beams:v.beams,...s.skin});};
const results=[];let samples=0;const profile=new Map();
for(const hz of [30,60,120])for(const side of [-1,1])for(const name of scenarioNames){
 const donor=new Vehicle();donor.reset(0,0,0,160/3.6);for(let i=0;i<96;i++)donor.step(DT,{});
 const saved=snapshot(donor),a=new Vehicle(),b=new Vehicle();restore(a,saved);restore(b,saved);
 const old=new Baseline(),e=new DrivingExperience(),phases=[];e.configureAssist(true,100);
 for(let i=0;i<720;i++){
  const c=driverInput(name,i*DT,side);
  if(i%(240/hz)===0){old.value(c.raw,a.speed,0,'touch');e.value(c.raw,b.speed,0,'touch');}
  const previous=old.value(c.raw,a.speed,DT,'touch'),command=e.value(c.raw,b.speed,DT,'touch');assert.equal(command,previous);assert.equal(e.correction,0);
  a.step(DT,{steer:previous,gas:c.gas,handbrake:c.handbrake});b.step(DT,{steer:command,gas:c.gas,handbrake:c.handbrake});old.observe(a,DT);e.observe(b,DT);
  assert.equal(e.state.beta,old.state.beta);assert.equal(e.reference.alignmentRack,old.reference.alignmentRack);phases.push(e.slip.code);samples++;
  if(i===300)e.configureAssist(false,100);if(i===500)e.configureAssist(true,0);
 }
 assert.deepEqual(snapshot(a),snapshot(b));
 const key=side+name;if(profile.has(key))assert.deepEqual(phases,profile.get(key),'Same physical input trace: classifier independent of render cadence');else profile.set(key,phases);
 e.reset();assert.equal(e.command,0);assert.equal(e.slip.phase,'UNKNOWN');assert.equal(e.slip.warning,false);
 results.push({hz,side,name,fullStateEquivalent:true,estimatorReferenceEquivalent:true,correction:0});
}
const report={baseline:'d0430ee1186f3e20112aa6cef4f7b0dcd8017d6f',pairs:results.length,fixedStepSamples:samples,fullStateEquivalent:true,renderCadencesHz:[30,60,120],classificationIdenticalForSameInputTrace:true,results};
fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:undefined}));
