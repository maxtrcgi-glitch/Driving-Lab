import {CameraRig} from '../dist/camera-rig.js';
import {CameraRoad} from '../dist/camera-road.js';
import * as cameraPrefs from '../dist/camera-settings.js';
// Full production app bootstrap with DOM/WebGL renderer stubs and real
// Three.js geometry + Vehicle. This is NOT a browser or GPU/device test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as Three from '../dist/three.module.js';
import * as physics from '../dist/physics.js';
import * as course from '../dist/course.js';
import * as controls from '../dist/controls.js';
import {DrivingExperience} from '../dist/driving-experience.js';
import {SteeringTrace} from '../dist/steering-trace.js';
import {TrafficTrace} from '../dist/traffic-trace.js';
import * as sensors from '../dist/sensors.js';
import * as telemetry from '../dist/telemetry.js';
import {GR86} from '../dist/vehicle-spec.js';
import {buildWorld,buildCar} from '../dist/world.js';
import {Highway} from '../dist/highway.js';
import {buildHighwayWorld} from '../dist/highway-world.js';
class Element extends EventTarget{
 constructor(id,tag){super();this.id=id;this.tagName=tag.toUpperCase();this.value='';this.checked=false;this.open=false;this.hidden=false;this.textContent='';this.style={setProperty(){}};const classes=new Set();this.classList={add:(...names)=>names.forEach(name=>classes.add(name)),remove:(...names)=>names.forEach(name=>classes.delete(name)),contains:name=>classes.has(name),toggle:(name,force)=>{const active=force===undefined?!classes.has(name):!!force;if(active)classes.add(name);else classes.delete(name);return active;}};}
 setAttribute(){} getBoundingClientRect(){return {width:844,height:390,left:0,top:0,right:844,bottom:390};}setPointerCapture(){}hasPointerCapture(){return true;}releasePointerCapture(){}focus(){}select(){}setSelectionRange(){}
 showModal(){this.open=true;}close(){if(this.open){this.open=false;this.dispatchEvent(new Event('close'));}}click(){this.dispatchEvent(new Event('click'));}
}
const html=fs.readFileSync('dist/index.html','utf8'),ids=new Map();
for(const match of html.matchAll(/<(\w+)\b([^>]*\bid="([^"]+)"[^>]*)>/g)){const e=new Element(match[3],match[1]);e.value=/\bvalue="([^"]*)"/.exec(match[2])?.[1]??'';e.checked=/\bchecked\b/.test(match[2]);ids.set(e.id,e);}
for(const m of html.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){const options=[...m[2].matchAll(/<option\b([^>]*)>/g)];const chosen=options.find(o=>/selected/.test(o[1]))??options[0];ids.get(m[1]).value=/value="([^"]+)"/.exec(chosen[1])[1];}
const document=new EventTarget();document.body=new Element('body','body');document.hidden=false;document.getElementById=id=>{assert.ok(ids.has(id),'Missing DOM ID '+id);return ids.get(id);};document.querySelectorAll=tag=>[...ids.values()].filter(e=>e.tagName===tag.toUpperCase());
let rendered=0,raf;
class Renderer{constructor(){this.shadowMap={};}setPixelRatio(v){this.dpr=v;}setSize(){}render(scene){scene.updateMatrixWorld(true);rendered++;}}
const window=new EventTarget();const storage=new Map();const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
if(process.argv.includes('--seat-reload'))storage.set(cameraPrefs.CAMERA_KEY,JSON.stringify({mode:1,fov:66,intensity:83,headPreset:'strong',drift:true,seatHeight:-.12,seatForward:-.17}));
if(process.argv.includes('--storage-denied'))Object.defineProperty(window,'localStorage',{get(){throw Error('SecurityError: storage blocked');}});
const context=vm.createContext({console,document,window,localStorage,performance,devicePixelRatio:3,innerWidth:844,innerHeight:390,navigator:{userAgent:'Node app bootstrap stubs'},screen:{orientation:new EventTarget()},URLSearchParams,ResizeObserver:class{observe(){}},requestAnimationFrame:f=>raf=f,setTimeout,clearTimeout,THREE:{...Three,WebGLRenderer:Renderer},GR86,CameraRig,CameraRoad,...cameraPrefs,DrivingExperience,SteeringTrace,TrafficTrace,buildWorld,buildCar,Highway,buildHighwayWorld,...physics,...course,...controls,...sensors,...telemetry});
const app=fs.readFileSync('dist/app.js','utf8').replace(/^import .*;\n/gm,'');vm.runInContext(app,context,{filename:'dist/app.js'});
if(process.argv.includes('--seat-reload')||process.argv.includes('--storage-denied')){
 const denied=process.argv.includes('--storage-denied'),dl=window.drivingLab;
 assert.equal(dl.cameraSettings.seatHeight,denied?0:-.12);assert.equal(dl.cameraSettings.seatForward,denied?0:-.17);assert.equal(dl.cameraSettings.fov,denied?60:66);assert.equal(ids.get('seat-height').value,denied?'0':'-12');
 ids.get('start-highway').click();for(let i=0;i<20;i++)raf(i*1000/60);
 ids.get('seat-height').value='-8';ids.get('seat-height').dispatchEvent(new Event('input'));raf(400);assert.equal(dl.cameraRig.settings.seatHeight,-.08);assert.ok(dl.camera.position.toArray().every(Number.isFinite));
 const result={freshAppReload:!denied,globalStorageGetterDenied:denied,gameAndLiveSeatWork:true,WebGLStub:true};fs.mkdirSync('reports/A52',{recursive:true});fs.writeFileSync('reports/A52/'+(denied?'storage-denied':'reload')+'-result.json',JSON.stringify(result,null,2));await new Promise(resolve=>process.stdout.write(JSON.stringify(result)+'\n',resolve));process.exit(0);
}
assert.equal(window.drivingLab.version,'0.14A.6.0');assert.equal(window.drivingLab.drivingExperience.mode,'simulation');ids.get('traffic-density').value='120';ids.get('traffic-density').dispatchEvent(new Event('change'));window.location={search:'?trafficSeed=917'};ids.get('start-highway').click();const initialTraffic=JSON.stringify(window.drivingLab.highway.cars);window.drivingLab.place('highway');assert.equal(JSON.stringify(window.drivingLab.highway.cars),initialTraffic);window.location.search='';window.drivingLab.place('highway');const randomTraffic=JSON.stringify(window.drivingLab.highway.cars);window.drivingLab.place('highway');assert.notEqual(JSON.stringify(window.drivingLab.highway.cars),randomTraffic);assert.equal(window.drivingLab.highway.cars.length,120);assert.ok(window.drivingLab.vehicle.speed>20);
for(let i=0;i<90;i++)raf(i*1000/60);
assert.ok(rendered>=90);assert.equal(window.drivingLab.highway.contacts,0);assert.equal(window.drivingLab.vehicle.brokenBeams,0);assert.ok(window.drivingLab.log.rows.length>0);
ids.get('pause-btn').click();assert.ok(ids.get('perf-status').textContent.includes('120/120'));
ids.get('settings-btn').click();ids.get('graphics-quality').value='performance';ids.get('graphics-quality').dispatchEvent(new Event('change'));ids.get('steering-travel').value='1.5';ids.get('steering-travel').dispatchEvent(new Event('input'));assert.ok(JSON.parse(storage.get('driving-lab-experience-v013'))['graphics-quality']==='performance');
ids.get('close-settings').click();ids.get('resume-btn').click();for(const mode of ['track','pad','bumps','highway']){window.drivingLab.place(mode);raf(2000+rendered*1000/60);assert.ok(Number.isFinite(window.drivingLab.vehicle.speed));}
// Exercise actual app selection, fixed-step controller and lifecycle clearing.
let now=4000;
const frame=()=>raf(now+=1000/60);
const pointer=(type,x)=>{const e=new Event(type,{cancelable:true});e.pointerId=77;e.clientX=x;ids.get('steer-pad').dispatchEvent(e);};
pointer('pointerdown',0);pointer('pointermove',80);assert.equal(window.drivingLab.input.steer,0,'Input event cannot jump command');
for(let i=0;i<15;i++)frame();assert.ok(window.drivingLab.input.steer>0);assert.equal(window.drivingLab.steeringResponse.mode,'touch');
const diagnostic=Object.fromEntries(telemetry.columns.map((name,i)=>[name,window.drivingLab.log.rows.at(-1)[i]]));
assert.equal(diagnostic.touch_active,1);assert.ok(diagnostic.touch_fraction>0);assert.ok(diagnostic.steer_target_pre_rate>0);assert.equal(diagnostic.input_mode,0);assert.equal(diagnostic.assist_available,0);assert.equal(diagnostic.skid_detected,null);
assert.equal(diagnostic.driving_experience,1);assert.equal(diagnostic.assist_state,1);assert.equal(diagnostic.assist_correction,0);
assert.equal(diagnostic.shadow_only,1);assert.equal(diagnostic.assist_effective_strength_pct,0);assert.ok(window.drivingLab.drivingExperience.state.tick>0);
const modeCommand=window.drivingLab.input.steer,setup=JSON.stringify(window.drivingLab.vehicle.config);
window.drivingLab.drivingExperience.setMode('simulation');assert.equal(window.drivingLab.input.steer,modeCommand);
for(const mode of ['balanced','assisted'])assert.throws(()=>window.drivingLab.drivingExperience.setMode(mode),RangeError);
assert.equal(JSON.stringify(window.drivingLab.vehicle.config),setup);
pointer('pointercancel',80);assert.equal(window.drivingLab.steeringResponse.raw,0);
for(let i=0;i<30;i++)frame();assert.equal(window.drivingLab.input.steer,0,'Cancel decays to exact neutral');
pointer('pointerdown',0);pointer('pointermove',80);frame();window.dispatchEvent(new Event('blur'));assert.equal(window.drivingLab.input.steer,0);assert.equal(window.drivingLab.steeringResponse.position,0);pointer('pointermove',100);frame();assert.equal(window.drivingLab.input.steer,0,'Stale gesture cannot resume after blur');
for(const release of ['pointerup','lostpointercapture']){pointer('pointerdown',0);pointer('pointermove',80);frame();pointer(release,80);for(let i=0;i<30;i++)frame();assert.equal(window.drivingLab.input.steer,0);}
for(let i=0;i<4;i++){ids.get('camera-btn').click();frame();assert.ok(Number.isFinite(window.drivingLab.vehicle.speed));}
pointer('pointerdown',0);pointer('pointermove',80);frame();document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.equal(window.drivingLab.input.steer,0);document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));frame();assert.equal(window.drivingLab.input.steer,0);
window.drivingLab.place('highway');assert.equal(window.drivingLab.drivingExperience.state.age,0);assert.equal(window.drivingLab.drivingExperience.reference.valid,false);assert.equal(window.drivingLab.steeringResponse.position,0);assert.equal(window.drivingLab.highway.cars.length,120);assert.ok(window.drivingLab.vehicle.speed>20);
console.log({checks:'production app bootstrap, 90 RAF frames, rolling highway with 120 NPC, no spawn collision, pause/settings/prefs, all spawns, telemetry/performance',rendered,webglStub:true,deviceQA:false});
// Real UI wiring: camera preferences persist without altering car or steering setup.
const protectedSetup=JSON.stringify(window.drivingLab.vehicle.config),protectedResponse=JSON.stringify(window.drivingLab.steeringResponse);
for(const [id,value] of [['first-person-mode','static'],['dynamic-fov','6'],['inertia-intensity','80'],['chase-distance','6.2'],['chase-height','2.8'],['recenter-speed','1.5']]){ids.get(id).value=value;ids.get(id).dispatchEvent(new Event('input'));}
ids.get('drift-gaze').checked=true;ids.get('drift-gaze').dispatchEvent(new Event('input'));const savedCam=JSON.parse(storage.get('driving-lab-camera-v014a4'));assert.equal(savedCam.dynamicFov,6);assert.equal(savedCam.intensity,80);assert.equal(savedCam.drift,true);assert.equal(savedCam.chaseDistance,6.2);assert.equal(window.drivingLab.cameraRig.settings.firstPerson,'static');assert.equal(JSON.stringify(window.drivingLab.vehicle.config),protectedSetup);assert.equal(JSON.stringify(window.drivingLab.steeringResponse),protectedResponse);
ids.get('camera-select').value='0';ids.get('camera-select').dispatchEvent(new Event('change'));assert.equal(window.drivingLab.cameraRig.mode,0);assert.equal(ids.get('camera-orbit').hidden,false);ids.get('reset-camera').click();assert.equal(window.drivingLab.cameraRig.mode,1);assert.equal(ids.get('camera-orbit').hidden,true);assert.equal(JSON.parse(storage.get('driving-lab-camera-v014a4')).dynamicFov,0);
console.log('Camera UI: toggles/ranges persistence, independent vehicle/steering setup, chase region visibility and reset verified.');
ids.get('camera-select').value='0';ids.get('camera-select').dispatchEvent(new Event('change'));pointer('pointerdown',0);pointer('pointermove',80);frame();const heldRaw=window.drivingLab.steeringResponse.raw;const orbitEvent=(name,x)=>{const e=new Event(name,{cancelable:true});Object.assign(e,{pointerId:88,clientX:x,clientY:100,button:0});ids.get('camera-orbit').dispatchEvent(e);};orbitEvent('pointerdown',0);orbitEvent('pointermove',90);assert.equal(window.drivingLab.steeringResponse.raw,heldRaw);assert.ok(window.drivingLab.cameraRig.orbitActive);orbitEvent('pointerup',90);assert.equal(window.drivingLab.cameraRig.orbitActive,false);assert.equal(window.drivingLab.steeringResponse.raw,heldRaw);pointer('pointerup',80);frame();assert.equal(window.drivingLab.steeringResponse.raw,0);assert.ok(window.drivingLab.metrics.cameraMs>=0);assert.ok(window.drivingLab.cameraRig.performanceSummary().samples>0);
console.log('Simultaneous steering/orbit pointers: ownership and release are independent; camera CPU sample export is live.');

// Live independent A/B presets and old camera storage migration.
const steeringBefore42=JSON.stringify(window.drivingLab.steeringResponse);
for(const [id,value,key] of [['head-preset','strong','headPreset'],['gaze-preset','reference','gazePreset'],['gaze-intensity','70','gazeIntensity'],['gaze-max','18','gazeMax']]){ids.get(id).value=value;ids.get(id).dispatchEvent(new Event('input'));assert.equal(String(window.drivingLab.cameraRig.settings[key]),value);assert.equal(String(JSON.parse(storage.get('driving-lab-camera-v014a4'))[key]),value);}
assert.equal(window.drivingLab.cameraRig.settings.intensity,25);assert.equal(JSON.stringify(window.drivingLab.vehicle.config),protectedSetup);assert.equal(JSON.stringify(window.drivingLab.steeringResponse),steeringBefore42);console.log('A42 presets/intensities/cap persist independently without reload or vehicle configuration mutation.');

// Real UI wiring: centimetres convert once to metres and render immediately, including paused frames.
ids.get('camera-select').value='1';ids.get('camera-select').dispatchEvent(new Event('change'));for(let i=0;i<30;i++)frame();
const seatSetup=JSON.stringify(window.drivingLab.vehicle.config),seatSteering=JSON.stringify(window.drivingLab.steeringResponse),oldPosition=window.drivingLab.camera.position.clone();
ids.get('seat-height').value='-10';ids.get('seat-height').dispatchEvent(new Event('input'));ids.get('seat-forward').value='-15';ids.get('seat-forward').dispatchEvent(new Event('input'));
assert.equal(window.drivingLab.cameraSettings.seatHeight,-.1);assert.equal(window.drivingLab.cameraRig.settings.seatForward,-.15);assert.equal(ids.get('seat-height-out').textContent,'-10 cm');assert.equal(ids.get('seat-forward-out').textContent,'-15 cm');assert.equal(JSON.parse(storage.get(cameraPrefs.CAMERA_KEY)).seatForward,-.15);frame();assert.ok(window.drivingLab.camera.position.distanceTo(oldPosition)>.1);
assert.equal(JSON.stringify(window.drivingLab.vehicle.config),seatSetup);assert.equal(JSON.stringify(window.drivingLab.steeringResponse),seatSteering);
ids.get('pause-btn').click();ids.get('settings-btn').click();const pausedSeat=window.drivingLab.camera.position.clone(),pausedVehicle=window.drivingLab.vehicle.x;ids.get('seat-height').value='-5';ids.get('seat-height').dispatchEvent(new Event('input'));frame();assert.equal(window.drivingLab.vehicle.x,pausedVehicle);assert.ok(window.drivingLab.camera.position.distanceTo(pausedSeat)>.04);
window.drivingLab.place('highway');assert.equal(window.drivingLab.cameraRig.settings.seatHeight,-.05);frame();ids.get('camera-select').value='0';ids.get('camera-select').dispatchEvent(new Event('change'));frame();ids.get('camera-select').value='1';ids.get('camera-select').dispatchEvent(new Event('change'));frame();assert.equal(window.drivingLab.cameraRig.settings.seatForward,-.15);
const nonSeat=JSON.stringify(Object.fromEntries(Object.entries(window.drivingLab.cameraSettings).filter(([key])=>!key.startsWith('seat'))));
for(const id of ['seat-height','seat-forward']){const event=new Event('pointerdown',{cancelable:true});event.pointerId=912;ids.get(id).dispatchEvent(event);assert.equal(window.drivingLab.steeringResponse.raw,0);assert.equal(window.drivingLab.cameraRig.orbitActive,false);}
ids.get('reset-seat').click();assert.equal(window.drivingLab.cameraRig.settings.seatHeight,0);assert.equal(JSON.parse(storage.get(cameraPrefs.CAMERA_KEY)).seatForward,0);assert.equal(nonSeat,JSON.stringify(Object.fromEntries(Object.entries(window.drivingLab.cameraSettings).filter(([key])=>!key.startsWith('seat')))));
ids.get('seat-preview').click();assert.equal(ids.get('settings').classList.contains('seat-preview'),true);assert.equal(ids.get('seat-preview').textContent,'Full camera settings');frame();ids.get('seat-preview').click();assert.equal(ids.get('settings').classList.contains('seat-preview'),false);ids.get('seat-preview').click();ids.get('close-settings').click();assert.equal(ids.get('settings').classList.contains('seat-preview'),false);ids.get('resume-btn').click();frame();assert.equal(window.drivingLab.cameraSettings.seatHeight,0);console.log('A52: live/paused seat preview, cm/metres, persistent reset-only-position, respawn/mode switches and input ownership verified.');

