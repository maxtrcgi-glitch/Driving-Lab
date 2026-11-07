import {CameraRig} from './camera-rig.js';
import {CameraRoad} from './camera-road.js';
import {cameraDefaults,loadCameraSettings,saveCameraSettings,bindCameraOrbit} from './camera-settings.js';
import {TelemetryLog,copyTelemetry} from './telemetry.js';
import {GR86} from './vehicle-spec.js';
import {requestTiltAccess,orientationGravity} from './sensors.js';
import {TiltSteering, steeringDemand, bindHold, bindTap, bindPedal, bindSteeringPad} from './controls.js';
import {DrivingExperience} from './driving-experience.js';
import {SteeringTrace} from './steering-trace.js';
import {TrafficTrace} from './traffic-trace.js';
import * as THREE from './three.module.js';
import {Vehicle,DT,defaults,clamp,approach} from './physics.js';
import {terrain,elevation,barriers,spawns,nearest,courseLength} from './course.js';
import {buildWorld,buildCar} from './world.js';
import {Highway} from './highway.js';
import {buildHighwayWorld} from './highway-world.js';
const $=id=>document.getElementById(id),canvas=$('view');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(error){$('fatal').hidden=false;$('fatal').textContent='3D is unavailable. Open this link in Safari or Chrome with WebGL support.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const world=buildWorld(),car=buildCar(),trackRoot=new THREE.Group();
for(const child of [...world.scene.children])if(!child.isLight&&child!==world.sun.target)trackRoot.add(child);
world.scene.add(trackRoot,car.root);
let location='track';const highway=new Highway(86),highwayWorld=buildHighwayWorld(highway);world.scene.add(highwayWorld.root);
const ground=(x,z)=>location==='highway'?highway.terrain(x,z):terrain(x,z);
const camera=new THREE.PerspectiveCamera(59,1,.08,1500),vehicle=new Vehicle(ground);
const log=new TelemetryLog('0.14A.6.0');let logClock=0;
const input={gas:0,brake:0,steer:0,handbrake:0,reverse:false};
let running=false,paused=false,hidden=false,slow=false,cameraMode=1,last=0,accumulator=0,uiTime=0,currentLap=1,lapStart=0,travelled=0,lapValid=true,lastProgress=0,bestLap=0,toastUntil=0,lastDamage=0;
const keys=new Set(),pointerActions=new Map(),pedalLevels=new Map();let padSteer=0,padActive=false,padBinding=null,lastOrientation=-Infinity;let audio=null;
const tilt=new TiltSteering(),drivingExperience=new DrivingExperience(),steeringResponse=drivingExperience.processor;let tiltMode=false,tiltWaiting=false,sensorTimer=0;
const steeringTrace=new SteeringTrace(),trafficTrace=new TrafficTrace();
let cameraStorage;try{cameraStorage=window.localStorage??localStorage;}catch{}
const cameraSettings=loadCameraSettings(cameraStorage),cameraRig=new CameraRig(camera,car.eye,cameraSettings),cameraRoad=new CameraRoad(highway);cameraMode=cameraSettings.mode;
const cameraOrbit=bindCameraOrbit($('camera-orbit'),cameraRig,()=>cameraMode===0&&running&&!paused,window);
function toast(text,seconds=3){$('toast').textContent=text;$('toast').classList.add('show');toastUntil=performance.now()+seconds*1000;}
let trafficNonce=0;
function trafficSeed(){const fixed=new URLSearchParams(window.location?.search||'').get('trafficSeed');if(fixed!==null&&/^[0-9]{1,10}$/.test(fixed))return Number(fixed)>>>0;return ((Math.random()*4294967296)>>>0)^(++trafficNonce*2654435761);}
function place(where,resetCamera=true){
  trafficTrace.reset();location=where;trackRoot.visible=where!=='highway';highwayWorld.root.visible=where==='highway';const spawn=where==='highway'?highway.reset(highway.seed,trafficSeed()):spawns[where];vehicle.reset(spawn.x,spawn.z,spawn.yaw,spawn.speed||0);if(where==='highway')highwayWorld.update(0);log.event(logClock,'reset',{location:where,...(where==='highway'?{seed:highway.seed,trafficSeed:highway.trafficSeed,origin:0,traffic:highway.density}:{})});
 for(const w of vehicle.wheels){const sn=Math.sin(vehicle.yaw),cs=Math.cos(vehicle.yaw);w.groundPrev=w.ground=ground(vehicle.x+cs*w.x+sn*w.z,vehicle.z-sn*w.x+cs*w.z).height;}
 lapStart=0;currentLap=1;travelled=0;lapValid=true;lastProgress=nearest(vehicle.x,vehicle.z).progress;lastDamage=-1;
 $('location').textContent=where==='highway'?'ENDLESS HIGHWAY':where==='track'?'HANDLING CIRCUIT':where==='bumps'?'BUMP STRIP':'TEST PAD';$('spawn').value=where;
 clearInput(true);input.reverse=false;$('reverse-btn').textContent='D';$('reverse-btn').setAttribute('aria-pressed','false');accumulator=0;updateCar();if(resetCamera){cameraRoad.reset();cameraRig.reset(vehicle);cameraRig.apply(vehicle,0);}
}
function clearInput(keepTilt=false){keys.clear();pointerActions.clear();pedalLevels.clear();padBinding?.reset();input.gas=input.brake=input.steer=input.handbrake=0;if(keepTilt!==true)tilt.suspend();drivingExperience.reset();for(const id of ['gas','brake','handbrake','left','right'])$(id).setAttribute('aria-pressed','false');}
function updateInputs(dt=0){
 if(!running||paused||$('settings').open){input.gas=input.brake=input.steer=input.handbrake=0;return;}
 input.gas=keys.has('KeyW')||keys.has('ArrowUp')?1:Math.max(0,...[...pointerActions].filter(([key,id])=>id==='gas').map(([key])=>pedalLevels.get(key)??1));
 input.brake=keys.has('KeyS')||keys.has('ArrowDown')?1:Math.max(0,...[...pointerActions].filter(([key,id])=>id==='brake').map(([key])=>pedalLevels.get(key)??1));
 input.handbrake=keys.has('Space')||[...pointerActions.values()].includes('handbrake')?1:0;
 const digital=steeringDemand(keys,pointerActions,0),heldDigital=[...pointerActions.values()].some(id=>id==='left'||id==='right')||['KeyA','KeyD','ArrowLeft','ArrowRight'].some(id=>keys.has(id));
 steeringTrace.digitalHeld=heldDigital;steeringTrace.tiltEnabled=tiltMode;
 const mode=padActive?'touch':heldDigital||!tiltMode?'digital':'tilt';
 const demand=padActive?padSteer:mode==='digital'?digital:tilt.value(performance.now());
 input.steer=drivingExperience.value(demand,vehicle.speed,dt,mode);
 if(dt===0)for(const id of ['gas','brake','handbrake','left','right'])$(id).setAttribute('aria-pressed',String([...pointerActions.values()].includes(id)||!!input[id]));
}
for(const id of ['handbrake','left','right'])bindHold($(id),id,pointerActions,updateInputs);
for(const id of ['gas','brake'])bindPedal($(id),id,pointerActions,pedalLevels,updateInputs);
padBinding=bindSteeringPad($('steer-pad'),(v,active)=>{padSteer=v;padActive=active;updateInputs();$('pad-knob').style.transform=`translateX(${v*65}px)`;},()=>({travel:Number($('steering-travel').value),precision:Number($('steering-precision').value)}));
steeringTrace.attachInputs($('steer-pad'),window,[$('left'),$('right')]);
for(const button of document.querySelectorAll('button'))if(!['gas','brake','handbrake','left','right','tilt-btn','copy-log'].includes(button.id))bindTap(button);
function screenAngle(){return screen.orientation?.angle??window.orientation??0;}
function tiltStatus(text){$('steer-status').textContent=text;}
function buttonsMode(message='Touch steering · release to center'){
 $('stage').classList.remove('tilt-active');
 tiltMode=false;tiltWaiting=false;tilt.suspend();clearTimeout(sensorTimer);$('tilt-btn').textContent='Enable tilt steering';$('calibrate-btn').hidden=true;tiltStatus(message);updateInputs();
}
$('tilt-btn').addEventListener('click',e=>{
 if(tiltMode||tiltWaiting){buttonsMode();return;}
 // Exempt from synthetic touch clicks: Safari receives a native user gesture.
 const access=requestTiltAccess(window);
 access.then(result=>{
  if(!result.ok){
   const messages={insecure:'Motion sensors require HTTPS',unsupported:'Motion sensors are unavailable in this browser',policy:'Embedded view blocks motion sensors · open in Safari',gesture:'No valid permission gesture · open in Safari',denied:result.embedded?'Embedded view denied permission · open in Safari':'Safari denied permission. Check site permissions; a new prompt may not appear.'};
   buttonsMode(messages[result.reason]||'Unable to request sensor access');$('sensor-open').hidden=false;return;
  }
  $('sensor-open').hidden=true;$('stage').classList.add('tilt-active');tiltMode=true;tiltWaiting=true;tilt.suspend();$('tilt-btn').textContent='Use touch steering';$('calibrate-btn').hidden=false;tiltStatus('Permission granted · hold your phone comfortably…');
  sensorTimer=setTimeout(()=>{if(tiltWaiting){buttonsMode('Permission granted but no sensor data · open in Safari');$('sensor-open').hidden=false;}},4000);
 }).catch(()=>{buttonsMode('Sensor request failed · open in Safari');$('sensor-open').hidden=false;});
});
function acceptTilt(g){
 if(!tiltMode||document.hidden||!g)return;
 if(tilt.sample(g,screenAngle(),performance.now())&&tiltWaiting){tiltWaiting=false;clearTimeout(sensorTimer);tilt.calibrate(performance.now());tiltStatus('Tilt enabled · use Center steering to recalibrate');}
}
window.addEventListener('deviceorientation',e=>{const g=orientationGravity(e.beta,e.gamma);if(g){lastOrientation=performance.now();acceptTilt(g);}});
window.addEventListener('devicemotion',e=>{if(performance.now()-lastOrientation>500)acceptTilt(e.accelerationIncludingGravity);});
$('calibrate-btn').addEventListener('click',()=>{if(!tilt.calibrate(performance.now()))tiltStatus('Wait for fresh sensor data first');else toast('Steering center calibrated',2);});
function orientationChanged(){if(tiltMode){tilt.suspend();tiltStatus('Orientation changed · tap Center steering');}}
screen.orientation?.addEventListener('change',orientationChanged);window.addEventListener('orientationchange',orientationChanged);
$('tilt-range').addEventListener('input',()=>{tilt.range=Number($('tilt-range').value);$('tilt-range-out').textContent=tilt.range+'°';});
$('invert-tilt').addEventListener('change',()=>{tilt.invert=$('invert-tilt').checked;});
$('reverse-btn').addEventListener('click',()=>{if(vehicle.speed>1.5){toast('Stop the car before changing direction');return;}input.reverse=!input.reverse;$('reverse-btn').textContent=input.reverse?'R':'D';$('reverse-btn').setAttribute('aria-pressed',String(input.reverse));toast(input.reverse?'Reverse':'Drive',1.5);});
window.addEventListener('keydown',e=>{
 if($('settings').open||['INPUT','SELECT'].includes(e.target.tagName))return;
 if(paused){if(e.code==='KeyP'&&!e.repeat){e.preventDefault();togglePause();}return;}
 if(e.target.tagName==='BUTTON'&&['Space','Enter'].includes(e.code))return;
 const movement=['KeyW','KeyS','KeyA','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'];
 if(movement.includes(e.code)){e.preventDefault();keys.add(e.code);updateInputs();}
 if(!e.repeat){if(e.code==='KeyR')place(location);if(e.code==='KeyC')switchCamera();if(e.code==='KeyP')togglePause();if(e.code==='KeyB')repair();}
});
window.addEventListener('keyup',e=>{keys.delete(e.code);updateInputs();});window.addEventListener('blur',()=>{clearInput();cameraOrbit.cancel();cameraRig.resume(vehicle);});
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;last=0;accumulator=0;clearInput();cameraOrbit.cancel();cameraRig.resume(vehicle);cameraRoad.reset();if(audio&&hidden)for(const gain of [audio.gain,audio.wind.gain,audio.tires.gain]){gain.gain.cancelScheduledValues(audio.context.currentTime);gain.gain.value=0;}});
function start(where){running=true;paused=false;$('welcome').hidden=true;$('stage').classList.add('driving');place(where);enableAudio();toast('Pause and settings are in the upper right corner',3);}
$('start-highway').addEventListener('click',()=>start('highway'));
let trafficDebugText='',trafficDebugAt=0;
$('traffic-debug').addEventListener('change',()=>{highway.setDiagnostics($('traffic-debug').checked);$('traffic-debug-overlay').hidden=!$('traffic-debug').checked;trafficDebugText='';});
$('traffic-debug-copy').addEventListener('click',async()=>{const text=trafficDebugText||'No traffic diagnostics yet. Enable diagnostics and drive on the highway.';try{await navigator.clipboard.writeText(text);$('traffic-debug-status').textContent='Copied.';}catch{const field=$('traffic-debug-copy-fallback');field.hidden=false;field.value=text;field.focus();field.select();$('traffic-debug-status').textContent='Select and copy the text below.';}});
function updateTrafficDebug(now){if(!highway.diagnostics||now-trafficDebugAt<500)return;trafficDebugAt=now;let closest=null,best=Infinity;for(const c of highway.cars){const d=(c.x-vehicle.x)**2+(c.z-vehicle.z)**2;if(d<best){best=d;closest=c;}}const snap=closest?highway.diagnostics.snapshot(closest):null;const counts=highway.diagnostics.counts;trafficDebugText=snap?`NPC ${snap.id}/${snap.generation} · ${snap.driverProfile}\nSpeed ${(snap.actualSpeed*3.6).toFixed(0)}/${(snap.desiredSpeed*3.6).toFixed(0)} km/h · lane ${snap.currentLane} → ${snap.targetLane}\nLeader ${Number.isFinite(snap.leaderGap)?snap.leaderGap.toFixed(1)+'m / '+(snap.leaderSpeed*3.6).toFixed(0)+' km/h':'none'} · ${snap.laneChangeState}\nTraits S${snap.traits?.speedTendency.toFixed(2)} P${snap.traits?.patience.toFixed(2)} O${snap.traits?.overtakeMotivation.toFixed(2)} C${snap.traits?.cooperation.toFixed(2)} L${snap.traits?.laneDiscipline.toFixed(2)}\nHeadway ${snap.traits?.headway.toFixed(2)}s · accel ${snap.traits?.maxAccel.toFixed(2)} · brake ${snap.traits?.comfortableBrake.toFixed(2)}\n${snap.intent?.state} L${snap.intent?.targetLane??'-'} ${snap.intent?.passCompleted?'passed':'pending'} → ${snap.intent?.targetId??'-'}/${snap.intent?.targetGeneration??'-'} · wait ${snap.intent?.waiting.toFixed(1)}s · ${snap.intent?.abandonReason}\nMotivation ${snap.motivation} · ${snap.lastDecisionReason}\nRejected ${snap.lastRejectionReason}\nStarted ${counts.LANE_CHANGE_STARTED||0} · completed ${counts.LANE_CHANGE_COMPLETED||0} · rejected ${counts.PASS_REJECTED||0}`:'No NPC available';$('traffic-debug-overlay').textContent=trafficDebugText;}
$('traffic-density').addEventListener('change',()=>{highway.setDensity(Number($('traffic-density').value),highway.project(vehicle.x,vehicle.z).s,highway.project(vehicle.x,vehicle.z).offset);saveExperience();});
$('new-route').addEventListener('click',()=>{highway.seed=Math.floor(Math.random()*100000);if(!running)start('highway');else place('highway');settings.close();});
$('start-track').addEventListener('click',()=>start('track'));$('start-pad').addEventListener('click',()=>start('pad'));
const pauseMenu=$('pause-menu');
function syncMenuState(){const wasPaused=paused;paused=pauseMenu.open||settings.open;if(wasPaused&&!paused){cameraRig.resume(vehicle);cameraRoad.reset();}if(paused)cameraOrbit.cancel();document.body.classList.toggle('menu-open',paused);$('pause-btn').setAttribute('aria-pressed',String(paused));}
function showPause(){if(!running||pauseMenu.open)return;paused=true;clearInput(true);pauseMenu.showModal();syncMenuState();}
function togglePause(){if(!running)return;if(pauseMenu.open)pauseMenu.close();else showPause();}
pauseMenu.addEventListener('close',()=>{clearInput(true);syncMenuState();});
$('resume-btn').addEventListener('click',()=>pauseMenu.close());
$('pause-btn').addEventListener('click',togglePause);$('reset-btn').addEventListener('click',()=>{place(location);toast('Car returned to start',1.5);});
function repair(){log.event(logClock,'repair');drivingExperience.resetShadow();const {x,z,yaw,vx,vz}=vehicle;vehicle.reset(x,z,yaw,Math.hypot(vx,vz));vehicle.setVelocity(vx,0,vz);const speed=vx*Math.sin(yaw)+vz*Math.cos(yaw);for(const w of vehicle.wheels){w.omega=speed/GR86.tireRadius;w.groundPrev=ground(x+Math.cos(yaw)*w.x+Math.sin(yaw)*w.z,z-Math.sin(yaw)*w.x+Math.cos(yaw)*w.z).height;}lapStart=0;travelled=0;lastProgress=nearest(x,z).progress;lastDamage=-1;cameraRoad.reset();cameraRig.reset(vehicle);toast('Body and suspension repaired',2);}
$('repair-btn').addEventListener('click',repair);
function switchCamera(){cameraMode=(cameraMode+1)%3;syncCameraMode();toast(['Camera: chase · drag the camera pad','Camera: cockpit','Camera: hood'][cameraMode],2);}
$('camera-btn').addEventListener('click',switchCamera);
const settings=$('settings');
function openSettings(){clearInput(true);if(pauseMenu.open)pauseMenu.close();settings.showModal();syncMenuState();}
$('settings-btn').addEventListener('click',openSettings);$('welcome-settings').addEventListener('click',openSettings);
$('close-settings').addEventListener('click',()=>settings.close());
settings.addEventListener('close',()=>{if(running)showPause();syncMenuState();});
settings.addEventListener('click',e=>{if(e.target===settings){const r=settings.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)settings.close();}});
$('move-btn').addEventListener('click',()=>{const where=$('spawn').value;if(!running)start(where);else place(where);settings.close();});
const fields=['mass','power','grip','spring','damper'];
function syncConfig(){
 for(const id of fields)vehicle.config[id]=Number($(id).value);for(const id of ['wet','abs','tcs','lsd'])vehicle.config[id]=$(id).checked;
 slow=$('slow').checked;$('load-panel').hidden=!$('telemetry').checked;
 $('mass-out').textContent=vehicle.config.mass+' kg';$('power-out').textContent=Math.round(vehicle.config.power*100)+'%';$('grip-out').textContent=Math.round(vehicle.config.grip*100)+'%';$('spring-out').textContent=(vehicle.config.spring/1000).toFixed(0)+' kN/m';$('damper-out').textContent=(vehicle.config.damper/1000).toFixed(1)+' kN·s/m';
 highwayWorld.materials.road.roughness=vehicle.config.wet?.43:.96;highwayWorld.materials.road.color.set(vehicle.config.wet?0x29343b:0x343b40);
 world.materials.road.roughness=vehicle.config.wet?.43:.96;world.materials.road.color.set(vehicle.config.wet?0x29343b:0x343b40);
 try{localStorage.setItem('driving-lab-nodebeam-v010',JSON.stringify(vehicle.config));}catch{}
}
for(const id of [...fields,'wet','abs','tcs','lsd','telemetry','slow'])$(id).addEventListener('input',syncConfig);
try{const saved=JSON.parse(localStorage.getItem('driving-lab-nodebeam-v010')||'null');if(saved){if(['rwd','fwd','awd'].includes(saved.drive))vehicle.config.drive=saved.drive;for(const id of fields){if(Number.isFinite(saved[id]))$(id).value=String(saved[id]);}for(const id of ['wet','abs','tcs','lsd'])if(typeof saved[id]==='boolean')$(id).checked=saved[id];}}catch{}
$('default-btn').addEventListener('click',()=>{vehicle.config.drive=defaults.drive;$('drive').value=defaults.drive;for(const id of fields)$(id).value=defaults[id];for(const id of ['wet','abs','tcs','lsd'])$(id).checked=defaults[id];$('sound').checked=true;enableAudio();syncConfig();toast('Reference setup restored',1.5);});
$('drive').addEventListener('change',()=>{vehicle.config.drive=$('drive').value;place(location);syncConfig();toast('Drivetrain: '+vehicle.config.drive.toUpperCase()+' · car reset',2);});
$('camera-select').addEventListener('change',()=>{cameraMode=Number($('camera-select').value);syncCameraMode();});
function saveExperience(){try{localStorage.setItem('driving-lab-experience-v013',JSON.stringify(Object.fromEntries(['graphics-quality','steering-travel','steering-precision','traffic-density'].map(id=>[id,$(id).value]))));}catch{}}
function experienceSettings(){const quality=$('graphics-quality').value;renderer.setPixelRatio(Math.min(devicePixelRatio,quality==='high'?2:quality==='balanced'?1.5:1));renderer.shadowMap.enabled=quality!=='performance';resize();for(const id of ['steering-travel','steering-precision'])$(id+'-out').textContent=id==='steering-travel'?Math.round(Number($(id).value)*100)+'%':Number($(id).value).toFixed(2);saveExperience();}
try{const prefs=JSON.parse(localStorage.getItem('driving-lab-experience-v013')||'null');if(prefs){for(const [id,values]of [['graphics-quality',['performance','balanced','high']],['traffic-density',['0','18','28','42','72','120']]])if(values.includes(prefs[id]))$(id).value=prefs[id];for(const [id,min,max]of [['steering-travel',.7,1.5],['steering-precision',1,2.2]])if(Number.isFinite(Number(prefs[id])))$(id).value=String(clamp(Number(prefs[id]),min,max));highway.density=Number($('traffic-density').value);}}catch{}
$('graphics-quality').addEventListener('change',experienceSettings);
for(const id of ['steering-travel','steering-precision'])$(id).addEventListener('input',experienceSettings);

const cameraFields={seatHeight:'seat-height',seatForward:'seat-forward',headPreset:'head-preset',gazePreset:'gaze-preset',gazeIntensity:'gaze-intensity',gazeMax:'gaze-max',firstPerson:'first-person-mode',inertia:'head-inertia',intensity:'inertia-intensity',horizon:'horizon-stabilization',autoLook:'automatic-look',drift:'drift-gaze',dynamicFov:'dynamic-fov',fov:'fov',chaseDistance:'chase-distance',chaseHeight:'chase-height',recenter:'camera-recenter',recenterSpeed:'recenter-speed'};
function syncCameraSettings(){for(const [key,id] of Object.entries(cameraFields)){const e=$(id);if(typeof cameraSettings[key]==='boolean')e.checked=cameraSettings[key];else e.value=String(key==='seatHeight'||key==='seatForward'?cameraSettings[key]*100:cameraSettings[key]);}for(const [key,suffix] of [['gazeIntensity','%'],['gazeMax','°'],['fov','°'],['intensity','%'],['chaseDistance',' m'],['chaseHeight',' m'],['recenterSpeed','×']])$(cameraFields[key]+'-out').textContent=cameraSettings[key]+suffix;for(const key of ['seatHeight','seatForward']){const cm=Math.round(cameraSettings[key]*100);$(cameraFields[key]+'-out').textContent=(cm>0?'+':'')+cm+' cm';}}
function cameraSettingsChanged(){for(const [key,id] of Object.entries(cameraFields))cameraSettings[key]=typeof cameraDefaults[key]==='boolean'?$(id).checked:typeof cameraDefaults[key]==='number'?Number($(id).value)/(key==='seatHeight'||key==='seatForward'?100:1):$(id).value;cameraRig.setSettings(cameraSettings);Object.assign(cameraSettings,cameraRig.settings);saveCameraSettings(cameraStorage,cameraSettings);syncCameraSettings();}
for(const id of Object.values(cameraFields))$(id).addEventListener('input',cameraSettingsChanged);
$('reset-seat').addEventListener('click',()=>{cameraSettings.seatHeight=cameraSettings.seatForward=0;cameraRig.setSettings(cameraSettings);saveCameraSettings(cameraStorage,cameraSettings);syncCameraSettings();});
function closeSeatPreview(){settings.classList.remove('seat-preview');$('seat-preview').textContent='Live seat preview';}
$('seat-preview').addEventListener('click',()=>{const active=settings.classList.toggle('seat-preview');if(active){if(cameraMode!==1){cameraMode=1;syncCameraMode();}cameraRig.blend=1;cameraRig.apply(vehicle,0);}$('seat-preview').textContent=active?'Full camera settings':'Live seat preview';});
settings.addEventListener('close',closeSeatPreview);
for(const id of ['seat-height','seat-forward','reset-seat'])for(const type of ['pointerdown','pointermove','pointerup'])$(id).addEventListener(type,e=>e.stopPropagation());
$('reset-camera').addEventListener('click',()=>{Object.assign(cameraSettings,cameraDefaults);cameraMode=cameraSettings.mode;cameraRig.setSettings(cameraSettings);syncCameraSettings();syncCameraMode();toast('Camera settings restored',2);});
syncCameraSettings();

function syncCameraMode(){
 cameraSettings.mode=cameraMode;cameraRig.setMode(cameraMode);saveCameraSettings(cameraStorage,cameraSettings);cameraOrbit.cancel();$('camera-orbit').hidden=cameraMode!==0;
 $('camera-select').value=String(cameraMode);$('stage').classList.toggle('cockpit',cameraMode===1);for(const part of car.cabinParts)part.visible=cameraMode!==1;car.cockpit.visible=true;car.glass.opacity=cameraMode===1?0:.7;car.glass.depthWrite=cameraMode!==1;
 $('camera-btn').textContent=['Chase','Cockpit','Hood'][cameraMode];
}
$('stage').addEventListener('contextmenu',e=>e.preventDefault());$('stage').addEventListener('selectstart',e=>e.preventDefault());
$('fullscreen-btn').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('app').requestFullscreen)await $('app').requestFullscreen();else document.body.classList.toggle('immersive');}catch{document.body.classList.toggle('immersive');}resize();});
function enableAudio(){
 if(!$('sound').checked)return;
 const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
 if(!audio){const context=new Audio(),osc=context.createOscillator(),osc2=context.createOscillator(),filter=context.createBiquadFilter(),gain=context.createGain();osc.type='sawtooth';osc2.type='triangle';filter.type='lowpass';filter.frequency.value=900;gain.gain.value=0;osc.connect(filter);osc2.connect(filter);filter.connect(gain);gain.connect(context.destination);osc.start();osc2.start();const noise=context.createBuffer(1,context.sampleRate*2,context.sampleRate),data=noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
 const layer=(type,frequency)=>{const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=noise;source.loop=true;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.65;gain.gain.value=0;source.connect(filter);filter.connect(gain);gain.connect(context.destination);source.start();return {gain,filter};};
 audio={context,osc,osc2,filter,gain,wind:layer('lowpass',500),tires:layer('bandpass',1400)};}
 audio.context.resume().catch(()=>{});
}
$('sound').addEventListener('change',()=>{enableAudio();if(audio&&!$('sound').checked){for(const gain of [audio.gain,audio.wind.gain,audio.tires.gain])gain.gain.setTargetAtTime(0,audio.context.currentTime,.08);}});
const chassisMatrix=new THREE.Matrix4(),basisRight=new THREE.Vector3(),basisUp=new THREE.Vector3(),basisForward=new THREE.Vector3();
function updateCar(){
 const basis=vehicle.basis;basisRight.fromArray(basis.right);basisUp.fromArray(basis.up);basisForward.fromArray(basis.forward);chassisMatrix.makeBasis(basisRight,basisUp,basisForward);
 car.root.position.set(vehicle.x,vehicle.y,vehicle.z);car.root.quaternion.setFromRotationMatrix(chassisMatrix);car.body.rotation.set(0,0,0);
 for(let i=0;i<4;i++){const w=vehicle.wheels[i],obj=car.wheels[i];obj.pivot.position.fromArray(w.local);obj.pivot.rotation.set(0,w.steerAngle+w.toe,w.camber);obj.spin.rotation.x=w.spin;}
 car.steeringWheel.rotation.z=-vehicle.steer*GR86.steeringRatio;
 car.speedNeedle.rotation.z=clamp(vehicle.speed*3.6/240,0,1)*Math.PI*1.5-Math.PI*.75;
 car.rpmNeedle.rotation.z=clamp(vehicle.rpm/7500,0,1)*Math.PI*1.5-Math.PI*.75;
 car.updateInstruments(vehicle.speed*3.6,vehicle.rpm,input.reverse?'R':vehicle.gear,vehicle.time);
 car.shadow.position.y=ground(vehicle.x,vehicle.z).height+.023-vehicle.y;
 if(vehicle.deformation.revision!==lastDamage||vehicle.damage>0){
  for(const part of car.deformables){const positions=part.mesh.geometry.attributes.position,base=part.base;for(let i=0;i<positions.count;i++){const x=base[i*3],y=base[i*3+1],z=base[i*3+2],offset=vehicle.deformation.offset(x,y,z);positions.setXYZ(i,x+offset[0],y+offset[1],z+offset[2]);}positions.needsUpdate=true;part.mesh.geometry.computeVertexNormals();part.mesh.geometry.computeBoundingSphere();}
  lastDamage=vehicle.deformation.revision;
 }
}
function updateCamera(simDt){
 cameraRig.apply(vehicle,simDt);
 world.sun.position.set(vehicle.x+55,vehicle.y+85,vehicle.z+40);world.sun.target.position.set(vehicle.x,0,vehicle.z);
}
const formatTime=s=>`${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toFixed(1).padStart(4,'0')}`;
function updateHUD(){
 $('speed').textContent=Math.round(vehicle.speed*3.6);$('gear').textContent=!running?'N':input.reverse?'R':vehicle.gear;$('rpm').textContent=Math.round(vehicle.rpm);$('rpm-bar').style.width=clamp(vehicle.rpm/7500*100,0,100)+'%';$('rpm-bar').style.background=vehicle.rpm>6200?'#e99a72':'#d5e88b';
 $('abs-status').className=vehicle.absActive?'active':vehicle.config.abs?'':'off';$('tcs-status').className=vehicle.tcsActive?'active':vehicle.config.tcs?'':'off';
 const surf=vehicle.wheels[0].surface;$('surface').textContent=surf==='grass'?'GRASS':surf==='gravel'?'GRAVEL':surf==='curb'?'CURB':vehicle.config.wet?'WET':'ASPHALT';
 for(const [i,name]of ['fr','fl','rr','rl'].entries()){$('value-'+name).textContent=(vehicle.wheels[i].load/1000).toFixed(1);$('load-'+name).style.setProperty('--fill',clamp(vehicle.wheels[i].load/8500*100,0,100)+'%');}
 if(location==='track'&&running){
  const p=nearest(vehicle.x,vehicle.z),delta=p.progress-lastProgress;let d=delta;if(d>courseLength*.5)d-=courseLength;if(d< -courseLength*.5)d+=courseLength;
  if(Math.abs(d)<12)travelled+=d;lastProgress=p.progress;if(p.distance>5.65)lapValid=false;
  const startProgress=nearest(0,0).progress,progress=(p.progress-startProgress+courseLength)%courseLength;
  if(travelled>courseLength*.85&&progress<5&&vehicle.vz>0){const lap=vehicle.time-lapStart;if(lapValid&&(bestLap===0||lap<bestLap))bestLap=lap;toast(lapValid?'Lap: '+formatTime(lap):'Lap completed with track limits exceeded',4);currentLap++;lapStart=vehicle.time;travelled=0;lapValid=true;}
  $('lap-time').textContent=formatTime(vehicle.time-lapStart);$('lap-info').textContent=`Lap ${currentLap} · ${lapValid?'clean':'track limits'}${bestLap?' · best '+formatTime(bestLap):''}`;
 }else if(location==='highway'){$('lap-time').textContent=(highway.distance/1000).toFixed(2)+' km';$('lap-info').textContent=`${highway.passes} overtakes · top ${Math.round(highway.topSpeed)} km/h`;}else{$('lap-time').textContent=formatTime(vehicle.time);$('lap-info').textContent=vehicle.damage>.03?'Damage detected · check handling':'Braking · slalom · bumps';}
 if(performance.now()>toastUntil)$('toast').classList.remove('show');
}
function resize(){const rect=$('stage').getBoundingClientRect();renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe($('stage'));
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;clearInput();toast('3D context lost. Reload the game to continue.',20);});
function animate(now){
 const frameMs=last?now-last:1000/60;const dt=Math.min(frameMs/1000,.08);last=now;let steps=0,trafficMs=0,trafficContactMs=0,vehicleMs=0,cameraPhysicsMs=0;const physicsStart=performance.now();
 if(!hidden){
  updateInputs();
  for(const id of ['gas','brake'])$(id).style.setProperty('--pedal-fill',Math.round(input[id]*100)+'%');
  $('steer-marker').style.transform=`translateX(${input.steer*65}px)`;
  if(tiltMode&&!tiltWaiting){const active=tilt.ready&&now-tilt.lastTime<500;tiltStatus(active?`Tilt · ${Math.round(Math.abs(input.steer)*100)}% ${input.steer<-.02?'←':input.steer>.02?'→':'center'}`:'Tap Center steering · steering is neutral');}
  if(running&&!paused&&!settings.open){accumulator+=dt*(slow?.25:1);let count=0;while(accumulator>=DT&&count<20){input.steer=drivingExperience.value(steeringResponse.raw,vehicle.speed,DT,steeringResponse.mode);if(location==='highway'){const t=performance.now();highway.step(DT,vehicle);trafficMs+=performance.now()-t;}const vehicleStart=performance.now();vehicle.step(DT,input);vehicleMs+=performance.now()-vehicleStart;logClock+=DT;steps++;if(location==='highway'){const t=performance.now();const hit=highway.collide(vehicle);trafficContactMs+=performance.now()-t;if(hit)toast('Contact · Repair car is in the pause menu',2);}else for(const b of barriers)if(Math.abs(vehicle.x-b.x)<4&&Math.abs(vehicle.z-b.z)<4){if(vehicle.collideCircle(b.x,b.z,b.r,b.height))toast('Collision · use Repair car to restore the body and wheel alignment',3);}drivingExperience.observe(vehicle,DT);const cameraTickStart=performance.now();cameraRoad.step(vehicle,location,DT);cameraRig.step(vehicle,DT,cameraRoad.out);cameraPhysicsMs+=performance.now()-cameraTickStart;steeringTrace.capture(vehicle,steeringResponse,padBinding,performance.now(),DT,drivingExperience.state,input);accumulator-=DT;count++;}}
  else accumulator=0;
  if(location==='highway'){const shift=highway.rebase(vehicle);if(shift){cameraRig.rebase(shift);cameraRoad.rebase(shift);log.event(logClock,'origin-shift',{shift,origin:highway.origin});}}
  const physicsMs=performance.now()-physicsStart;const renderStart=performance.now();if(location==='highway')highwayWorld.update(highway.project(vehicle.x,vehicle.z).s);updateCar();const cameraStart=performance.now();updateCamera(steps*DT);const cameraMs=cameraPhysicsMs+performance.now()-cameraStart;cameraRig.lastCPUms=cameraMs;renderer.render(world.scene,camera);const renderMs=performance.now()-renderStart;
  if(steps&&location==='highway')highway.diagnostics?.sampleView(now/1000,camera);
  if(steps){cameraRig.recordCPU(cameraMs,frameMs);if(location==='highway')trafficTrace.capture(highway,vehicle);const metrics={frameMs,renderMs,cameraMs,physicsMs:vehicleMs,trafficMs,trafficContactMs,activeTraffic:location==='highway'?highway.cars.length:0,requestedTraffic:location==='highway'?highway.density:0};window.drivingLab.metrics=metrics;log.capture(logClock,vehicle,input,{...metrics,steps,backlogMs:accumulator*1000,discardedMs:Math.max(0,frameMs-80),mode:steeringResponse.mode,steering:steeringResponse,experience:drivingExperience,pad:padBinding,tilt,now,location,slow,cameraMode,sound:$('sound').checked});}
  if(highway.diagnostics&&location==='highway')updateTrafficDebug(now);uiTime+=dt;if(uiTime>.1){updateHUD();uiTime=0;}
  if(audio){const time=audio.context.currentTime;audio.osc.frequency.setTargetAtTime(vehicle.rpm/60*2,time,.07);audio.osc2.frequency.setTargetAtTime(vehicle.rpm/60,time,.07);audio.filter.frequency.setTargetAtTime(600+vehicle.throttle*1900,time,.1);const audible=$('sound').checked&&running&&!paused&&!settings.open;audio.gain.gain.setTargetAtTime(audible?.018+vehicle.throttle*.028:0,time,.08);
   const scrub=Math.max(0,...vehicle.wheels.filter(w=>w.contact).map(w=>clamp((Math.abs(w.alpha)-.025)/.17+Math.abs(w.slip)*.7,0,1)*Math.min(1,w.load/2500)));
   audio.wind.gain.gain.setTargetAtTime(audible?Math.min(.055,(vehicle.speed/45)**2*.045):0,time,.2);
   audio.tires.gain.gain.setTargetAtTime(audible?scrub*Math.min(1,vehicle.speed/8)*.075:0,time,.06);audio.tires.filter.frequency.setTargetAtTime(800+scrub*1200,time,.1);}
 }
 requestAnimationFrame(animate);
}
$('drive').value=vehicle.config.drive;syncConfig();experienceSettings();place('track');syncCameraMode();resize();requestAnimationFrame(animate);
window.drivingLab={vehicle,input,place,world,car,highway,highwayWorld,version:'0.14A.6.0',cameraRig,cameraRoad,cameraSettings,camera,steeringTrace,trafficTrace,log,steeringResponse,drivingExperience};

function telemetryText(){return log.export(Number($('log-duration').value),{camera:cameraRig.diagnostics(),trafficContinuity:trafficTrace.export(),physics:'Reduced node-beam unchanged from 0.14A.1',structure:{nodes:vehicle.nodes.length,beams:vehicle.beams.length,substepsHz:1920},vehicle:GR86.name,config:{...vehicle.config},highway:location==='highway'?{seed:highway.seed,trafficSeed:highway.trafficSeed,aiVersion:3,decisions:highway.decisions,laneChanges:highway.laneChanges,npcContacts:highway.npcContacts,barrierContacts:highway.barrierContacts,origin:highway.origin,traffic:highway.density,contacts:highway.contacts,passes:highway.passes}:null,location,cameraMode,slow,sound:$('sound').checked,controls:{drivingExperience:drivingExperience.mode,steeringAssistance:false,steeringProfile:'outer-reserve-v014A1',raw:steeringResponse.raw,target:steeringResponse.target,tiltMode,range:tilt.range,invert:tilt.invert},screen:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},userAgent:navigator.userAgent});}
function logStatus(){ $('log-status').textContent=log.rows.length?`${log.duration.toFixed(1)} seconds available · ${log.markCount} issue marks`:'No driving recorded yet. Drive first.';const row=log.rows.at(-1);$('perf-status').textContent=row?`Last sample: ${log.lastRafHz.toFixed(1)} RAF/s · physics ${log.physicsSampleMs.toFixed(1)} ms · traffic ${log.trafficSampleMs.toFixed(1)} ms · render CPU ${log.renderSampleMs.toFixed(1)} ms · camera CPU ${(window.drivingLab.metrics?.cameraMs||0).toFixed(2)} ms. Traffic: ${location==='highway'?highway.cars.length:0}/${location==='highway'?highway.density:0} active/requested. Timings are sample maxima, not GPU time.`:'Drive to record performance. Timings are CPU measurements; phone GPU performance needs a device test.'; }
$('pause-btn').addEventListener('click',logStatus);$('log-duration').addEventListener('change',logStatus);
$('mark-log').addEventListener('click',()=>{if(!log.rows.length){logStatus();return;}log.event(logClock,'issue');logStatus();$('log-status').textContent+=' · marked at '+logClock.toFixed(1)+' s';});
$('copy-log').addEventListener('click',()=>{if(!log.rows.length){logStatus();return;}const text=telemetryText();copyTelemetry(text,navigator,$('log-text'),$('log-fallback'),document).then(ok=>{$('log-status').textContent=ok?'Telemetry copied. Paste it into the chat.':'Automatic copy unavailable. Select the text below and choose Copy.';});});
$('download-log').addEventListener('click',()=>{if(!log.rows.length){logStatus();return;}const url=URL.createObjectURL(new Blob([telemetryText()],{type:'text/plain'})),link=document.createElement('a');link.href=url;link.download='driving-lab-0.14A.6.0-telemetry.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);});
$('download-steering').addEventListener('click',()=>{if(!steeringTrace.count){toast('Drive first to record steering',2);return;}const url=URL.createObjectURL(new Blob([steeringTrace.exportCSV()],{type:'text/csv'})),link=document.createElement('a');link.href=url;link.download='driving-lab-0.14A.6.0-steering.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);});

