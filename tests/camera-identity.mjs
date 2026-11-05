import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {Vehicle,DT} from '../dist/physics.js';
import {DrivingExperience} from '../dist/driving-experience.js';
import {CameraRig} from '../dist/camera-rig.js';
import {CameraRoad} from '../dist/camera-road.js';
import {cameraDefaults} from '../dist/camera-settings.js';
import {Highway} from '../dist/highway.js';
import * as T from '../dist/three.module.js';
import {vehicleSnapshot} from './full-state.mjs';
const out=process.argv[2]||'/tmp/driving-lab-camera';fs.mkdirSync(out,{recursive:true});
const protectedFiles=['controls.js','vehicle-spec.js','driving-experience.js','vehicle-state.js','steering-reference.js','slip-detector.js','steering-predictor.js','steering-trace.js','telemetry.js','sensors.js','course.js','world.js','gr86-model.js','highway-world.js','highway.js','traffic-trace.js','three.module.js','three.core.js'];
const hashes={};for(const file of protectedFiles){const actual=fs.readFileSync('dist/'+file),baseline=execFileSync('git',['show','gameplay-baseline/v0.14A.3.3:dist/'+file],{maxBuffer:32*1024*1024});assert.deepEqual(actual,baseline,file+' protected source');hashes[file]=crypto.createHash('sha256').update(actual).digest('hex');}
let ticks=0;for(const speed of [50,100,150,200,250])for(const direction of [-1,1]){const a=new Vehicle(),b=new Vehicle(),ea=new DrivingExperience(),eb=new DrivingExperience(),hw=new Highway(86);a.reset(0,0,0,speed/3.6);b.reset(0,0,0,speed/3.6);const r=new CameraRig(new T.PerspectiveCamera(),new T.Vector3(.37,.439,-.13),{...cameraDefaults,inertia:true,intensity:100,drift:true,dynamicFov:6}),road=new CameraRoad(hw);r.reset(a);ea.configureAssist(true,100);eb.configureAssist(true,100);
 for(let i=0;i<480;i++){const t=i*DT,demand=direction*(t<.4?.07:t<.8?.6:t<1.2?-.7:0),gas=t<1?.8:0,sa=ea.value(demand,a.speed,DT,'touch'),sb=eb.value(demand,b.speed,DT,'touch');assert.equal(sa,sb);a.step(DT,{gas,steer:sa});b.step(DT,{gas,steer:sb});ea.observe(a,DT);eb.observe(b,DT);road.step(a,'pad',DT);r.step(a,DT,road.out);if(i%4===0)r.apply(a,DT*4);if(i===240){r.setSettings({...r.settings,mode:0});}if(i===360){r.resume(a);road.reset();}assert.deepEqual(vehicleSnapshot(a),vehicleSnapshot(b));assert.deepEqual(ea.state,eb.state);assert.equal(ea.correction,0);assert.equal(eb.correction,0);ticks++;}
}
const report={baseline:'eff802fb141cef9294dfabe0eaf4dfff4b751a7c',physicsException:'A.4.1 timed shift/launch handoff: tests/launch-validation.mjs guards exact source diff and moving legacy identity',protectedHashes:hashes,bitExactFullStateTicks:ticks,speeds:[50,100,150,200,250],leftRight:true,ABS_TCS_same:true,shadowOn100NoCorrection:true,cameraWritesVehicle:false};fs.writeFileSync(out+'/camera-identity.json',JSON.stringify(report,null,2));console.log({bitExactFullStateTicks:ticks,protectedFiles:protectedFiles.length,passed:true});
