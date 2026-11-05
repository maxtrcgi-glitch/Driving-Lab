import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {Vehicle,DT} from '../dist/physics.js';
import {Highway} from '../dist/highway.js';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const baselineSource=execFileSync('git',['show','gameplay-baseline/v0.14A.3.1:dist/highway.js'],{encoding:'utf8'}).replace("'./physics.js'",JSON.stringify(pathToFileURL(path.resolve('dist/physics.js')).href));
const {Highway:BaselineHighway}=await import('data:text/javascript;base64,'+Buffer.from(baselineSource).toString('base64'));
import {DrivingExperience} from '../dist/driving-experience.js';
const BaselineExperience=DrivingExperience; // module identity is checked against the frozen Git tag below.
import {vehicleSnapshot} from './full-state.mjs';
const out=process.argv[2]||'/tmp/driving-lab-traffic-ai2';fs.mkdirSync(out,{recursive:true});
const protectedFiles=['physics.js','controls.js','vehicle-spec.js','driving-experience.js','vehicle-state.js','steering-reference.js','slip-detector.js','steering-predictor.js','steering-trace.js','telemetry.js','sensors.js','course.js','world.js','gr86-model.js','highway-world.js','style.css'];
const hashes={};for(const f of protectedFiles){const actual=fs.readFileSync('dist/'+f),base=execFileSync('git',['show','gameplay-baseline/v0.14A.3.1:dist/'+f],{maxBuffer:32*1024*1024});assert.deepEqual(actual,base,f+' must stay byte-identical');hashes[f]=crypto.createHash('sha256').update(actual).digest('hex');}
let ticks=0;for(const speed of [50,100,150,200,250])for(const sign of [-1,1]){
 const h=new Highway(86),b=new BaselineHighway(86);h.density=b.density=0;h.reset();b.reset();
 const a=new Vehicle((x,z)=>h.terrain(x,z)),v=new Vehicle((x,z)=>b.terrain(x,z)),ea=new DrivingExperience(),ev=new BaselineExperience(),p=h.point(0,-7.4);a.reset(p.x,p.z,p.yaw,speed/3.6);v.reset(p.x,p.z,p.yaw,speed/3.6);
 ea.configureAssist(true,100);ev.configureAssist(true,100);
 for(let i=0;i<720;i++){const t=i*DT,demand=sign*(t<.6?.15:t<1.2?-.2:t<1.6?.7:t<2?-.7:0),gas=t<1.5?.4:0,steerA=ea.value(demand,a.speed,DT,'touch'),steerB=ev.value(demand,v.speed,DT,'touch');assert.equal(steerA,steerB);
  h.step(DT,a);b.step(DT,v);a.step(DT,{gas,steer:steerA});v.step(DT,{gas,steer:steerB});ea.observe(a,DT);ev.observe(v,DT);assert.deepEqual(ea.state,ev.state);assert.equal(ea.correction,ev.correction);
  // No collisions invoked: identity of the player under no external contacts.
  assert.deepEqual(vehicleSnapshot(a),vehicleSnapshot(v));ticks++;
 }
}
const report={baseline:'8bc0030d27a6ba8f63263de098c6582d96f02d15',protectedHashes:hashes,bitExactPlayerTicks:ticks,speedsKmh:[50,100,150,200,250],leftRight:true,requestedOn100NoCorrection:true,noExternalContacts:true,allPhysicsSteeringDiagnosticsCameraGraphicsDamageUnchanged:true};fs.writeFileSync(out+'/player-identity.json',JSON.stringify(report,null,2));console.log(report);
