import {baselineFile} from './support/baselines.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import * as T from '../dist/three.module.js';
import {buildCar} from '../dist/world.js';
import {CameraRig} from '../dist/camera-rig.js';
import {cameraDefaults,seatLimits,CAMERA_KEY,loadCameraSettings,saveCameraSettings,sanitizeCameraSettings} from '../dist/camera-settings.js';
import {Vehicle,DT} from '../dist/physics.js';
import {vehicleSnapshot} from './full-state.mjs';

fs.mkdirSync('reports/A52',{recursive:true});
const car=buildCar(),eye=car.eye.clone();
const legacySource=baselineFile('gameplay-baseline/v0.14A.5.1:dist/camera-rig.js',{encoding:'utf8'}).replace(/'\.\/([^']+)'/g,(_,file)=>JSON.stringify(pathToFileURL(path.resolve('dist',file)).href));
const {CameraRig:Legacy}=await import('data:text/javascript;base64,'+Buffer.from(legacySource).toString('base64'));
const make=(Class,settings)=>new Class(new T.PerspectiveCamera(60,844/390,.025,1500),eye,settings);
const storage=new Map(),store={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
const old={fov:66,headPreset:'strong',intensity:88,drift:true,gazePreset:'reference',mode:0,chaseDistance:6.4};
storage.set(CAMERA_KEY,JSON.stringify(old));const migrated=loadCameraSettings(store);for(const k of Object.keys(old))assert.equal(migrated[k],old[k]);assert.equal(migrated.seatHeight,0);assert.equal(migrated.seatForward,0);
for(const value of [null,[],{},'wrong',{seatHeight:'0.1',seatForward:Infinity},{seatHeight:NaN,seatForward:null}]){const s=sanitizeCameraSettings(value);assert.equal(s.seatHeight,0);assert.equal(s.seatForward,0);}
assert.equal(sanitizeCameraSettings({seatHeight:100}).seatHeight,.02);assert.equal(sanitizeCameraSettings({seatForward:-100}).seatForward,-.2);
storage.set(CAMERA_KEY,'invalid-json');assert.deepEqual(loadCameraSettings(store),cameraDefaults);
const blocked={getItem(){throw Error('denied');},setItem(){throw Error('quota/denied');}};assert.deepEqual(loadCameraSettings(blocked),cameraDefaults);assert.equal(saveCameraSettings(blocked,cameraDefaults),false);assert.deepEqual(loadCameraSettings(undefined),cameraDefaults);
const requested={...migrated,seatHeight:-.09,seatForward:-.14};assert.ok(saveCameraSettings(store,requested));assert.deepEqual(loadCameraSettings(store),requested);
// Vehicle-owned eye and replaceable cabin bounds are separate from user/dynamic offsets.
const otherEye=new T.Vector3(-.3,.7,-.4),otherBounds={height:[-.1,.1],forward:[-.1,.15]},other=new CameraRig(new T.PerspectiveCamera(),otherEye,{...cameraDefaults,seatHeight:.08,seatForward:.12},otherBounds);assert.equal(other.settings.seatHeight,.08);assert.equal(other.settings.seatForward,.12);otherEye.y=100;assert.equal(other.eye.y,.7);

let ticks=0,maxDeltaError=0,chaseExact=0;const dynamics=[];
for(const fps of [30,60,120]){
 const a=new Vehicle(),b=new Vehicle();a.reset(0,0,0,100/3.6);b.reset(0,0,0,100/3.6);
 const settings={...cameraDefaults,intensity:100,headPreset:'strong',gazePreset:'strong',drift:true,dynamicFov:6},legacy=make(Legacy,settings),zero=make(CameraRig,settings),seat=make(CameraRig,{...settings,seatHeight:-.1,seatForward:-.15});legacy.reset(a);zero.reset(a);seat.reset(b);
 for(let i=0;i<960;i++){
  const t=i*DT,input={gas:t<1?1:0,brake:t>2?1:0,steer:t<.5?0:t<1.5?.12:t<2?-.18:0};a.step(DT,input);b.step(DT,input);const road={x:a.x+5,y:a.y,z:a.z+40,confidence:1};legacy.step(a,DT,road);zero.step(a,DT,road);seat.step(b,DT,road);
  if(i===400)seat.setSettings({...seat.settings,seatHeight:.02,seatForward:.02});
  for(const key of ['side','vertical','longitudinal','pitch','longPitch','roll','gaze']){assert.equal(seat[key].x,legacy[key].x,key+' dynamics');assert.equal(zero[key].x,legacy[key].x);}
  assert.deepEqual(vehicleSnapshot(a),vehicleSnapshot(b));
  if((i+1)%(240/fps)===0){legacy.apply(a,1/fps);zero.apply(a,1/fps);seat.apply(b,1/fps);assert.deepEqual(zero.camera.position.toArray(),legacy.camera.position.toArray());assert.deepEqual(zero.camera.quaternion.toArray(),legacy.camera.quaternion.toArray());for(let j=0;j<4;j++)assert.ok(Math.abs(seat.camera.quaternion.toArray()[j]-legacy.camera.quaternion.toArray()[j])<1e-12,'lookAt floating-point cancellation only');const delta=new T.Vector3(0,seat.settings.seatHeight,seat.settings.seatForward).applyQuaternion(seat.observation.q),error=seat.camera.position.clone().sub(legacy.camera.position).sub(delta).length();maxDeltaError=Math.max(maxDeltaError,error);assert.ok(error<1e-12);}
  ticks++;
 }
 assert.deepEqual(car.eye.toArray(),eye.toArray());
 const saved={...seat.settings};for(const mode of [0,2,1]){seat.setSettings({...seat.settings,mode});seat.reset(b);seat.apply(b,0);assert.equal(seat.settings.seatHeight,saved.seatHeight);assert.equal(seat.settings.seatForward,saved.seatForward);if(mode===0){zero.setSettings({...zero.settings,mode});zero.reset(b);zero.apply(b,0);assert.deepEqual(seat.camera.position.toArray(),zero.camera.position.toArray());assert.deepEqual(seat.camera.quaternion.toArray(),zero.camera.quaternion.toArray());chaseExact++;}}
 seat.resume(b);seat.apply(b,0);assert.equal(seat.settings.seatForward,.02);seat.reset(b);seat.apply(b,0);assert.equal(seat.settings.seatHeight,.02);seat.rebase(1000);assert.equal(seat.settings.seatHeight,.02);dynamics.push({fps,lastHead:seat.headTranslation(),persisted:saved.seatForward});
}
// The cabin's roof/header and sloping glass invalidate the originally suggested upper/forward limits.
car.root.updateMatrixWorld(true);car.cockpit.visible=true;const points=[],rays=[];let minRoofMargin=Infinity,minGlassMargin=Infinity;
for(const h of [seatLimits.height[0],0,seatLimits.height[1]])for(const z of [seatLimits.forward[0],0,seatLimits.forward[1]])for(const dx of [-.02,.02])for(const dy of [-.012,.012])for(const dz of [-.034,.043]){
 const p=eye.clone().add(new T.Vector3(dx,h+dy,z+dz)),modelY=p.y+.681;
 // Lowest interior header is at 1.19m; windscreen upper edge at z=-.08, y=1.20.
 const glassY=1.20-(p.z+.08)*(.24/.47);minRoofMargin=Math.min(minRoofMargin,1.19-modelY);minGlassMargin=Math.min(minGlassMargin,glassY-modelY);assert.ok(modelY<1.19);assert.ok(modelY<glassY);
 for(const x of [-1,0,1])for(const y of [-1,0,1])for(const fz of [-1,0,1])if(x||y||fz){const hits=new T.Raycaster(p,new T.Vector3(x,y,fz).normalize(),0,.025).intersectObject(car.root,true).filter(hit=>hit.object.visible&&hit.object.material.opacity!==0);if(hits.length)rays.push({height:h,forward:z,distance:hits[0].distance,name:hits[0].object.name});}
 points.push(p.toArray());
}
assert.equal(rays.length,0,'Near-origin cabin clearance');assert.ok(eye.y+.681+.15+.012>1.19,'Suggested height+15cm would leave roof envelope');assert.ok(eye.y+.681+.012>1.20-((eye.z+.20+.043)+.08)*(.24/.47),'Suggested forward+20cm would cross windscreen');
// CPU comparison only, not iPhone/GPU. No new per-frame Vector allocation in the seat path.
const benchmark=[];for(let repeat=0;repeat<3;repeat++){const v=new Vehicle();v.reset(0,0,0,30);const run=Class=>{const rig=make(Class,{...cameraDefaults,seatHeight:-.1,seatForward:-.1});rig.reset(v);const start=performance.now();for(let i=0;i<20000;i++){v.z+=30*DT;rig.step(v,DT,null);if(i%4===0)rig.apply(v,DT*4);}return (performance.now()-start)/20000;};const order=repeat%2?[CameraRig,Legacy]:[Legacy,CameraRig],result=new Map(order.map(Class=>[Class,run(Class)]));benchmark.push({legacyMsPerStep:result.get(Legacy),currentMsPerStep:result.get(CameraRig)});}
const protectedFiles=fs.readdirSync('dist').filter(file=>!['camera-rig.js','camera-settings.js','app.js','index.html','style.css'].includes(file));for(const file of protectedFiles)assert.deepEqual(fs.readFileSync('dist/'+file),baselineFile('gameplay-baseline/v0.14A.5.1:dist/'+file,{maxBuffer:32*1024*1024}),file+' protected');
const report={passed:true,fullPhysicsIdentityTicks:ticks,zeroOffsetLegacyCameraExact:true,dynamicsExactAtAllOffsets:true,maxWorldDeltaErrorM:maxDeltaError,chaseExact,storageMigration:true,storageFailureFallback:true,corruptionClamped:true,otherVehicleInterface:true,seatLimitsMetres:seatLimits,cabinExtremePoints:points.length,rayQueries:points.length*26,nearObstructions:rays,minRoofMarginM:minRoofMargin,minConservativeGlassMarginM:minGlassMargin,protectedFiles:protectedFiles.length,benchmark,nodeCPUOnly:true,iPhone:false,GPU:false,limitations:'Undamaged procedural cabin point/ray envelope, not full-frustum damaged-cabin proof or visual device acceptance. Observation retains calibrated vehicle-owned anchor to avoid seat slider causing false acceleration.'};
fs.writeFileSync('reports/A52/seat-position.json',JSON.stringify(report,null,2));console.log(report);
