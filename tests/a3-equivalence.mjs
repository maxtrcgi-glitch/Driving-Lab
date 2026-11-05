import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Vehicle,DT} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
import {LegacySteeringResponse} from '../dist/steering-legacy.js';
import {vehicleSnapshot,restoreVehicle} from './full-state.mjs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const [base,out]=process.argv.slice(2);assert.ok(base&&out);
const {SteeringResponse:Original}=await import(pathToFileURL(path.resolve(base,'dist/controls.js')));
for(const file of ['physics.js','vehicle-spec.js','vehicle-state.js','steering-reference.js','slip-detector.js','steering-predictor.js','highway.js','world.js','highway-world.js','gr86-model.js'])assert.deepEqual(fs.readFileSync('dist/'+file),fs.readFileSync(path.join(base,'dist',file)),file+' unchanged');
for(const mode of ['touch','tilt','digital'])for(const speed of [0,50,100,150,200,250]){const a=new Original(),b=new LegacySteeringResponse();for(let i=0;i<720;i++){const raw=i<200?1:i<400?-.8:i<500?.25:0;assert.equal(a.value(raw,speed/3.6,DT,mode),b.value(raw,speed/3.6,DT,mode),'Frozen legacy exact C03/A1');}}
let ticks=0;const cases=[];
for(const hz of [30,60,120])for(const side of [-1,1])for(const tcs of [false,true]){
 const donor=new Vehicle();donor.config.tcs=tcs;donor.config.abs=!tcs;donor.reset(0,0,0,200/3.6);for(let i=0;i<96;i++)donor.step(DT,{});
 const saved=vehicleSnapshot(donor),a=new Vehicle(),b=new Vehicle();restoreVehicle(a,saved);restoreVehicle(b,saved);const off=new DrivingExperience(),shadow=new DrivingExperience();shadow.configurePredictor(true);shadow.configureAssist(true,100);
 for(let tick=0;tick<720;tick++){
  const t=tick*DT,raw=(t<.5?.9:t<1.3?-1:t<1.8?.6:0)*side;
  if(tick%(240/hz)===0){off.value(raw,a.speed,0);shadow.value(raw,b.speed,0);}
  const x=off.value(raw,a.speed,DT),y=shadow.value(raw,b.speed,DT);assert.equal(x,y);assert.equal(shadow.correction,0);
  const pedals={gas:.2,handbrake:t>.3&&t<.55?.1:0,brake:t>2&&t<2.2?.2:0};a.step(DT,{...pedals,steer:x});b.step(DT,{...pedals,steer:y});off.observe(a,DT);shadow.observe(b,DT);
  assert.equal(a.steer,b.steer);assert.equal(a.absActive,b.absActive);assert.equal(a.tcsActive,b.tcsActive);assert.deepEqual(off.state,shadow.state);assert.deepEqual(off.slip,shadow.slip);ticks++;
  if(tick===300)shadow.configureAssist(false,100);if(tick===500)shadow.configureAssist(true,0);
 }
 assert.deepEqual(vehicleSnapshot(a),vehicleSnapshot(b));shadow.reset();assert.equal(shadow.predictor.valid,false);assert.equal(shadow.command,0);cases.push({hz,side,tcs,exact:true});
}
const report={pairs:cases.length,ticksPerSide:ticks,newResponseShadowNoIntervention:true,legacyExactC03:true,physicalModulesUnchanged:true,cases};fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
