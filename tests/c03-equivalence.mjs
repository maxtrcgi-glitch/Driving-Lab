import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Vehicle,DT} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
import {LegacySteeringResponse} from '../dist/steering-legacy.js';
import {predictionInput} from './prediction-scenarios.mjs';
import {vehicleSnapshot,restoreVehicle,experienceSnapshot} from './full-state.mjs';
const [base,out]=process.argv.slice(2);assert.ok(base&&out);
const {DrivingExperience:Baseline}=await import(pathToFileURL(path.resolve(base,'dist/driving-experience.js')));
for(const file of ['physics.js','vehicle-spec.js','vehicle-state.js','steering-reference.js','slip-detector.js','highway.js','world.js','highway-world.js','gr86-model.js'])assert.deepEqual(fs.readFileSync('dist/'+file),fs.readFileSync(path.join(base,'dist',file)),file+' unchanged');
const results=[];let ticks=0;
for(const hz of [30,60,120])for(const side of [-1,1])for(const name of ['straight','delayed-unwind','two-pulse','brake-turn']){
 const donor=new Vehicle();donor.config.abs=name!=='straight';donor.config.tcs=name==='two-pulse';donor.reset(0,0,0,180/3.6);for(let i=0;i<96;i++)donor.step(DT,{});
 const saved=vehicleSnapshot(donor),a=new Vehicle(),b=new Vehicle();restoreVehicle(a,saved);restoreVehicle(b,saved);
 const old=new Baseline(),e=new DrivingExperience();e.processor=new LegacySteeringResponse();e.configurePredictor(true);e.configureAssist(true,100);
 for(let tick=0;tick<720;tick++){
  const c=predictionInput(name,tick*DT,side);
  if(tick%(240/hz)===0){old.value(c.raw,a.speed,0,'touch');e.value(c.raw,b.speed,0,'touch');}
  const x=old.value(c.raw,a.speed,DT,'touch'),y=e.value(c.raw,b.speed,DT,'touch');assert.equal(x,y);assert.equal(e.correction,0);
  a.step(DT,{...c,steer:x});b.step(DT,{...c,steer:y});old.observe(a,DT);e.observe(b,DT);
  assert.equal(a.steer,b.steer);assert.equal(a.absActive,b.absActive);assert.equal(a.tcsActive,b.tcsActive);
  assert.deepEqual(experienceSnapshot(e).state,experienceSnapshot(old).state);assert.deepEqual(experienceSnapshot(e).slip,experienceSnapshot(old).slip);
  if(tick===300)e.configureAssist(false,100);if(tick===400)e.configureAssist(true,0);
  if(tick===500){e.configurePredictor(false);old.resetShadow();e.resetShadow();assert.equal(e.predictor.valid,false);}
  if(tick===600)e.configurePredictor(true);ticks++;
 }
 assert.deepEqual(vehicleSnapshot(a),vehicleSnapshot(b));old.reset();e.reset();assert.equal(e.command,old.command);assert.equal(e.predictor.valid,false);
 results.push({hz,side,name,fullStateEquivalent:true,correction:0});
}
const report={baseline:'b7dc54da1c674a1f40e913a2defe81bfeb9eeadf',legacyProcessorExplicit:true,currentFastResponseNotClaimedEquivalent:true,pairs:results.length,ticksPerSide:ticks,commandsExactlyEquivalent:true,fullStateExactlyEquivalent:true,absTcsIndependent:true,renderCadences:[30,60,120],results};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:undefined}));
