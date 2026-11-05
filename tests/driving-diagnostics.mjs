import assert from 'node:assert/strict';
import {Vehicle,DT} from '../dist/physics.js';
import {TelemetryLog,columns} from '../dist/telemetry.js';
import {SteeringResponse,TiltSteering,bindSteeringPad} from '../dist/controls.js';
import {drivingDiagnosticColumns} from '../dist/driving-diagnostics.js';
class Pad extends EventTarget{
 getBoundingClientRect(){return {width:250};}setPointerCapture(){}
 fire(type,x,id=1){const e=new Event(type,{cancelable:true});Object.assign(e,{clientX:x,pointerId:id});this.dispatchEvent(e);}
 touch(type,x,id=2){const e=new Event(type,{cancelable:true});e.changedTouches=[{clientX:x,identifier:id}];this.dispatchEvent(e);}
}
const pad=new Pad(),c=new SteeringResponse(),v=new Vehicle(),tilt=new TiltSteering();
const p=bindSteeringPad(pad,(raw,active)=>c.value(active?raw:0,200/3.6,0,active?'touch':'digital'));
const log=new TelemetryLog('0.14A.2-stageA'),input={steer:0};
function capture(t){log.capture(t,v,input,{frameMs:16.667,renderMs:1,steps:4,backlogMs:0,discardedMs:0,mode:c.mode,steering:c,pad:p,tilt,now:performance.now(),location:'pad'});return Object.fromEntries(columns.map((name,i)=>[name,log.rows.at(-1)[i]]));}
v.reset(0,0,0,200/3.6);
pad.fire('pointerdown',30);pad.fire('pointermove',80);input.steer=c.value(c.raw,v.speed,DT,'touch');
let row=capture(.1);assert.equal(row.touch_fraction,.5);assert.equal(row.touch_active,1);assert.equal(row.steer_demand,Math.round(.5**1.45*1000)/1000);
assert.ok(row.steer_target_pre_rate>row.steer_processed_command);assert.equal(row.steer_final_command,row.steer_input);
assert.equal(row.driving_experience,0);assert.equal(row.assist_available,0);assert.equal(row.assist_correction,0);assert.equal(row.skid_detected,null);assert.equal(row.skid_phase,null);assert.equal(row.yaw_accel_deg_s2,null);
assert.equal(row.forward_motion_valid,1);assert.ok(row.input_age_at_sample_ms>=0);
for(const type of ['pointerup','pointercancel','lostpointercapture']){
 pad.fire('pointerdown',0);pad.fire('pointermove',100);pad.fire(type,100);
 assert.equal(p.fraction,0);assert.equal(p.active,false);assert.equal(c.raw,0);assert.equal(c.mode,'digital');
}
pad.touch('touchstart',0);pad.touch('touchmove',-40);assert.equal(p.fraction,-.4);pad.touch('touchcancel',-40);assert.equal(p.fraction,0);assert.equal(p.active,false);
pad.fire('pointerdown',0);pad.fire('pointermove',100);p.reset();assert.equal(p.receivedTime,null);assert.equal(p.eventTime,null);pad.fire('pointermove',100);assert.equal(p.fraction,0);
row=capture(.2);assert.equal(row.input_received_timestamp_ms,null);assert.equal(row.touch_fraction,0);
// Coordinate observations are symmetric, invariant to yaw; no detector implied.
for(const yaw of [0,.8,-2])for(const sign of [-1,1]){
 v.reset(0,0,yaw,20);v.setVelocity(20*Math.sin(yaw)+sign*4*Math.cos(yaw),0,20*Math.cos(yaw)-sign*4*Math.sin(yaw));
 row=capture(log.last+.1);assert.ok(Math.abs(row.local_long_m_s-20)<.0011);assert.ok(Math.abs(row.local_lat_m_s-sign*4)<.0011);assert.ok(row.beta_deg*sign>0);assert.ok(row.FR_motion_deg*sign>0);
}
v.reset(0,0,0,0);row=capture(log.last+.1);assert.equal(row.forward_motion_valid,0);assert.equal(row.FR_motion_deg,null);
v.setVelocity(0,0,-10);row=capture(log.last+.1);assert.equal(row.forward_motion_valid,0);
v.reset(0,0,0,20);v.wheels[0].contact=false;row=capture(log.last+.1);assert.equal(row.forward_motion_valid,0);
const before=JSON.stringify([v.nodes,c.position,c.target,input]);capture(log.last+.1);assert.equal(JSON.stringify([v.nodes,c.position,c.target,input]),before,'Sampling cannot mutate vehicle/controller/input');
const meta=JSON.parse(log.export(30).split('\n')[1]);assert.equal(meta.format,'DrivingLabCSV/4');assert.match(meta.drivingDiagnostics.assistance,/NOT|not implemented/);assert.ok(log.rows.every(r=>r.length===columns.length));
assert.equal(columns.indexOf('raf_hz'),52);assert.equal(columns.indexOf('FR_load_N'),53);assert.equal(columns.indexOf('driving_experience'),97);
console.log(JSON.stringify({stage:'A',fieldsAdded:drivingDiagnosticColumns.length,columns:columns.length,checks:'finger before shaping, target/command, release/cancel/reset, yaw signs, reverse/stop/contact validity, unavailable detector, no feedback, CSV append compatibility'}));
